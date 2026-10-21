import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { config, isGeminiConfigured, isSupabaseConfigured } from '../config.js';
import {
  getOrCreateSession,
  confirmStudentProfile,
  resetSession,
} from '../services/sessionStore.js';
import { processStudentMessage } from '../services/extraction.js';
import {
  persistChatTurn,
  confirmProfileInDb,
} from '../services/supabase.js';

interface ChatRequestBody {
  message: string;
  sessionId?: string;
  structuredAnswer?: any;
}

interface ConfirmRequestBody {
  sessionId: string;
}

interface ResetRequestBody {
  sessionId?: string;
}

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Health check endpoint to verify backend status & service configurations
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'ibot-career-ladder-backend',
      timestamp: new Date().toISOString(),
      geminiConfigured: isGeminiConfigured(),
      supabaseConfigured: isSupabaseConfigured(),
      model: config.geminiModel,
    };
  });

  // 2. Dynamic Chat & Profile Extraction endpoint
  fastify.post(
    '/api/chat',
    {
      schema: {
        body: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', minLength: 1, maxLength: 3000 },
            sessionId: { type: 'string', maxLength: 100 },
            structuredAnswer: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply) => {
      const { message, sessionId, structuredAnswer } = request.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'The message field must be a non-empty string.',
        });
      }

      try {
        // Retrieve or initialize session state
        const session = getOrCreateSession(sessionId);

        // Process message with Gemini extraction & dynamic follow-up selection
        const result = await processStudentMessage(message.trim(), session, structuredAnswer);

        // Asynchronously persist to the 6-table Supabase schema without blocking HTTP response
        persistChatTurn({
          sessionId: result.session.sessionId,
          userMessage: message.trim(),
          assistantReply: result.reply,
          profile: result.session.profile,
          activeCategory: result.activeQuestionCategory,
          suggestedFollowUps: result.suggestedFollowUps,
          changeHistory: result.session.changeHistory,
        }).catch((err) => fastify.log.error(err, 'Failed to persist turn to Supabase'));

        return reply.status(200).send({
          sessionId: result.session.sessionId,
          reply: result.reply,
          profile: result.session.profile,
          missingFields: result.session.missingFields,
          sectionAnalyses: result.session.sectionAnalyses,
          completionPercentage: result.session.completionPercentage,
          activeQuestionCategory: result.activeQuestionCategory,
          suggestedFollowUps: result.suggestedFollowUps,
          changeHistory: result.session.changeHistory,
        });
      } catch (err: any) {
        fastify.log.error(err, 'Failed to process chat message');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred while communicating with the AI service.',
        });
      }
    }
  );

  // 3. Confirm Profile endpoint
  fastify.post(
    '/api/chat/confirm',
    {
      schema: {
        body: {
          type: 'object',
          required: ['sessionId'],
          properties: {
            sessionId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ConfirmRequestBody }>, reply: FastifyReply) => {
      const { sessionId } = request.body;
      const session = confirmStudentProfile(sessionId);

      // Persist confirmed status and consent record to Supabase
      confirmProfileInDb(session.sessionId).catch((err) =>
        fastify.log.error(err, 'Failed to confirm profile in Supabase')
      );

      return reply.status(200).send({
        status: 'confirmed',
        sessionId: session.sessionId,
        profile: session.profile,
        completionPercentage: session.completionPercentage,
        message: 'Student profile confirmed successfully.',
      });
    }
  );

  // 4. Reset Session endpoint
  fastify.post(
    '/api/chat/reset',
    async (request: FastifyRequest<{ Body?: ResetRequestBody }>, reply: FastifyReply) => {
      const sessionId = request.body?.sessionId;
      const session = sessionId ? resetSession(sessionId) : getOrCreateSession();

      return reply.status(200).send({
        status: 'reset',
        sessionId: session.sessionId,
        profile: session.profile,
        missingFields: session.missingFields,
        completionPercentage: session.completionPercentage,
        activeQuestionCategory: session.activeQuestionCategory,
      });
    }
  );
};

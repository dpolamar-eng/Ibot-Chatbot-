import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { config, isGeminiConfigured, isSupabaseConfigured } from '../config.js';
import {
  getOrCreateSession,
  confirmStudentProfile,
  resetSession,
} from '../services/sessionStore.js';
import { processStudentMessage } from '../services/extraction.js';
import { generateQaReply, generateValidationReply } from '../services/gemini.js';
import {
  persistChatTurn,
  confirmProfileInDb,
} from '../services/supabase.js';

interface ChatRequestBody {
  message: string;
  sessionId?: string;
  structuredAnswer?: any;
  mode?: 'discovery' | 'qa' | 'validation';
  history?: Array<{ role: 'user' | 'model'; text: string }>;
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

  // 2. Dynamic Chat & Profile Extraction endpoint (supports Discovery & QA modes)
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
            mode: { type: 'string', enum: ['discovery', 'qa', 'validation'] },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  text: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply) => {
      const { message, sessionId, structuredAnswer, mode = 'discovery', history } = request.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'The message field must be a non-empty string.',
        });
      }

      try {
        // Retrieve or initialize session state
        const session = getOrCreateSession(sessionId);

        // MODE 0: CAPABILITY VALIDATION MODE (14 Capability Dimensions Assessment)
        if (mode === 'validation') {
          const valResult = await generateValidationReply(
            message.trim(),
            session.validationState,
            session.profile
          );

          session.validationState = valResult.validationState;

          if (valResult.report) {
            session.profile.capabilityAssessment = valResult.report;
          }

          // Asynchronously persist to Supabase schema
          persistChatTurn({
            sessionId: session.sessionId,
            userMessage: message.trim(),
            assistantReply: valResult.reply,
            profile: session.profile,
            activeCategory: 'capability_validation',
            suggestedFollowUps: valResult.followupQuestions,
            changeHistory: session.changeHistory,
          }).catch((err) => fastify.log.error(err, 'Failed to persist Validation turn to Supabase'));

          return reply.status(200).send({
            sessionId: session.sessionId,
            reply: valResult.reply,
            profile: session.profile,
            missingFields: session.missingFields,
            sectionAnalyses: session.sectionAnalyses,
            completionPercentage: session.completionPercentage,
            activeQuestionCategory: 'capability_validation',
            suggestedFollowUps: valResult.followupQuestions,
            followupQuestions: valResult.followupQuestions,
            changeHistory: session.changeHistory,
            report: valResult.report,
          });
        }

        // MODE 1: Q&A MODE (Career Doubts & Goal Role Pathway Formulation)
        // Does NOT interrogate the user with missing-profile survey questions.
        if (mode === 'qa') {
          const qaResult = await generateQaReply(
            message.trim(),
            history || [],
            session.profile
          );

          // Asynchronously persist to the 6-table Supabase schema
          persistChatTurn({
            sessionId: session.sessionId,
            userMessage: message.trim(),
            assistantReply: qaResult.reply,
            profile: session.profile,
            activeCategory: 'career_qa',
            suggestedFollowUps: qaResult.followupQuestions,
            changeHistory: session.changeHistory,
          }).catch((err) => fastify.log.error(err, 'Failed to persist QA turn to Supabase'));

          return reply.status(200).send({
            sessionId: session.sessionId,
            reply: qaResult.reply,
            profile: session.profile,
            missingFields: session.missingFields,
            sectionAnalyses: session.sectionAnalyses,
            completionPercentage: session.completionPercentage,
            activeQuestionCategory: 'career_qa',
            suggestedFollowUps: qaResult.followupQuestions,
            followupQuestions: qaResult.followupQuestions,
            changeHistory: session.changeHistory,
          });
        }

        // MODE 2: GUIDED DISCOVERY MODE (Identifying People & Progressive Profile Extraction)
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
        }).catch((err) => fastify.log.error(err, 'Failed to persist Discovery turn to Supabase'));

        return reply.status(200).send({
          sessionId: result.session.sessionId,
          reply: result.reply,
          profile: result.session.profile,
          missingFields: result.session.missingFields,
          sectionAnalyses: result.session.sectionAnalyses,
          completionPercentage: result.session.completionPercentage,
          activeQuestionCategory: result.activeQuestionCategory,
          suggestedFollowUps: result.suggestedFollowUps,
          followupQuestions: result.suggestedFollowUps,
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

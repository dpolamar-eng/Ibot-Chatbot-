import { GoogleGenAI } from '@google/genai';
import { config, isGeminiConfigured } from '../config.js';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface ChatResponse {
  reply: string;
  followupQuestions: string[];
}

const SYSTEM_INSTRUCTION = `You are the Career Ladder Assistant, an intelligent AI career intelligence and guidance companion.

Career Ladder helps individuals across all industries, education levels, and experience levels move from:
Point A (Their current position) to Point B (Their desired career position).

You support two primary journeys seamlessly:
1. Journey A — Career Decided:
   - The individual knows their target destination (e.g., a backend developer aiming to become an AI Engineer, or an accountant pivoting to corporate finance).
   - Your goal: Understand Point A (current role, experience, capabilities, practical exposure), understand Point B (target career, transition motivations), and pinpoint capability gaps, uncertainties, and high-leverage development needs.
2. Journey B — Career Exploring:
   - The individual is uncertain or exploring career options (e.g., a commerce graduate considering marketing vs analytics, or a professional seeking a new field).
   - Your goal: Understand Point A (educational/professional background, strengths, existing skills, practical experience, work style preferences, constraints) to help explore viable career directions supported by clear reasoning.

Conversational Guidelines:
1. Universal & Industry-Agnostic: Welcome students, experienced professionals, and career switchers across tech, finance, business, healthcare, design, trades, and sciences.
2. Active Context: Acknowledge what has already been shared. Never repeat a question the individual has already answered.
3. One Focused Inquiry: Ask only one relevant follow-up question at a time to prevent cognitive overload.
4. Factual Integrity & Strict Separation: Never invent candidate capabilities, job roles, or credentials. Clearly distinguish declared facts from inferred suggestions or exploration avenues.
5. Dynamic Direction: Enable the user to transition between Career Decided and Career Exploring at any time.
6. Natural & Concise: Keep responses crisp, warm, and structured (2 to 4 short paragraphs or bullet points). Avoid jargon and walls of text.`;

// Initialize GoogleGenAI client singleton if API key is present
let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }
  return aiClient;
}

/**
 * Extracts 2-4 contextual follow-up chips based on the reply text and user query
 */
function extractFollowupQuestions(replyText: string, userMessage: string): string[] {
  const normalized = (replyText + ' ' + userMessage).toLowerCase();

  if (normalized.includes('switch') || normalized.includes('transition') || normalized.includes('pivot')) {
    return [
      'How do my skills transfer to this role?',
      'What are the biggest capability gaps?',
      'Transition timeline and milestones',
      'Recommended projects to prove readiness',
    ];
  }

  if (normalized.includes('explor') || normalized.includes('not sure') || normalized.includes('uncertain') || normalized.includes('options')) {
    return [
      'Compare viable directions for my background',
      'Which roles match my analytical strengths?',
      'High-growth career paths in this domain',
      'What are common entry points?',
    ];
  }

  if (normalized.includes('gap') || normalized.includes('learn') || normalized.includes('skill') || normalized.includes('study')) {
    return [
      'What skills should I prioritize first?',
      'How to build proof-of-work in this field',
      'Essential certifications or practical tools',
      'How to articulate my experience on a resume',
    ];
  }

  return [
    'Analyze my capability gaps for this role',
    'Explore career paths that fit my background',
    'How to transition from Point A to Point B',
    'What skills should I develop next?',
  ];
}

/**
 * Sends a message and bounded history to Gemini API and returns the generated reply.
 */
export async function generateChatReply(
  userMessage: string,
  history: ChatHistoryItem[] = []
): Promise<ChatResponse> {
  const client = getClient();

  if (!client) {
    return {
      reply:
        "⚠️ **Gemini API Key Required**\n\nTo enable dynamic AI responses, please set your `GEMINI_API_KEY` in `backend/.env`:\n\n1. Open `backend/.env` (or copy from `backend/.env.example`).\n2. Add your key: `GEMINI_API_KEY=AIzaSy...`\n3. Restart the backend server (`npm run dev` in `backend`).",
      followupQuestions: [
        'How to get a Gemini API key',
        'Software Development Roadmap',
        'Resume tips for college placements',
      ],
    };
  }

  try {
    // Bound history to the last 10 messages to maintain context without token bloat
    const boundedHistory = history.slice(-10);

    // Format contents array for Gemini API: [{ role: 'user' | 'model', parts: [{ text }] }]
    const contents: any[] = boundedHistory.map((item) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.text }],
    }));

    // Append the current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: userMessage.trim() }],
    });

    // Candidates for generation: primary model followed by resilient fallbacks
    const candidateModels = Array.from(
      new Set([
        config.geminiModel,
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash',
        'gemini-flash-latest',
      ])
    );

    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await client.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        // If it's a 503 (high demand) or 404 (model deprecated), continue to fallback model
        if (errMsg.includes('503') || errMsg.includes('404') || errMsg.includes('not found')) {
          continue;
        }
        throw err;
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    const replyText = response?.text || "I'm here to help with your career questions! What would you like to explore next?";
    const followupQuestions = extractFollowupQuestions(replyText, userMessage);

    return {
      reply: replyText,
      followupQuestions,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);

    // Rate limit or quota exhaustion (HTTP 429)
    if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('rate limit')) {
      return {
        reply:
          "⚠️ **Gemini API Rate Limit Reached**\n\nThe free Gemini API request quota has been temporarily reached. Please wait a minute before sending your next question, or verify your quota at Google AI Studio.",
        followupQuestions: ['Try again in a moment', 'Software Development Roadmap'],
      };
    }

    // High demand (HTTP 503)
    if (errorMsg.includes('503') || errorMsg.toLowerCase().includes('high demand')) {
      return {
        reply:
          "⚠️ **Gemini High Demand Notice**\n\nThe AI model servers are currently experiencing peak traffic. Please try asking your question again in a few seconds.",
        followupQuestions: ['Try asking again', 'Software Development Roadmap', 'Top DSA topics for placements'],
      };
    }

    // Invalid API key
    if (errorMsg.toLowerCase().includes('api key') || errorMsg.includes('400') || errorMsg.includes('403')) {
      return {
        reply:
          "⚠️ **Invalid Gemini API Key**\n\nThe Gemini API rejected the configured key. Please check that `GEMINI_API_KEY` in `backend/.env` is valid and active at https://aistudio.google.com.",
        followupQuestions: ['How to check API key', 'Software Development Roadmap'],
      };
    }

    // General fallback
    return {
      reply: `⚠️ **AI Service Error:** Unable to reach Gemini API (${errorMsg.slice(0, 150)}). Please check your internet connection or verify the backend server logs.`,
      followupQuestions: ['Try asking again', 'Software Development Roadmap'],
    };
  }
}

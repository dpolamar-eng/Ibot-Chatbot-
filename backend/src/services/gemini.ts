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

const SYSTEM_INSTRUCTION = `You are IBOT, an expert and friendly Career Discovery Assistant in the Identify phase of Ottobon's IBOT platform.

Your primary objective is to assist students, freshers, and candidates in exploring their career direction, understanding required technical capabilities, building standout projects, and preparing for competitive placement interviews.

Core Conversational Guidelines:
1. Tone & Style: Communicate in simple, accessible, professional English. Be supportive, practical, and mentor-like.
2. Active Context: Acknowledge what the student has already shared. Never repeat a question they have already answered.
3. Focused Inquiries: Ask only one relevant follow-up question at a time to prevent cognitive overload. Do not bombard the candidate with multiple unrelated questions.
4. Conciseness: Keep responses crisp and easy to read (max 2 to 4 short paragraphs or bullet points). Avoid overwhelming walls of text.
5. Factual Integrity: Never invent candidate qualifications or projects.
6. Boundary Awareness: Clearly distinguish self-reported candidate aspirations and skills from verified assessment evidence (never claim self-reported skills are formally verified).
7. Placement Actionability: When asked about roadmaps, coding interview prep, DSA, frameworks, or resume tips, provide high-yield, placement-tested guidance.
8. Conversational Flow: Never mention mechanical step numbers or tell the user to 'continue with step above'. Focus naturally on career discovery, skills advice, and relevant follow-ups.`;

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
 * Extracts 2-4 contextual follow-up questions based on the reply text and user query
 */
function extractFollowupQuestions(replyText: string, userMessage: string): string[] {
  const normalized = (replyText + ' ' + userMessage).toLowerCase();

  if (normalized.includes('dsa') || normalized.includes('algorithm') || normalized.includes('leetcode')) {
    return [
      'Top 10 most common interview patterns',
      'How to master Dynamic Programming',
      'System Design basics for freshers',
      'Top full-stack project ideas for placements',
    ];
  }

  if (normalized.includes('data') || normalized.includes('analytics') || normalized.includes('sql')) {
    return [
      'Top SQL queries asked in analyst interviews',
      'Best Kaggle datasets to build a portfolio',
      'PowerBI vs Tableau: which is better?',
      'How to get started in AI / ML?',
    ];
  }

  if (normalized.includes('ai') || normalized.includes('ml') || normalized.includes('machine learning')) {
    return [
      'How to build my first RAG app with LangChain',
      'What math is actually needed for ML?',
      'Fine-tuning LLMs vs Prompt Engineering',
      'Software Development Roadmap',
    ];
  }

  if (normalized.includes('resume') || normalized.includes('cv') || normalized.includes('placement')) {
    return [
      'How to write bullet points with measurable impact',
      'Common ATS resume mistakes to avoid',
      'Projects to add to strengthen this resume',
      'Top DSA topics asked in college placements',
    ];
  }

  return [
    'Software Development Roadmap',
    'How to get started in AI / ML?',
    'Top full-stack project ideas for placements',
    'Resume tips for college placements',
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

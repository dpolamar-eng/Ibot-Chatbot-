import { StudentCareerProfile, SectionAnalysis } from '../types/careerDiscovery';

export interface ChatHistoryPayload {
  role: 'user' | 'model';
  text: string;
}

export interface ChatResponsePayload {
  sessionId: string;
  reply: string;
  profile: StudentCareerProfile;
  missingFields: string[];
  sectionAnalyses?: Record<string, SectionAnalysis>;
  completionPercentage: number;
  activeQuestionCategory: string;
  suggestedFollowUps?: string[];
  followupQuestions?: string[]; // fallback alias
  changeHistory?: Array<{ field: string; oldValue: any; newValue: any; timestamp: string }>;
}

/**
 * Sends a student message, optional session ID, and optional structured answer
 * to the backend Gemini chat and extraction endpoint.
 */
export async function sendChatMessage(
  message: string,
  history: ChatHistoryPayload[] = [],
  sessionId?: string,
  structuredAnswer?: any,
  mode: 'discovery' | 'qa' = 'discovery'
): Promise<ChatResponsePayload> {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const endpoint = `${baseUrl}/api/chat`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s safety timeout

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        structuredAnswer,
        mode,
        history,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const errMsg = errorJson?.message || `Backend returned error code ${response.status}`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    return {
      ...data,
      followupQuestions: data.suggestedFollowUps || data.followupQuestions || [],
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out while waiting for Gemini AI response.');
    }
    throw error;
  }
}

/**
 * Confirms student profile when they approve the review card.
 */
export async function confirmStudentProfileApi(sessionId: string): Promise<any> {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const endpoint = `${baseUrl}/api/chat/confirm`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    throw new Error('Failed to confirm profile');
  }

  return await response.json();
}

/**
 * Resets the session on the backend.
 */
export async function resetSessionApi(sessionId?: string): Promise<any> {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const endpoint = `${baseUrl}/api/chat/reset`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    throw new Error('Failed to reset session');
  }

  return await response.json();
}

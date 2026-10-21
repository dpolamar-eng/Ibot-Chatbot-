import { GoogleGenAI } from '@google/genai';
import { config, isGeminiConfigured } from '../config.js';
import {
  type ProfileSession,
  type ProfileSectionKey,
  type SkillProficiency,
  type SectionAnalysis,
} from '../types/profile.js';
import { mergeProfileUpdates, type ProfileUpdatePayload } from './sessionStore.js';

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

export interface ExtractedPayload {
  extractedProfile?: ProfileUpdatePayload;
  conversationalReply: string;
  suggestedFollowUps: string[];
  activeQuestionCategory: ProfileSectionKey | 'review' | 'general_qa';
  clarificationQuestion?: string | null;
}

/**
 * Builds the refined system instruction ensuring factual integrity,
 * clear separation between self-reported data and AI suggestions,
 * and intelligent handling of partial/absent/skipped sections.
 */
function buildPromptInstructions(session: ProfileSession): string {
  const currentProfile = session.profile;
  const analyses = session.sectionAnalyses;

  // Format a clear summary of each section's state for Gemini
  const sectionSummaryText = Object.values(analyses)
    .map((a: SectionAnalysis) => {
      if (a.state === 'complete') {
        return `✅ [${a.label.toUpperCase()}]: Complete (${a.collectedSummary}) - DO NOT ASK AGAIN`;
      }
      if (a.state === 'explicitly_absent') {
        return `⚪ [${a.label.toUpperCase()}]: Explicitly Absent by user (${a.collectedSummary}) - DO NOT ASK AGAIN`;
      }
      if (a.state === 'skipped') {
        return `⏭️ [${a.label.toUpperCase()}]: Skipped by user - DO NOT ASK AGAIN`;
      }
      if (a.state === 'partial') {
        return `⚠️ [${a.label.toUpperCase()}]: Partially Collected (${a.collectedSummary}) - Missing: ${a.missingDetails.join(', ')}`;
      }
      return `❌ [${a.label.toUpperCase()}]: Unaddressed - Missing: ${a.missingDetails.join(', ')}`;
    })
    .join('\n');

  return `You are the Career Ladder Assistant, an intelligent career intelligence and guidance companion.

MISSION:
Have a natural, personalized career guidance conversation with the individual to map:
- Point A: Their current position (role, background, experience level, existing skills, practical exposure).
- Point B: Their desired destination or exploration trajectory.

CAREER INTENT DETECTION:
1. Journey A — Career Decided (careerIntent: 'career_decided'):
   - The user has a known destination (e.g., "I am a backend developer and want to become an AI Engineer" or "I am an accountant wanting to move into product management").
   - Focus on: Understanding Point A capabilities, understanding Point B destination, transition motivations, capability gaps, and development priorities.
2. Journey B — Career Exploring (careerIntent: 'career_exploring'):
   - The user does NOT know their destination (e.g., "I completed a commerce degree, but I have no idea which career to choose").
   - Focus on: Educational/professional background, strengths, interests, preferred work styles, constraints, and exploring viable directions.
3. If intent shifts during conversation, update careerIntent immediately without resistance.

CURRENT SECTION STATUS:
${sectionSummaryText}

RAW COLLECTED PROFILE DATA:
${JSON.stringify(currentProfile, null, 2)}

STRICT DATA INTEGRITY & EXTRACTION RULES:
1. FACTUAL FIDELITY:
   - Extract ONLY what the user explicitly communicated.
   - NEVER invent or assume qualifications, current roles, skills, or employment history.
   - If information is not mentioned, use null (never guess).
2. PROFICIENCY IS NULL BY DEFAULT:
   - When a user lists a skill (e.g. "I know Python and financial modeling"), extract proficiency as null.
   - ONLY set proficiency ('exploring', 'practicing', or 'proficient') if the user explicitly stated their experience level.
3. SUPPORT FOR WORKING PROFESSIONALS & NON-STUDENTS:
   - Do NOT ask working professionals for college graduation years or college coursework. If they have job experience, their experience is primary.
   - Support non-technical fields (finance, marketing, logistics, healthcare, design, operations, trades).
4. SUPPORT FOR ABSENCE & SKIPS:
   - If user states they don't have projects or work experience, set practicalExperience: { hasProjects: false, summaryNote: "No formal projects yet" }. Do NOT press them repeatedly.
   - If user asks to skip a section, mark that section with skipped: true.
5. CORRECTIONS & REMOVALS:
   - If user corrects earlier details (e.g. "Actually I am a marketing manager", "Remove Java"), honor the update immediately.
6. SEPARATE INFERRED AI SUGGESTIONS FROM DECLARED FACTS:
   - Any suggested exploration avenues or potential capability gaps belong in "aiSuggestions". NEVER place AI suggestions into the user's declared "skills" or "goals".
7. AMBIGUITY & CLARIFICATIONS:
   - If an answer is unclear, set clarificationNeeded and ask for gentle clarification.

CONVERSATION & QUESTION GUIDELINES:
1. Concise & Mentor-Like: Acknowledge what the user shared in 1-2 thoughtful sentences.
2. Answering User Queries: If they ask a direct career question (e.g. how skills transfer, what a role entails), answer crisply before moving to profiling.
3. NEXT QUESTION SELECTION:
   - If a section is PARTIAL, ask for the missing sub-detail.
   - Otherwise, select the next UNADDRESSED section:
     * Point A: Current role / professional background & education
     * Skills & capabilities (technical, domain, or soft skills)
     * Practical experience or work accomplishments
     * Interests, work style, or problem spaces
     * Point B: Destination role & timeline (if Career Decided) OR exploration focus & priorities (if Career Exploring)
   - NEVER ask for information already marked Complete, Explicitly Absent, or Skipped.
   - Ask only ONE single question at a time.
4. WHEN ALL SECTIONS ARE SATISFIED:
   - Celebrate completing the profile and invite the user to review their Point A -> Point B synthesis!
   - Set "activeQuestionCategory": "review".
5. PROVIDE 2 to 4 "suggestedFollowUps" (relevant quick chips for easy tapping).

OUTPUT FORMAT:
Return strictly a valid JSON object matching this schema:
{
  "extractedProfile": {
    "careerIntent": "career_decided" | "career_exploring" | "uncertain" | null,
    "aboutYou": {
      "currentStage": string | null,
      "stageLabel": string | null,
      "currentRole": string | null,
      "yearsOfExperience": string | null,
      "industry": string | null,
      "skipped": boolean | null
    },
    "education": {
      "degree": string | null,
      "field": string | null,
      "academicFocus": string[],
      "graduationYear": string | null,
      "certifications": string[],
      "skipped": boolean | null
    },
    "skills": [ { "name": string, "category": string, "proficiency": "exploring" | "practicing" | "proficient" | null } ],
    "removeSkills": string[],
    "skillsExplicitlyAbsent": boolean | null,
    "practicalExperience": {
      "hasProjects": boolean | null,
      "hasExperience": boolean | null,
      "skipped": boolean | null,
      "summaryNote": string | null,
      "projects": [ { "title": string, "organizationOrContext": string, "description": string, "techStack": string[] } ]
    },
    "interests": {
      "primaryTracks": string[],
      "workEnvironment": string | null,
      "preferredDomains": string[],
      "motivations": string[],
      "constraints": string[],
      "skipped": boolean | null
    },
    "goals": {
      "targetRoles": string[],
      "destinationSummary": string | null,
      "topPriority": string | null,
      "timeline": string | null,
      "transitionMotivations": string | null,
      "capabilityGapsOrUncertainties": string[],
      "skipped": boolean | null
    },
    "aiSuggestions": {
      "suggestedSkillsToExplore": string[],
      "suggestedRoles": string[],
      "suggestedDirectionsToExplore": string[],
      "potentialCapabilityGaps": string[],
      "clarificationNeeded": string | null
    }
  },
  "conversationalReply": string,
  "suggestedFollowUps": string[],
  "activeQuestionCategory": "about_you" | "education" | "skills" | "practical_experience" | "interests" | "goals" | "review" | "general_qa"
}`;
}

/**
 * Fallback questions if AI generation or parsing fails.
 */
function getDeterministicFallback(session: ProfileSession, userMessage: string): ExtractedPayload {
  const missing = session.missingFields;
  const reply = `Got it, I've noted that down. Let's continue charting your path from Point A to Point B.`;

  if (missing.includes('about_you') || missing.includes('education')) {
    return {
      conversationalReply: `${reply} Could you share a bit more about your current position or educational background? (e.g. your current role, field of study, or years of experience).`,
      suggestedFollowUps: ['Working Professional', 'College Student', 'Career Switcher', 'Recent Graduate'],
      activeQuestionCategory: 'about_you',
    };
  }

  if (missing.includes('skills')) {
    return {
      conversationalReply: `${reply} What key skills, tools, or domain capabilities do you currently possess or work with most frequently?`,
      suggestedFollowUps: ['Technical & Programming', 'Business & Analytics', 'Management & Operations', 'Exploring from scratch'],
      activeQuestionCategory: 'skills',
    };
  }

  if (missing.includes('practical_experience')) {
    return {
      conversationalReply: `${reply} What practical experience, notable accomplishments, or projects have you worked on? (Feel free to skip if you are just starting out!)`,
      suggestedFollowUps: ['Professional work experience', 'Personal / Academic projects', 'No formal experience yet (Skip)'],
      activeQuestionCategory: 'practical_experience',
    };
  }

  if (missing.includes('interests')) {
    return {
      conversationalReply: `${reply} What industries, problem domains, or work environments appeal to you most?`,
      suggestedFollowUps: ['Tech & AI Innovation', 'Finance & Business', 'Remote / Flexible Culture', 'Skip for now'],
      activeQuestionCategory: 'interests',
    };
  }

  if (missing.includes('goals')) {
    return {
      conversationalReply: `${reply} What is your target career destination (Point B), or are you actively exploring different directions?`,
      suggestedFollowUps: ['I have a specific target role', 'I am exploring options', 'Looking to transition within 6 months'],
      activeQuestionCategory: 'goals',
    };
  }

  return {
    conversationalReply: `Excellent! We have mapped out your core Point A to Point B profile. Please review your summary below and let me know if anything needs updating!`,
    suggestedFollowUps: ['Confirm Profile', 'Adjust my target destination', 'Update my skills', 'Make a correction'],
    activeQuestionCategory: 'review',
  };
}

/**
 * Analyzes the user's message, extracts structured profile updates with strict factual integrity,
 * merges them into the session, and generates a contextual, dynamic follow-up question.
 */
export async function processStudentMessage(
  userMessage: string,
  session: ProfileSession,
  structuredInput?: any
): Promise<{
  reply: string;
  session: ProfileSession;
  suggestedFollowUps: string[];
  activeQuestionCategory: ProfileSectionKey | 'review' | 'general_qa';
}> {
  // If structured input was passed directly from a UI widget:
  if (structuredInput) {
    mergeProfileUpdates(session.sessionId, structuredInput);
  }

  const client = getClient();
  let extractedResult: ExtractedPayload | null = null;

  if (client) {
    try {
      const systemInstruction = buildPromptInstructions(session);

      const contents: any[] = session.history.slice(-8).map((h) => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      }));

      contents.push({
        role: 'user',
        parts: [{ text: userMessage.trim() }],
      });

      const candidateModels = Array.from(
        new Set([
          config.geminiModel,
          'gemini-3.5-flash-lite',
          'gemini-3.5-flash',
          'gemini-flash-latest',
        ])
      );

      for (const modelName of candidateModels) {
        try {
          const response = await client.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.3,
              maxOutputTokens: 1500,
            },
          });

          if (response && response.text) {
            const rawText = response.text.trim();
            try {
              extractedResult = JSON.parse(rawText) as ExtractedPayload;
              break;
            } catch (jsonErr) {
              const cleaned = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
              extractedResult = JSON.parse(cleaned) as ExtractedPayload;
              break;
            }
          }
        } catch (err: any) {
          const msg = err?.message || '';
          if (msg.includes('503') || msg.includes('404') || msg.includes('not found')) {
            continue;
          }
          throw err;
        }
      }
    } catch (apiError) {
      console.warn('Gemini extraction error, utilizing deterministic progression:', apiError);
    }
  }

  if (!extractedResult) {
    extractedResult = getDeterministicFallback(session, userMessage);
  }

  // Merge any extracted fields into session profile
  if (extractedResult.extractedProfile) {
    mergeProfileUpdates(session.sessionId, extractedResult.extractedProfile);
  }

  // Record history
  session.history.push({ role: 'user', text: userMessage.trim() });
  session.history.push({ role: 'model', text: extractedResult.conversationalReply });
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }

  // Determine active category based on actual completeness
  if (session.missingFields.length === 0) {
    extractedResult.activeQuestionCategory = 'review';
  } else if (!extractedResult.activeQuestionCategory || extractedResult.activeQuestionCategory === 'general_qa') {
    extractedResult.activeQuestionCategory = session.missingFields[0];
  }

  return {
    reply: extractedResult.conversationalReply,
    session,
    suggestedFollowUps: extractedResult.suggestedFollowUps || [],
    activeQuestionCategory: extractedResult.activeQuestionCategory,
  };
}

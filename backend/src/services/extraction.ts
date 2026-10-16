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
        return `⚪ [${a.label.toUpperCase()}]: Explicitly Absent by student (${a.collectedSummary}) - DO NOT ASK AGAIN`;
      }
      if (a.state === 'skipped') {
        return `⏭️ [${a.label.toUpperCase()}]: Skipped by student - DO NOT ASK AGAIN`;
      }
      if (a.state === 'partial') {
        return `⚠️ [${a.label.toUpperCase()}]: Partially Collected (${a.collectedSummary}) - Missing: ${a.missingDetails.join(', ')}`;
      }
      return `❌ [${a.label.toUpperCase()}]: Unaddressed - Missing: ${a.missingDetails.join(', ')}`;
    })
    .join('\n');

  return `You are IBOT, an expert and trustworthy Career Capability Assistant in the Identify phase of Ottobon's IBOT platform.

MISSION:
Have a natural, supportive career conversation with a student to progressively build an accurate, self-reported Career Profile.

CURRENT SECTION STATUS:
${sectionSummaryText}

RAW COLLECTED PROFILE DATA:
${JSON.stringify(currentProfile, null, 2)}

STRICT DATA INTEGRITY & EXTRACTION RULES:
1. FACTUAL FIDELITY:
   - Extract ONLY what the student explicitly communicated.
   - NEVER invent or assume qualifications, degrees, skills, or projects.
   - If information is not mentioned, use null (do not guess).
2. PROFICIENCY IS NULL BY DEFAULT:
   - When a student lists a skill (e.g. "I know Python and SQL"), extract proficiency as null.
   - ONLY set proficiency ('exploring', 'practicing', or 'proficient') if the student explicitly stated their experience level (e.g., "I'm a beginner in Python", "I have advanced proficiency in SQL").
3. SUPPORT FOR ABSENCE & SKIPS:
   - If the student states "I don't have any projects yet" or "no work experience", set practicalExperience: { hasProjects: false, summaryNote: "No practical projects yet" }. Do NOT press them repeatedly.
   - If the student asks to skip a section (e.g. "skip this"), mark that section with skipped: true.
   - If the student states they don't know any technical skills yet, set skillsExplicitlyAbsent: true.
4. CORRECTIONS & REMOVALS:
   - If the student corrects an earlier answer (e.g. "Actually I graduate in 2027, not 2026"), extract the new value.
   - If the student asks to remove something (e.g. "Remove Java, I only know Python"), set removeSkills: ["Java"].
5. SEPARATE AI SUGGESTIONS FROM SELF-REPORTED FACTS:
   - If you want to suggest complementary skills to learn (e.g., Docker, AWS) or potential roles, put them inside "aiSuggestions.suggestedSkillsToExplore" or "aiSuggestions.suggestedRoles".
   - NEVER place AI suggestions into the student's self-reported "skills" array.
6. AMBIGUITY & CLARIFICATIONS:
   - If an answer is vague (e.g. "I do computer stuff"), set clarificationNeeded and ask for gentle clarification.

CONVERSATION & QUESTION GUIDELINES:
1. Warm & Practical: Acknowledge what the student shared in 1-2 concise, mentor-like sentences.
2. Answering Student Queries: If they asked a career question (e.g., roadmap, placement tips), give a high-yield, compact answer first.
3. NEXT QUESTION SELECTION:
   - If a section is PARTIAL (e.g. degree is B.Tech, but major is missing), ask specifically for the missing sub-detail.
   - Otherwise, select the next UNADDRESSED section following this priority:
     1) Education / Major & Graduation Year
     2) Technical Skills
     3) Practical Experience (projects, coursework builds, or internships)
     4) Interests & Preferred Work Environment
     5) Career Goals & Target Roles
   - NEVER ask for information that is already marked Complete, Explicitly Absent, or Skipped.
   - Ask only ONE single question at a time.
4. WHEN ALL SECTIONS ARE SATISFIED:
   - Warmly celebrate completing the profile and invite the student to review the summary card!
   - Set "activeQuestionCategory": "review".
5. PROVIDE 2 to 4 "suggestedFollowUps" (relevant quick chips for easy tapping).

OUTPUT FORMAT:
Return strictly a valid JSON object matching this schema:
{
  "extractedProfile": {
    "aboutYou": { "currentStage": string | null, "stageLabel": string | null, "skipped": boolean | null },
    "education": { "degree": string | null, "field": string | null, "academicFocus": string[], "graduationYear": string | null },
    "skills": [ { "name": string, "category": string, "proficiency": "exploring" | "practicing" | "proficient" | null } ],
    "removeSkills": string[],
    "skillsExplicitlyAbsent": boolean | null,
    "practicalExperience": { "hasProjects": boolean | null, "skipped": boolean | null, "summaryNote": string | null, "projects": [ { "title": string, "description": string, "techStack": string[] } ] },
    "interests": { "primaryTracks": string[], "workEnvironment": string | null, "preferredDomains": string[], "skipped": boolean | null },
    "goals": { "targetRoles": string[], "topPriority": string | null, "timeline": string | null, "skipped": boolean | null },
    "aiSuggestions": { "suggestedSkillsToExplore": string[], "suggestedRoles": string[], "clarificationNeeded": string | null }
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
  const reply = `Got it, I've noted that down. Let's continue shaping your profile.`;

  if (missing.includes('education') || missing.includes('about_you')) {
    return {
      conversationalReply: `${reply} What degree and major or branch are you currently studying, and what is your target graduation year?`,
      suggestedFollowUps: ['B.Tech CSE (2026)', 'B.Tech IT (2027)', 'BCA / MCA', 'Recent Graduate'],
      activeQuestionCategory: 'education',
    };
  }

  if (missing.includes('skills')) {
    return {
      conversationalReply: `${reply} What programming languages, tools, or frameworks have you worked with so far? (You can also mention if you are just starting out).`,
      suggestedFollowUps: ['Python & SQL', 'React & JavaScript', 'Java & DSA', 'No coding skills yet'],
      activeQuestionCategory: 'skills',
    };
  }

  if (missing.includes('practical_experience')) {
    return {
      conversationalReply: `${reply} Have you worked on any practical projects, coursework builds, or internships? (If you don't have projects yet, that's completely fine to state!)`,
      suggestedFollowUps: ['I built a web project', 'No projects yet, focusing on theory', 'Skip this question'],
      activeQuestionCategory: 'practical_experience',
    };
  }

  if (missing.includes('interests')) {
    return {
      conversationalReply: `${reply} What tech problem spaces or domains interest you most? (e.g., Cloud, AI/ML, FinTech, Full-Stack)`,
      suggestedFollowUps: ['Cloud & Distributed Systems', 'AI / ML Platforms', 'FinTech & Analytics', 'Skip for now'],
      activeQuestionCategory: 'interests',
    };
  }

  if (missing.includes('goals')) {
    return {
      conversationalReply: `${reply} What target job roles or placement aspirations are you working towards?`,
      suggestedFollowUps: ['Software Engineer (SDE)', 'Data Engineer', 'Backend Developer', 'Frontend Developer'],
      activeQuestionCategory: 'goals',
    };
  }

  return {
    conversationalReply: `Awesome! We have gathered all the key self-reported sections. Please review your profile summary below and let me know if anything needs updating!`,
    suggestedFollowUps: ['Confirm Profile', 'Change my skills', 'Change my graduation year', 'Change target roles'],
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

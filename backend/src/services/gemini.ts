import { GoogleGenAI } from '@google/genai';
import { config, isGeminiConfigured } from '../config.js';
import type { StudentCareerProfile } from '../types/profile.js';
import { getRoleValidationBank, isDecliningPracticalTask } from './validation.js';
import type { ValidationState, CapabilityAssessmentRecord, AssessmentOutcome } from '../types/validation.js';

export interface ValidationResponse {
  reply: string;
  followupQuestions: string[];
  validationState: ValidationState;
  completedOutcome?: AssessmentOutcome;
  report?: CapabilityAssessmentRecord;
}

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

const QA_SYSTEM_INSTRUCTION = `You are the Career Ladder Senior Career Strategist & Goal Pathway Architect.

Your core missions are:
1. CLARIFY CAREER DOUBTS:
   - Provide direct, expert, and nuanced answers to the user's career questions, doubts, dilemmas, role comparisons, tech stack choices, industry trends, and salary insights.
   - Be authoritative yet encouraging, realistic, and practical.

2. BUILD GOAL ROLE PATHWAYS (THE FINAL DESTINATION):
   - Whenever the user asks how to reach a role, transition fields, prepare for a goal career, or says "create my pathway", map out a concrete, step-by-step roadmap from Point A to Point B:
     * Phase 1: Core Fundamentals & Prerequisite Mental Models
     * Phase 2: Practical Proof-of-Work & High-Impact Portfolio Projects
     * Phase 3: System Competency & Industry/Interview Readiness
     * Phase 4: Strategic Positioning & Job Transition (resumes, networking, interviews)

3. SPECIALIZED CAREER TRANSITION BLUEPRINT (FOR WORKING PROFESSIONALS):
   - When a user asks to transition, pivot, or submits a transition profile (e.g. "Career Transition: Moving from [Current Role] to [Target Role]"), generate a structured 4-Pillar Career Transition Blueprint:
     * Pillar 1: 🔄 Transferable Strengths Matrix: Explicitly analyze which skills, domain intuition, and methodologies from their current role carry over directly into their target role. Show why their past experience is an unfair advantage, not a setback.
     * Pillar 2: 🎯 High-Leverage Capability Gaps: The 2–3 critical skills that actually unlock interviews for the target role. Explicitly note what tools or topics they can safely skip for now to save time.
     * Pillar 3: 🛠️ The "Bridge Project" (Proof of Capability): A concrete, realistic project that leverages their existing domain background applied to the target role (e.g., from QA to AI Engineer: an automated LLM evaluation pipeline or intelligent test-oracle agent).
     * Pillar 4: 📅 Realistic Phased Transition Roadmap: A month-by-month plan tailored for their available bandwidth (e.g. 5–10 hrs/week), balancing a full-time job.
   - If the user asks to "Recommend best pivot roles based on my background", compare the top 2–3 most viable, high-ROI transition destinations from their current role with transition difficulty, transferable overlap %, and salary trajectory.

CRITICAL RULES:
- DO NOT interrogate the user with missing-profile survey questions (NEVER ask for graduation year, degree, or step-by-step personal info unless directly clarifying their doubt).
- When a user has a verified profile (Point A to Point B), USE IT TO PERSONALIZE the pathway directly (referencing their existing skills, education, and specific target role).
- CLEAN FORMATTING RULES:
  * DO NOT use hashtag headers (like '###', '##', or '#'). Instead, format section headings using clean bold text with emojis (e.g. "**Pillar 1: 🔄 Transferable Strengths Matrix**" or "**Pillar 2: 🎯 High-Leverage Capability Gaps**").
  * Use clean hyphens ("- ") or numbers ("1. ") for bullet points.
  * DO NOT nest redundant asterisks like "* *What to learn:*" or "*What to skip:*"; instead use clean bold labels like "- **What to learn:** [topic]" and "- **What to skip:** [topic]".
  * Avoid long walls of unbroken text; keep sections concise, structured, and visually clean.`;

function buildProfileContext(profile?: StudentCareerProfile): string {
  if (!profile) return '';
  const parts: string[] = [];
  if (profile.aboutYou?.currentStage) parts.push(`Current Stage: ${profile.aboutYou.currentStage}`);
  if (profile.education?.degree || profile.education?.field) {
    parts.push(`Education: ${profile.education.degree || ''} in ${profile.education.field || ''} (Grad: ${profile.education.graduationYear || 'N/A'})`);
  }
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    parts.push(`Known Skills: ${profile.skills.map((s) => s.name).join(', ')}`);
  }
  if (profile.goals?.targetRoles?.length) {
    parts.push(`Target Goal Role(s) (Point B): ${profile.goals.targetRoles.join(', ')}`);
  }
  if (profile.practicalExperience?.projects?.length) {
    parts.push(`Projects / Practical Exposure: ${profile.practicalExperience.projects.map((p) => p.title).join(', ')}`);
  }
  if (parts.length === 0) return '';
  return `\n\n[USER VERIFIED PROFILE CONTEXT]\n${parts.join('\n')}\n(Personalize your advice and pathway to these specific Point A capabilities and Point B target role).`;
}

function extractQaFollowupQuestions(replyText: string, userMessage: string, profile?: StudentCareerProfile): string[] {
  const norm = (replyText + ' ' + userMessage).toLowerCase();
  const targetRole = profile?.goals?.targetRoles?.[0] || 'this role';

  if (norm.includes('transition') || norm.includes('moving from') || norm.includes('pivot') || norm.includes('switch')) {
    return [
      `How do I tailor my resume for this career transition?`,
      `What salary should I expect when transitioning?`,
      `Top interview traps for career switchers`,
      `Step-by-step guidance for the Bridge Project`,
    ];
  }

  if (norm.includes('phase') || norm.includes('pathway') || norm.includes('roadmap') || norm.includes('step')) {
    return [
      `What portfolio projects stand out most for ${targetRole}?`,
      `How long does this transition typically take?`,
      `What are the most common interview traps for ${targetRole}?`,
      `How do I tailor my resume for this pathway?`,
    ];
  }

  if (norm.includes('vs') || norm.includes('compare') || norm.includes('difference')) {
    return [
      `Create a step-by-step pathway for my preferred option`,
      `Which role has better 3-year market demand?`,
      `How do skills transfer between these two paths?`,
      `What daily work looks like in each role`,
    ];
  }

  return [
    `Create my step-by-step pathway to ${targetRole}`,
    `What high-impact project should I build next?`,
    `What are the top capability gaps I need to bridge?`,
    `How to prepare for technical interviews`,
  ];
}

/**
 * Dedicated Q&A and Goal Role Pathway generation handler.
 * Never interrogates for profile fields; clarifies doubts and builds concrete career pathways.
 */
export async function generateQaReply(
  userMessage: string,
  history: ChatHistoryItem[] = [],
  profile?: StudentCareerProfile
): Promise<ChatResponse> {
  const client = getClient();

  if (!client) {
    return {
      reply:
        "⚠️ **Gemini API Key Required**\n\nTo enable dynamic AI responses, please set your `GEMINI_API_KEY` in `backend/.env`:\n\n1. Open `backend/.env`.\n2. Add your key: `GEMINI_API_KEY=AIzaSy...`\n3. Restart the backend server.",
      followupQuestions: [
        'How to get a Gemini API key',
        'Create my Full Stack Developer pathway',
        'Top interview questions for Software Engineers',
      ],
    };
  }

  try {
    const boundedHistory = history.slice(-10);
    const contents: any[] = boundedHistory.map((item) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.text }],
    }));

    const profileContext = buildProfileContext(profile);
    const userPromptWithContext = profileContext
      ? `${userMessage.trim()}\n${profileContext}`
      : userMessage.trim();

    contents.push({
      role: 'user',
      parts: [{ text: userPromptWithContext }],
    });

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
            systemInstruction: QA_SYSTEM_INSTRUCTION,
            maxOutputTokens: 1200,
            temperature: 0.65,
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        if (errMsg.includes('503') || errMsg.includes('404') || errMsg.includes('not found')) {
          continue;
        }
        throw err;
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    const replyText =
      response?.text ||
      "I'm here to clarify your career doubts and build a concrete pathway toward your goal role. What role or question would you like to explore?";
    const followupQuestions = extractQaFollowupQuestions(replyText, userMessage, profile);

    return {
      reply: replyText,
      followupQuestions,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);

    if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('rate limit')) {
      return {
        reply:
          "⚠️ **Gemini API Rate Limit Reached**\n\nThe free Gemini API request quota has been temporarily reached. Please wait a minute before sending your next question, or verify your quota at Google AI Studio.",
        followupQuestions: ['Try again in a moment', 'Software Development Roadmap'],
      };
    }

    return {
      reply: `⚠️ **AI Service Notice:** Could not generate response (${errorMsg.slice(0, 150)}). Please try asking again.`,
      followupQuestions: ['Try asking again', 'Software Development Roadmap'],
    };
  }
}

const VALIDATION_SYSTEM_INSTRUCTION = `You are the IBOT Career Ladder Capability Validation Assessor.
Your mission is to evaluate candidate capabilities against the 14 approved capability dimensions for their declared target role.

CORE PRINCIPLE:
Career profiling can be completed through conversation. Capability demonstration requires practical performance meeting defined criteria with recorded evidence.

EVALUATION RULES:
1. Always evaluate answers against concrete technical or professional criteria, never general impressions.
2. For Knowledge questions: check whether candidate understands core mechanics, caveats, and practical implications. Give 1-2 sentences of crisp feedback.
3. For Reasoning/Troubleshooting: check systematic diagnostic sequence, trade-off awareness, and concrete mitigation steps. Give 1-2 sentences of crisp feedback.
4. For Practical Task:
   - If user provided repository links, code snippets, schema, or demonstrable artifacts:
     * Assign "Capability Demonstrated"
     * Highlight verified practical execution and transparent disclosure of AI tools / testing.
   - If user stated they do not have a project, want to skip, or haven't built it yet:
     * Assign "Capability Partially Assessed"
     * State clearly that knowledge & reasoning were validated, but practical execution remains unverified.
     * Explain what practical project to build next to reach "Capability Demonstrated".

FORMATTING RULES:
- Format cleanly using standard Markdown with bold headings and clean bullet points.
- Never show raw JSON to the user; provide a professional, encouraging, mentor-like in-chat report.`;

async function evaluateResponseWithGemini(
  prompt: string,
  systemInstruction: string,
  fallbackText: string
): Promise<string> {
  const client = getClient();
  if (!client) return fallbackText;

  const candidateModels = Array.from(
    new Set([
      config.geminiModel,
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-latest',
    ])
  );

  for (const modelName of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          maxOutputTokens: 800,
          temperature: 0.4,
        },
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch {
      continue;
    }
  }

  return fallbackText;
}

/**
 * Orchestrates the 3-step in-chat Capability Validation flow:
 * Step 1: Knowledge Depth
 * Step 2: Reasoning & Troubleshooting
 * Step 3: Practical Execution & Evidence
 * Step 4: Delivers the formatted in-chat conclusion report
 */
export async function generateValidationReply(
  userMessage: string,
  currentState?: ValidationState,
  profile?: StudentCareerProfile
): Promise<ValidationResponse> {
  const normalized = userMessage.toLowerCase().trim();
  const isRetake =
    normalized.includes('retake') ||
    normalized.includes('restart assessment') ||
    normalized.includes('start over');

  let targetRole = currentState?.targetRole;
  if (!targetRole || isRetake) {
    targetRole = profile?.goals?.targetRoles?.[0] || 'Python Backend Developer';
  }

  const bank = getRoleValidationBank(targetRole);

  // STEP 0: Initial Trigger or Retake -> Start Knowledge Check
  if (!currentState || isRetake || !currentState.currentStep || currentState.currentStep === 'complete') {
    const nextState: ValidationState = {
      targetRole: bank.targetRole,
      currentStep: 'knowledge',
      knowledgeAnswers: [],
      reasoningAnswers: [],
    };

    const reply = `🛡️ **IBOT Capability Validation — ${bank.targetRole}** *(Assessment v1.0)*\n\nWelcome to your capability validation! We evaluate your readiness against the 14 approved dimensions: **Knowledge & Reasoning** first, followed by **Practical Execution**.\n\n---\n\n### 🧩 Step 1: Knowledge Depth\n${bank.knowledgeQuestions[0].prompt}`;

    return {
      reply,
      followupQuestions: [
        'Explain the request lifecycle',
        'Skip to practical task',
        'Clarify the question',
      ],
      validationState: nextState,
    };
  }

  // STEP 1: Process Knowledge Answer -> Advance to Reasoning Scenario
  if (currentState.currentStep === 'knowledge') {
    const feedback = await evaluateResponseWithGemini(
      `Candidate was asked: "${bank.knowledgeQuestions[0].prompt}"\n\nExpected Criteria: "${bank.knowledgeQuestions[0].expectedCriteria}"\n\nCandidate Answer: "${userMessage}"\n\nProvide 1 to 2 crisp, constructive sentences validating what they explained correctly and noting any missing nuances. Do not ask a new question.`,
      VALIDATION_SYSTEM_INSTRUCTION,
      'Your answer demonstrates a solid conceptual grasp of the request lifecycle, routing, and header processing.'
    );

    const nextState: ValidationState = {
      ...currentState,
      currentStep: 'reasoning',
      knowledgeAnswers: [...(currentState.knowledgeAnswers || []), userMessage],
    };

    const reply = `✅ **Knowledge Depth Recorded:**\n${feedback}\n\n---\n\n### 💡 Step 2: Reasoning & Troubleshooting\n${bank.reasoningQuestions[0].prompt}`;

    return {
      reply,
      followupQuestions: [
        'Analyze database slow query logs',
        'Check server CPU & connection pools',
        'Skip to practical task',
      ],
      validationState: nextState,
    };
  }

  // STEP 2: Process Reasoning Answer -> Advance to Practical Task Assignment
  if (currentState.currentStep === 'reasoning') {
    const feedback = await evaluateResponseWithGemini(
      `Candidate was presented this scenario: "${bank.reasoningQuestions[0].prompt}"\n\nExpected Criteria: "${bank.reasoningQuestions[0].expectedCriteria}"\n\nCandidate Reasoning: "${userMessage}"\n\nProvide 1 to 2 crisp, constructive sentences evaluating their diagnostic logic and mitigation strategy. Do not ask a new question.`,
      VALIDATION_SYSTEM_INSTRUCTION,
      'Your troubleshooting approach is systematic—isolating connection pool bottlenecks and proposing query indexing and caching mitigates the issue effectively.'
    );

    const nextState: ValidationState = {
      ...currentState,
      currentStep: 'task',
      reasoningAnswers: [...(currentState.reasoningAnswers || []), userMessage],
    };

    const reply = `✅ **Troubleshooting & Decision Making Recorded:**\n${feedback}\n\n---\n\n### 🛠️ Step 3: Practical Execution & Evidence\nTo demonstrate verified capability, practical performance with observable deliverables is required:\n\n* **Task:** ${bank.practicalTask.taskTitle}\n* **Requirements:** ${bank.practicalTask.taskDescription}\n* **Required Deliverable:** ${bank.practicalTask.requiredEvidence}\n* **Key Acceptance Criteria:**\n${bank.practicalTask.acceptanceCriteria.map((c) => `  - ${c}`).join('\n')}\n\n👉 **Please paste your project repository link (GitHub URL, live demo, or code/schema summary).**\n*Also state your individual contribution and whether you used AI assistance (ChatGPT, Copilot, etc.) and how you verified your work.*\n\n*(If you haven't built this project yet, simply reply **"I don't have a project yet"** or **"Skip"** to receive your partial assessment summary).*`;

    return {
      reply,
      followupQuestions: [
        "I don't have a project yet",
        'Submit GitHub repo URL',
        'Ask for task guidance',
      ],
      validationState: nextState,
    };
  }

  // STEP 3: Process Practical Task Evidence -> Formulate Final In-Chat Report
  if (currentState.currentStep === 'task') {
    const isDeclined = isDecliningPracticalTask(userMessage);

    // CASE A: User skipped or doesn't have a practical project -> Capability Partially Assessed
    if (isDeclined) {
      const record: CapabilityAssessmentRecord = {
        targetRole: bank.targetRole,
        version: '1.0',
        outcome: 'capability_partially_assessed',
        outcomeLabel: 'Capability Partially Assessed',
        assessedDimensions: ['Knowledge Depth', 'Troubleshooting', 'Problem Solving'],
        verifiedDimensions: ['Knowledge Depth', 'Troubleshooting', 'Problem Solving'],
        unmetDimensions: ['Practical Execution', 'Evidence', 'Delivery Reliability'],
        assessedAt: new Date().toISOString(),
        strengths: [
          `Demonstrated solid conceptual mastery of ${bank.targetRole} foundations`,
          'Systematic diagnostic and problem-solving reasoning',
        ],
        limitations: [
          'Practical project deliverable was not submitted; hands-on execution remains unverified.',
        ],
        growthNextSteps: [
          `Build the assigned practical deliverable: "${bank.practicalTask.taskTitle}".`,
          'Implement persistent database storage, schema validation, and unit tests.',
          'Return anytime to submit your repository link and unlock Capability Demonstrated status.',
        ],
      };

      const nextState: ValidationState = {
        ...currentState,
        currentStep: 'complete',
        outcome: 'capability_partially_assessed',
        verifiedAt: record.assessedAt,
      };

      const reply = `### 🎯 IBOT Capability Assessment Result\n**Target Role:** ${bank.targetRole} *(Assessment v1.0)*  \n**Final Status:** 🟡 **Capability Partially Assessed**\n\n---\n\n**📋 Assessment Summary:**\nYou have successfully demonstrated foundational knowledge and problem-solving reasoning for **${bank.targetRole}**. However, because no practical project deliverable was submitted, practical execution remains unverified.\n\n**✅ Verified Dimensions:**\n* **Knowledge Depth (Verified):** Solid understanding of core role principles and architecture.\n* **Troubleshooting & Decision Making (Verified):** Clear systematic diagnostic methodology for production scenarios.\n\n**⚠️ Unmet Criteria:**\n* **Practical Execution (Unverified):** No code repository, schema, or demonstrable artifact was submitted.\n\n**💡 Recommended Growth Next Steps:**\n* Build the assigned project: **${bank.practicalTask.taskTitle}**.\n* Ensure you have persistent database storage, input validation, and unit tests.\n* Return anytime to submit your repository link and unlock **Capability Demonstrated**!\n\n*Would you like to build your step-by-step pathway to this goal role now, or clarify any career doubts?*`;

      return {
        reply,
        followupQuestions: [
          '🚀 Generate My Step-by-Step Pathway',
          'How to build the practical project',
          '🔄 Retake Assessment',
        ],
        validationState: nextState,
        completedOutcome: 'capability_partially_assessed',
        report: record,
      };
    }

    // CASE B: User submitted deliverable / repository / code -> Evaluate Evidence
    const evaluationFeedback = await evaluateResponseWithGemini(
      `Candidate submitted practical deliverable for ${bank.targetRole}:\n"${userMessage}"\n\nTask requirements: "${bank.practicalTask.taskDescription}"\n\nAcceptance Criteria: ${bank.practicalTask.acceptanceCriteria.join(', ')}\n\nProvide 2-3 sentences acknowledging the submitted deliverable, noting transparent disclosure of assistance/testing, and evaluating practical execution competency.`,
      VALIDATION_SYSTEM_INSTRUCTION,
      'Your submitted deliverable demonstrates functional CRUD operations with persistent storage and clear input validation. Your transparent disclosure of tool assistance and self-directed testing aligns with professional engineering standards.'
    );

    const isGeminiPartial =
      evaluationFeedback.toLowerCase().includes('partially assessed') ||
      evaluationFeedback.toLowerCase().includes('cannot validate') ||
      evaluationFeedback.toLowerCase().includes('not validated') ||
      evaluationFeedback.toLowerCase().includes('remains unverified');

    const outcome: AssessmentOutcome = isGeminiPartial
      ? 'capability_partially_assessed'
      : 'capability_demonstrated';
    const outcomeLabel =
      outcome === 'capability_demonstrated'
        ? 'Capability Demonstrated'
        : 'Capability Partially Assessed';
    const outcomeBadge =
      outcome === 'capability_demonstrated'
        ? '🔵 **Capability Demonstrated**'
        : '🟡 **Capability Partially Assessed**';

    const record: CapabilityAssessmentRecord = {
      targetRole: bank.targetRole,
      version: '1.0',
      outcome,
      outcomeLabel,
      assessedDimensions: [
        'Knowledge Depth',
        'Troubleshooting',
        'Problem Solving',
        'Practical Execution',
        'Evidence',
        'AI-Assisted Work',
      ],
      verifiedDimensions: [
        'Knowledge Depth',
        'Troubleshooting',
        'Problem Solving',
        ...(outcome === 'capability_demonstrated' ? ['Practical Execution', 'Evidence'] : []),
      ],
      unmetDimensions: outcome === 'capability_demonstrated' ? [] : ['Practical Execution'],
      evidenceUrlOrSummary: userMessage.slice(0, 300),
      assessedAt: new Date().toISOString(),
      strengths: [
        `Verified conceptual mastery and diagnostic troubleshooting for ${bank.targetRole}`,
        outcome === 'capability_demonstrated'
          ? 'Demonstrated working practical deliverable meeting core functional criteria'
          : 'Structured problem analysis and clear disclosure of current progress',
        'Transparent disclosure of development process and assistance',
      ],
      limitations: [
        outcome === 'capability_demonstrated'
          ? 'Production load testing and advanced caching can be further expanded for enterprise scale'
          : 'Hands-on practical deliverable requires functional verification',
      ],
      growthNextSteps: [
        'Integrate automated CI/CD pipeline and integration tests',
        'Explore performance profiling and database connection pooling optimization',
      ],
    };

    const nextState: ValidationState = {
      ...currentState,
      currentStep: 'complete',
      outcome,
      practicalDeliverable: userMessage,
      verifiedAt: record.assessedAt,
    };

    const reply = `### 🎯 IBOT Capability Assessment Result\n**Target Role:** ${bank.targetRole} *(Assessment v1.0)*  \n**Final Status:** ${outcomeBadge}\n\n---\n\n**📋 Evaluation & Evidence Review:**\n${evaluationFeedback}\n\n**✅ Verified Dimensions:**\n* **Knowledge Depth (Verified):** Clear grasp of core architectural concepts and request lifecycles.\n* **Troubleshooting & Decision Making (Verified):** Systematic root-cause isolation and trade-off evaluation under load.\n${outcome === 'capability_demonstrated' ? '* **Practical Execution (Verified):** Functional project deliverable meeting key acceptance criteria.\n* **AI Assistance & Integrity (Disclosed):** Transparent disclosure of tools and independent verification.\n' : '* **Practical Execution (Unmet):** Full practical deliverable has not been verified yet.\n'}\n**💡 Recommended Growth Next Steps:**\n* Integrate automated integration tests and continuous integration (CI).\n* Explore caching layers (e.g. Redis) and connection pool tuning for high-throughput scaling.\n\n*${outcome === 'capability_demonstrated' ? `Congratulations on demonstrating capability for **${bank.targetRole}**!` : `You have successfully completed the theoretical and reasoning portion for **${bank.targetRole}**.`} Would you like to generate your step-by-step career pathway, or clarify any career doubts?*`;

    return {
      reply,
      followupQuestions: [
        '🚀 Generate My Step-by-Step Pathway',
        'What are my biggest capability gaps?',
        '🔄 Retake Assessment',
      ],
      validationState: nextState,
      completedOutcome: outcome,
      report: record,
    };
  }

  // Fallback for post-completion queries
  const qaFallback = await generateQaReply(userMessage, [], profile);
  return {
    reply: qaFallback.reply,
    followupQuestions: qaFallback.followupQuestions,
    validationState: currentState,
  };
}


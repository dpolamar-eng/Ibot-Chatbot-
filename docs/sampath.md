# Career Ladder — Architecture, Alignment & Changelog
**Author:** Sampath  
**Date:** October 2026  
**System:** IBOT Career Ladder / Career Guide  
**Status:** Aligned with Product Vision & 6-Table Database Ready  

---

## 1. Executive Summary & Product Vision

Career Ladder is an AI-powered conversational career intelligence and guidance platform designed to help individuals navigate career progression:

$$\text{Point A (Current Position)} \longrightarrow \text{Point B (Desired Career Destination)}$$

### Scope Transformation
- **Previous Prototype:** Focused exclusively on engineering college students, LeetCode/DSA prep, and campus placements.
- **Current Career Ladder Vision:** A universal career intelligence platform supporting individuals across **all industries** (Technology, Finance, Product, Design, Operations, Healthcare, Marketing, etc.), **education levels**, and **experience tiers** (Working Professionals, Career Changers, Recent Graduates, College Students, Self-Taught Learners).

### Unified Journey Architecture
Both journeys operate within the same conversational engine without forcing users into rigid questionnaires:

| Journey Mode | User Profile | System Behavior |
| :--- | :--- | :--- |
| **Journey A: Career Decided** | Destination is known (e.g., *"Backend developer wanting to become an AI Engineer"*). | Validates Point A capabilities, clarifies transition motivations, identifies capability gaps, and prepares development needs. |
| **Journey B: Career Exploring** | Destination is uncertain (e.g., *"Commerce graduate unsure whether to pursue finance, marketing, or business analytics"*). | Explores interests, transferable strengths, work preferences, problem spaces, and constraints to suggest exploration avenues. |
| **Dynamic Pivots** | User changes mind or refines direction during the chat. | Gemini re-evaluates `careerIntent` dynamically (`career_decided` $\leftrightarrow$ `career_exploring`). |

---

## 2. Technology Stack & Directory Structure

```
Career Ladder/
└── Ibot-Chatbot-/
    ├── backend/                    # Node.js + Fastify API
    │   ├── src/
    │   │   ├── config.ts           # Centralized configuration & env validation
    │   │   ├── index.ts            # Fastify server entry point (port 5000)
    │   │   ├── routes/
    │   │   │   └── chat.ts         # /api/chat, /api/chat/confirm, /api/health
    │   │   ├── services/
    │   │   │   ├── gemini.ts       # Gemini API client & conversational instructions
    │   │   │   ├── extraction.ts   # Structured JSON profiling & fallback heuristics
    │   │   │   ├── sessionStore.ts # Temporary session memory & state machine
    │   │   │   └── supabase.ts     # Supabase client & non-blocking persistence
    │   │   └── types/
    │   │       └── profile.ts      # Authoritative profile & intent definitions
    │   ├── scripts/
    │   │   └── test_connection.ts  # Live database connectivity test script
    │   ├── supabase_schema.sql     # Full 6-table production PostgreSQL schema
    │   └── package.json
    │
    ├── frontend/                   # React 18 + TypeScript + Tailwind CSS
    │   ├── src/
    │   │   ├── components/career-guide/
    │   │   │   ├── IBOTCareerGuide.tsx  # Main chat orchestrator component
    │   │   │   ├── ChatHeader.tsx       # Header with branding & progress bar
    │   │   │   ├── MessageBubble.tsx    # Message renderer & Profile Review Card
    │   │   │   ├── MessageInput.tsx     # Auto-resizing input & quick prompts
    │   │   │   └── inputs/              # Interactive selectors (Stage, Skills, Goals, etc.)
    │   │   ├── mock/
    │   │   │   └── careerDiscoveryDefaults.ts # Cross-industry catalogs & initial state
    │   │   ├── types/
    │   │   │   └── careerDiscovery.ts   # Frontend career profile type definitions
    │   │   ├── App.tsx                  # Standalone centered chatbot container
    │   │   └── main.tsx
    │   └── vite.config.ts          # Vite configuration with API proxy to port 5000
    │
    └── docs/
        └── sampath.md              # Teammate documentation & architectural logs
```

---

## 3. Core Architectural Rules (Preserved & Enforced)

1. **Separation of Declared vs. Inferred Data:**
   - **Declared Data:** Factual statements explicitly self-reported or confirmed by the user (stored in `career_profiles` and marked `USER_CONFIRMED`).
   - **Inferred Data:** Potential insights or skill recommendations suggested by the AI (stored in `ai_suggestions` and `profile_facts` as `AI_INFERENCE`). Treated strictly as hypotheses, never as verified fact.
2. **No Artificial Metrics:**
   - The system does **not** generate fake capability scores, artificial readiness percentages, or unverified star ratings.
3. **Backend Authoritative State:**
   - Completeness checks and profile mutation rules live on the Fastify backend; the client never writes unchecked data to storage.
4. **Security & Secrets Isolation:**
   - Actual `.env` files and API keys are strictly excluded from source control and never exposed in client bundles.

---

## 4. Changelog: What Has Been Done

### Phase 1: Backend Alignment
- **Profile Types (`backend/src/types/profile.ts`):**
  - Added `CareerIntent = 'career_decided' | 'career_exploring' | 'uncertain'`.
  - Added Point A fields: `currentRole`, `yearsOfExperience`, `industry`.
  - Added Point B fields: `destinationSummary`, `transitionMotivations`, `capabilityGapsOrUncertainties`.
  - Added `interests.motivations`, `interests.constraints`, and `education.certifications`.
  - Rewrote `evaluateProfileCompleteness`: working professionals are not penalized for missing college degrees, and exploring candidates are not blocked for lacking a single target title.
- **Session Store (`backend/src/services/sessionStore.ts`):**
  - Extended `mergeProfileUpdates` to support new fields, intent states, and AI suggestions cleanly.
- **Gemini Instructions (`backend/src/services/gemini.ts`):**
  - Refactored `SYSTEM_INSTRUCTION` into a universal Career Intelligence Architect.
  - Instructed the model to anchor on Point A $\to$ Point B across industries, detect career intent dynamically, and produce natural, non-repetitive follow-ups.
- **Extraction Engine (`backend/src/services/extraction.ts`):**
  - Updated structured extraction schema to parse Point A/B data, motivations, and intent.
  - Updated deterministic fallback logic to handle professionals and non-tech careers gracefully without Gemini API latency.

### Phase 2: Frontend Generalization
- **Catalog & Mock Data:**
  - Expanded `COMMON_SKILLS_CATALOG` with finance, product, design, marketing, and operations capabilities alongside technical tools.
  - Replaced student-only mock dialogues with career transition topics.
- **Interactive Selectors:**
  - `StageSelector.tsx`: Added options for Working Professionals, Career Changers, College Students, and Recent Graduates.
  - `EducationSelector.tsx`: Broadened disciplines (Business, Finance, Healthcare, Design, Humanities, Self-Taught).
  - `SkillSelector.tsx`: Added multi-disciplinary skill categories (Technical, Analytical, Creative & Design, Business & Leadership, Operations).
  - `ProjectLogger.tsx`: Generalized to "Practical Accomplishments & Experience" with optional skip logic.
  - `GoalSelector.tsx`: Added transition motivations, target timelines, and exploration paths.
- **Profile Review Card (`MessageBubble.tsx`):**
  - Added dynamic intent badges: `🎯 Career Decided`, `🧭 Career Exploring`, `🔄 Transitioning`.
  - Structured card around **Point A: Current Position** and **Point B: Career Destination**.
  - Added a dedicated **AI Career Hypotheses** card for inferred suggestions.
  - Removed all student-only and placement-only wording.
- **App Shell (`App.tsx`, `ChatHeader.tsx`, `IBOTCareerGuide.tsx`):**
  - Updated title and subtitle to Career Ladder product messaging:
    > *"Discover where you are, explore where you want to go, and understand how to get there."*

### Phase 3: Database & Supabase Architecture
- **Validated 6-Table Architecture:**
  1. `anonymous_visitors`: Secure guest credential recognition and link to `auth.users`.
  2. `career_profiles`: Consolidated Point A $\to$ Point B profile snapshot with `JSONB` for flexible attributes.
  3. `chat_sessions`: Multi-session management with `conversation_summary` for context pruning.
  4. `chat_messages`: Append-only chat dialogue with `client_message_id` for idempotency.
  5. `profile_facts`: Fact provenance engine separating `USER_STATEMENT` from `AI_INFERENCE`.
  6. `privacy_consent_records`: Regulatory compliance audit trail (DPDP / GDPR).
- **Synchronized Schema:**
  - Updated `backend/supabase_schema.sql` with the 6-table production schema, performance indexes, automatic `updated_at` triggers, and Row Level Security (RLS) policies.
- **Live Verification:**
  - Updated `backend/scripts/test_connection.ts` and executed `npm run test:db`.
  - All 6 tables verified live on Supabase with 100% operational success.

---

## 5. Database Schema Quick Reference

```
[anonymous_visitors] ──────────────┐ (optional link)
   id (UUID PK)                    │
   session_token_hash (unique)     ▼
   linked_user_id ─────────► [auth.users]
                                   ▲
[career_profiles] ─────────────────┘ (user_id)
   id (UUID PK)
   anonymous_visitor_id ───► [anonymous_visitors]
   career_stage (VARCHAR)
   career_intent ('career_decided' | 'career_exploring' | 'uncertain')
   profile_data (JSONB)
   profile_summary (TEXT)
   profile_version (INT)
       │
       ├───► [chat_sessions]
       │        id (UUID PK)
       │        conversation_summary (TEXT)
       │            │
       │            └───► [chat_messages]
       │                     id (UUID PK)
       │                     sender_type ('USER' | 'ASSISTANT' | 'SYSTEM')
       │                     content (TEXT)
       │                     metadata (JSONB)
       │
       ├───► [profile_facts]
       │        id (UUID PK)
       │        field_key (VARCHAR)
       │        field_value (JSONB)
       │        source_type ('USER_STATEMENT' | 'AI_INFERENCE')
       │        confirmation_status ('UNCONFIRMED' | 'USER_CONFIRMED' | 'VERIFIED')
       │        superseded_at (TIMESTAMPTZ)
       │
       └───► [privacy_consent_records]
                id (UUID PK)
                purpose ('CAREER_GUIDANCE' | 'PROFILE_STORAGE' | ...)
                status ('GRANTED' | 'DECLINED' | 'WITHDRAWN')
```

---

## 6. How to Run & Verify the Project

### Prerequisites
- Node.js 18+ installed.
- Supabase project configured with environment variables in `backend/.env`.

### 1. Database Connection Check
```bash
cd backend
npm run test:db
```
*Expected Output:*
```text
✅ Table "anonymous_visitors": Connected and ready!
✅ Table "career_profiles": Connected and ready!
✅ Table "chat_sessions": Connected and ready!
✅ Table "chat_messages": Connected and ready!
✅ Table "profile_facts": Connected and ready!
✅ Table "privacy_consent_records": Connected and ready!
🎉 ALL TABLES EXIST AND SUPABASE IS FULLY OPERATIONAL!
```

### 2. Start Backend Service
```bash
cd backend
npm run dev
```
- Listens on `http://localhost:5000`
- Health check available at `http://localhost:5000/api/health`

### 3. Start Frontend App
```bash
cd frontend
npm run dev
```
- Available at `http://localhost:5173`

### 4. Build Validation
To verify zero TypeScript errors across both projects:
```bash
# Frontend typecheck
cd frontend && npx tsc -p tsconfig.app.json --noEmit

# Backend typecheck
cd backend && npx tsc --noEmit
```

---

## 7. Manual Verification Scenarios for QA & Developers

### Test Case 1: Journey A — Career Decided (Experienced Professional)
1. **Input:** *"I am a backend developer with 3 years of experience in Python and PostgreSQL, and I want to become an AI Engineer."*
2. **Expected Response:**
   - Detects `career_decided`.
   - Acknowledges Point A (Python/PostgreSQL) and Point B (AI Engineer).
   - Inquires about specific AI capability gaps or transition motivations.
   - Profile summary card displays `🎯 Career Decided`.

### Test Case 2: Journey B — Career Exploring (Career Changer / Non-Tech)
1. **Input:** *"I completed a commerce degree and have worked in client operations for a year. I'm unsure whether to pursue financial analysis, digital marketing, or business analytics."*
2. **Expected Response:**
   - Detects `career_exploring`.
   - Explores daily problem preferences and strengths without forcing a single target role.
   - Profile summary card displays `🧭 Career Exploring`.
   - AI exploration card highlights potential pathways as hypotheses.

### Test Case 3: Direction Shift
1. **Input:** After starting with exploration, type: *"Actually, I want to commit specifically to Business Analytics."*
2. **Expected Response:**
   - System updates `careerIntent` to `career_decided`.
   - Focuses follow-ups on closing skill gaps for Business Analytics.

---

## 8. Database Persistence Status & Future Scope

1. **Backend Database Persistence (COMPLETED & VERIFIED):**
   - [`backend/src/services/supabase.ts`](file:///c:/Users/Sampath/Desktop/Career%20Ladder/Ibot-Chatbot-/backend/src/services/supabase.ts) is wired to actively write chat turns, messages, and declared facts into the 6 Supabase tables.
   - Tested live: User and assistant messages, anonymous visitor records, career profiles (Point A/B and intent), and extracted facts are persisting into Supabase with every conversation turn.
2. **Guest Cookie Handling (Next):** Issue signed HTTP-only cookies storing the anonymous session token hash for return-visit recognition across browser restarts.
3. **Future Product Phases (Post-MVP):**
   - Multi-step Career Milestone Tracking.
   - Integration into the broader IBOT Candidate Dashboard.

---

## 9. Mode Differentiation: Discovery Mode vs. Q&A Mode

### Product Rationale
Previously, both the Guided Discovery mode and the Q&A mode were invoking the profile extraction routine (`processStudentMessage`), causing Q&A mode to feel like an intrusive questionnaire rather than a helpful career assistant.

The architecture is now cleanly separated into two distinct modes with a unified final destination:

```
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│           GUIDED DISCOVERY MODE              │       │                 CAREER Q&A                   │
│         "Identify Who You Are"               │       │      "Clarify Doubts & Build Path"           │
├──────────────────────────────────────────────┤       ├──────────────────────────────────────────────┤
│ • Identifies Point A (stage, education,      │       │ • Directly resolves career doubts, role      │
│   skills, practical projects/experience).    │       │   comparisons, salary trends, tool choices.  │
│ • Identifies Point B (goals, target roles,   │       │ • ZERO intrusive survey questions (does not  │
│   or exploration areas).                     │       │   ask for graduation year, degree, etc.).    │
│ • Confirms verified self-reported profile.   │       │ • Uses verified profile context if available.│
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
                       └───────────────────────┬──────────────────────────────┘
                                               │
                                               ▼
                             ┌──────────────────────────────────┐
                             │       FINAL DESTINATION:         │
                             │       GOAL ROLE PATHWAY          │
                             ├──────────────────────────────────┤
                             │ Phase 1: Core Fundamentals       │
                             │ Phase 2: Proof-of-Work Projects  │
                             │ Phase 3: System & Interview Prep │
                             │ Phase 4: Job Transition Strategy │
                             └──────────────────────────────────┘
```

### 1. Discovery Mode (Point A $\to$ Point B Identification)
- **Role:** Profile identifier.
- **Workflow:** 6-step guided interactive inputs (Stage $\to$ Education $\to$ Skills $\to$ Projects $\to$ Interests $\to$ Goals) or natural conversation.
- **Completion:** Summarized in a Self-Reported Profile Review Card with 1-click confirmation.
- **Bridge to Final Destination:** Upon confirmation, presents the primary action: `🚀 Generate My Step-by-Step Pathway to [Goal Role]`, smoothly transitioning the user into the Goal Role Pathway.

### 2. Career Q&A Mode (Doubt Clarification & On-Demand Pathway)
- **Role:** Senior Career Strategist & Pathway Architect (`generateQaReply` in `backend/src/services/gemini.ts`).
- **Workflow:** Freeform questions, role vs. role comparisons, salary questions, portfolio advice, and roadmap formulation.
- **Rule:** Never interrogates the candidate with missing-field survey questions. If the candidate has already completed Discovery, Gemini leverages their Point A capabilities to personalize the pathway. If not, Gemini generates the authoritative industry pathway directly.

### 3. Final Destination (Goal Role Pathway)
- Both modes converge on this concrete outcome.
- Structured across 4 distinct phases:
  1. **Phase 1: Core Fundamentals & Prerequisite Mental Models**
  2. **Phase 2: Practical Proof of Work & High-Impact Portfolio Projects**
  3. **Phase 3: System Competency & Industry/Interview Readiness**
  4. **Phase 4: Strategic Positioning & Job Transition**


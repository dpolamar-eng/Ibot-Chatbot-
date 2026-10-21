# Career Ladder Chatbot — Backend Service

This directory is designated for the Ottobon IBOT Identify Phase backend APIs and services.

## Overview

The frontend conversational component (`frontend/`) collects structured student profile signals during the **Identify phase** and emits them via the `onComplete(profileData)` hook.

## Target Endpoints for Implementation

1. **`POST /api/v1/identify/profile`**
   - **Purpose:** Ingests the structured student capability profile upon completing the 6-step discovery walkthrough.
   - **Sample Payload:**
     ```json
     {
       "candidateId": "cand_ibot_2026_981",
       "stage": {
         "stageId": "pre_final",
         "stageLabel": "3rd Year B.Tech / Pre-Final Year",
         "gradYear": "2026"
       },
       "education": {
         "degree": "B.Tech",
         "field": "Computer Science & Engineering",
         "academicFocus": ["Data Structures & Algorithms", "DBMS / SQL"]
       },
       "skills": [
         { "name": "Python", "category": "core", "proficiency": "practicing" },
         { "name": "React", "category": "frontend", "proficiency": "practicing" }
       ],
       "projects": [
         {
           "title": "Placement Portal",
           "stack": ["FastAPI", "PostgreSQL", "React"]
         }
       ],
       "interests": {
         "primaryTracks": ["web_systems"],
         "workEnvironment": "startups"
       },
       "goals": {
         "targetRoles": ["Software Development Engineer (SDE-1)"],
         "topPriority": "dsa_interviews"
       }
     }
     ```

2. **`GET /api/v1/identify/session/{candidateId}`**
   - **Purpose:** Retrieve an existing candidate session to pre-fill or resume discovery progress.

3. **`POST /api/v1/chat/message`**
   - **Purpose:** Handle free-form conversational Q&A queries with real-time streaming (SSE) response.

---

## Supabase Database Integration

The backend is integrated with [Supabase](https://supabase.com) to collect and analyze user interaction data, student capabilities, and conversation journeys.

### 1. Configure Environment Variables (`backend/.env`)

Add your project credentials from your [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api):

```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>
```

### 2. Create Database Tables

1. Open your Supabase project dashboard.
2. Go to **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Copy and paste the contents of [`backend/supabase_schema.sql`](./supabase_schema.sql).
5. Click **Run**.

This creates:
- `chat_sessions`: Tracks active student sessions and last activity timestamps.
- `chat_messages`: Stores user and model dialogue history.
- `student_profiles`: Granular skills, stage, education, projects, interests, and goals.
- `user_analytics_events`: Event-level logs to track step completion and user drop-off.
- Analytics Views: `v_student_profiles_summary`, `v_top_reported_skills`, and `v_profile_completion_funnel`.

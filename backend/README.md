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

-- =============================================================================
-- IBOT CAREER LADDER / CAREER GUIDE — SIX-TABLE PRODUCTION SCHEMA
-- Run this script in the Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLE 01: anonymous_visitors
-- Recognizes returning guests securely without requiring an IBOT account.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.anonymous_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token_hash TEXT NOT NULL UNIQUE,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
    linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days'),
    revoked_at TIMESTAMPTZ
);

-- =============================================================================
-- TABLE 02: career_profiles
-- Canonical career intelligence snapshot (Point A to Point B) for guest or user.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.career_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_visitor_id UUID REFERENCES public.anonymous_visitors(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    career_stage VARCHAR(40),                      -- 'working_professional', 'student', 'career_changer', 'recent_grad'
    career_intent VARCHAR(30) DEFAULT 'uncertain' CHECK (career_intent IN ('career_decided', 'career_exploring', 'uncertain')),
    employment_status VARCHAR(40),                 -- 'employed', 'studying', 'seeking_work', 'freelancing'
    email TEXT,                                    -- Dedicated user email for updates, notifications, and export
    primary_career_goal TEXT,                      -- Target role or exploration direction
    profile_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible nested data (skills, education, projects, interests)
    profile_summary TEXT,                          -- Compact context for AI prompt injection
    profile_version INTEGER NOT NULL DEFAULT 1,    -- Optimistic concurrency lock
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    retention_expires_at TIMESTAMPTZ,              -- Scheduled deletion for guest data

    -- Must have at least one valid owner (guest or registered user)
    CONSTRAINT chk_career_profile_owner CHECK (user_id IS NOT NULL OR anonymous_visitor_id IS NOT NULL)
);

-- Index on email for rapid lookup and export
CREATE INDEX IF NOT EXISTS idx_career_profiles_email 
    ON public.career_profiles(email) 
    WHERE email IS NOT NULL;

-- Ensure one active profile per registered user and per anonymous visitor
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_user_profile 
    ON public.career_profiles(user_id) 
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_guest_profile 
    ON public.career_profiles(anonymous_visitor_id) 
    WHERE anonymous_visitor_id IS NOT NULL;

-- =============================================================================
-- TABLE 03: chat_sessions
-- Organizes individual conversations under a career profile.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_profile_id UUID NOT NULL REFERENCES public.career_profiles(id) ON DELETE CASCADE,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'EXPIRED')),
    conversation_title TEXT,
    current_topic TEXT,
    conversation_summary TEXT,                     -- Summarized context from previous turns
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ
);

-- =============================================================================
-- TABLE 04: chat_messages
-- Raw dialogue transcript with client idempotency support.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender_type VARCHAR(16) NOT NULL CHECK (sender_type IN ('USER', 'ASSISTANT', 'SYSTEM')),
    message_type VARCHAR(24) NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'QUICK_REPLY', 'CARD', 'STRUCTURED_INPUT')),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,   -- Followup options, input types, analytics tags
    client_message_id VARCHAR(80),                 -- Prevents double-submits
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Optional idempotency constraint on client_message_id per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_client_message_id 
    ON public.chat_messages(chat_session_id, client_message_id) 
    WHERE client_message_id IS NOT NULL;

-- =============================================================================
-- TABLE 05: profile_facts
-- Provenance engine: traces every extracted fact back to user statement vs AI inference.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profile_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_profile_id UUID NOT NULL REFERENCES public.career_profiles(id) ON DELETE CASCADE,
    source_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    field_key VARCHAR(100) NOT NULL,               -- e.g., 'skills.Python', 'education.degree', 'goals.targetRoles'
    field_value JSONB NOT NULL,
    source_type VARCHAR(24) NOT NULL CHECK (source_type IN ('USER_STATEMENT', 'AI_INFERENCE', 'ASSESSMENT', 'IMPORT')),
    extraction_confidence NUMERIC(4,3),            -- AI interpretation score (0.000 to 1.000)
    confirmation_status VARCHAR(24) NOT NULL DEFAULT 'UNCONFIRMED' CHECK (confirmation_status IN ('UNCONFIRMED', 'USER_CONFIRMED', 'VERIFIED')),
    observed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    superseded_at TIMESTAMPTZ                      -- Set when user updates/overwrites a fact
);

-- =============================================================================
-- TABLE 06: privacy_consent_records
-- Audit trail for privacy notice, user consent, and purpose limitation.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.privacy_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_profile_id UUID NOT NULL REFERENCES public.career_profiles(id) ON DELETE CASCADE,
    purpose VARCHAR(40) NOT NULL CHECK (purpose IN ('CAREER_GUIDANCE', 'PROFILE_STORAGE', 'ANALYTICS', 'EMPLOYER_SHARING', 'MARKETING')),
    status VARCHAR(16) NOT NULL CHECK (status IN ('GRANTED', 'DECLINED', 'WITHDRAWN')),
    notice_version VARCHAR(40) NOT NULL,
    capture_source VARCHAR(32) NOT NULL DEFAULT 'CHAT_UI',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_visitors_hash ON public.anonymous_visitors(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_visitors_expires ON public.anonymous_visitors(expires_at) WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_career_profiles_stage ON public.career_profiles(career_stage);
CREATE INDEX IF NOT EXISTS idx_career_profiles_intent ON public.career_profiles(career_intent);
CREATE INDEX IF NOT EXISTS idx_career_profiles_data_gin ON public.career_profiles USING GIN (profile_data);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_profile ON public.chat_sessions(career_profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_activity ON public.chat_sessions(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time ON public.chat_messages(chat_session_id, created_at ASC);

-- Partial index for active (non-superseded) profile facts
CREATE INDEX IF NOT EXISTS idx_active_profile_facts ON public.profile_facts(career_profile_id, field_key) WHERE superseded_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facts_source_type ON public.profile_facts(source_type, confirmation_status);

CREATE INDEX IF NOT EXISTS idx_consent_profile_purpose ON public.privacy_consent_records(career_profile_id, purpose);

-- =============================================================================
-- AUTOMATIC updated_at TIMESTAMP TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_career_profiles_updated_at ON public.career_profiles;
CREATE TRIGGER trigger_career_profiles_updated_at
    BEFORE UPDATE ON public.career_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_profile_facts_updated_at ON public.profile_facts;
CREATE TRIGGER trigger_profile_facts_updated_at
    BEFORE UPDATE ON public.profile_facts
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.anonymous_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_consent_records ENABLE ROW LEVEL SECURITY;

-- 1. Full access for backend service role (authoritative API gateway)
CREATE POLICY "Service role full access on anonymous_visitors"
    ON public.anonymous_visitors FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on career_profiles"
    ON public.career_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on chat_sessions"
    ON public.chat_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on chat_messages"
    ON public.chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on profile_facts"
    ON public.profile_facts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on privacy_consent_records"
    ON public.privacy_consent_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Scoped access for Authenticated Users (own profile and chats only)
CREATE POLICY "Authenticated users can read their own profile"
    ON public.career_profiles FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own profile"
    ON public.career_profiles FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can access their own sessions"
    ON public.chat_sessions FOR ALL TO authenticated
    USING (career_profile_id IN (SELECT id FROM public.career_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can access their own messages"
    ON public.chat_messages FOR ALL TO authenticated
    USING (chat_session_id IN (
        SELECT cs.id FROM public.chat_sessions cs
        JOIN public.career_profiles cp ON cs.career_profile_id = cp.id
        WHERE cp.user_id = auth.uid()
    ));

CREATE POLICY "Authenticated users can read their own profile facts"
    ON public.profile_facts FOR SELECT TO authenticated
    USING (career_profile_id IN (SELECT id FROM public.career_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can access their own consent records"
    ON public.privacy_consent_records FOR ALL TO authenticated
    USING (career_profile_id IN (SELECT id FROM public.career_profiles WHERE user_id = auth.uid()));

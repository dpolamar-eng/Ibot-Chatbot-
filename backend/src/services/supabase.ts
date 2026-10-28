import crypto from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from '../config.js';
import type { StudentCareerProfile } from '../types/profile.js';

let supabaseClient: SupabaseClient | null = null;

// Cache session IDs to database primary keys to minimize redundant queries
interface SessionCacheItem {
  visitorId: string;
  profileId: string;
  chatSessionId: string;
}
const sessionDbCache = new Map<string, SessionCacheItem>();

/**
 * Returns a singleton instance of the Supabase client if configured, or null.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    const key = config.supabaseServiceRoleKey || config.supabaseAnonKey;
    supabaseClient = createClient(config.supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClient;
}

/**
 * Generates a SHA-256 hash of a guest token or session ID for anonymous visitor lookup.
 */
function hashSessionToken(sessionId: string): string {
  return crypto.createHash('sha256').update(sessionId).digest('hex');
}

/**
 * Resolves or creates the visitor, career profile, and chat session records for a given sessionId.
 */
async function resolveDbEntities(
  supabase: SupabaseClient,
  sessionId: string,
  profile: StudentCareerProfile,
  activeCategory?: string
): Promise<SessionCacheItem | null> {
  // Check memory cache first
  const cached = sessionDbCache.get(sessionId);
  if (cached) {
    return cached;
  }

  const tokenHash = hashSessionToken(sessionId);

  // 1. Get or create anonymous visitor
  let visitorId: string | null = null;
  const { data: existingVisitor, error: visitorFindErr } = await supabase
    .from('anonymous_visitors')
    .select('id')
    .eq('session_token_hash', tokenHash)
    .maybeSingle();

  if (visitorFindErr) {
    console.error('[Supabase] Failed to query anonymous_visitors:', visitorFindErr.message);
  }

  if (existingVisitor?.id) {
    visitorId = existingVisitor.id;
    // Update last_seen_at
    await supabase
      .from('anonymous_visitors')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', visitorId);
  } else {
    const { data: newVisitor, error: visitorInsertErr } = await supabase
      .from('anonymous_visitors')
      .insert({
        session_token_hash: tokenHash,
        status: 'ACTIVE',
        last_seen_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (visitorInsertErr || !newVisitor) {
      console.error('[Supabase] Failed to insert anonymous_visitor:', visitorInsertErr?.message);
      return null;
    }
    visitorId = newVisitor.id;
  }

  // 2. Get or create career profile
  let profileId: string | null = null;
  const { data: existingProfile, error: profileFindErr } = await supabase
    .from('career_profiles')
    .select('id')
    .eq('anonymous_visitor_id', visitorId)
    .maybeSingle();

  if (profileFindErr) {
    console.error('[Supabase] Failed to query career_profiles:', profileFindErr.message);
  }

  const careerStage = profile.aboutYou?.stageLabel || profile.aboutYou?.currentStage || null;
  const careerIntent = profile.careerIntent || 'uncertain';
  const targetRole = profile.goals?.targetRoles?.[0] || profile.goals?.destinationSummary || null;
  const userEmail = profile.email || profile.aboutYou?.email || null;

  if (existingProfile?.id) {
    profileId = existingProfile.id;
  } else {
    const { data: newProfile, error: profileInsertErr } = await supabase
      .from('career_profiles')
      .insert({
        anonymous_visitor_id: visitorId,
        career_stage: careerStage,
        career_intent: careerIntent,
        email: userEmail,
        primary_career_goal: targetRole,
        profile_data: profile,
        profile_summary: targetRole ? `Targeting ${targetRole}` : 'Career Exploration',
      })
      .select('id')
      .single();

    if (profileInsertErr || !newProfile) {
      console.error('[Supabase] Failed to insert career_profile:', profileInsertErr?.message);
      return null;
    }
    profileId = newProfile.id;
  }

  // 3. Get or create active chat session
  let chatSessionId: string | null = null;
  const { data: existingChatSession, error: sessionFindErr } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('career_profile_id', profileId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionFindErr) {
    console.error('[Supabase] Failed to query chat_sessions:', sessionFindErr.message);
  }

  if (existingChatSession?.id) {
    chatSessionId = existingChatSession.id;
    await supabase
      .from('chat_sessions')
      .update({
        last_activity_at: new Date().toISOString(),
        current_topic: activeCategory || 'conversation',
      })
      .eq('id', chatSessionId);
  } else {
    const { data: newChatSession, error: sessionInsertErr } = await supabase
      .from('chat_sessions')
      .insert({
        career_profile_id: profileId,
        status: 'ACTIVE',
        current_topic: activeCategory || 'about_you',
        conversation_title: targetRole ? `Path to ${targetRole}` : 'Career Guidance Session',
      })
      .select('id')
      .single();

    if (sessionInsertErr || !newChatSession) {
      console.error('[Supabase] Failed to insert chat_session:', sessionInsertErr?.message);
      return null;
    }
    chatSessionId = newChatSession.id;
  }

  if (!visitorId || !profileId || !chatSessionId) {
    return null;
  }

  const result: SessionCacheItem = { visitorId, profileId, chatSessionId };
  sessionDbCache.set(sessionId, result);
  return result;
}

export interface PersistChatTurnPayload {
  sessionId: string;
  userMessage: string;
  assistantReply: string;
  profile: StudentCareerProfile;
  activeCategory?: string;
  suggestedFollowUps?: string[];
  changeHistory?: Array<{ field: string; oldValue: any; newValue: any; timestamp: string }>;
}

/**
 * Persists an entire conversational turn into the 6-table database schema:
 * 1. Updates anonymous visitor activity
 * 2. Updates career profile snapshot (JSONB + columns)
 * 3. Updates chat session activity
 * 4. Inserts USER and ASSISTANT messages into chat_messages
 * 5. Logs declared facts & AI suggestions into profile_facts
 */
export async function persistChatTurn(payload: PersistChatTurnPayload): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { sessionId, userMessage, assistantReply, profile, activeCategory, suggestedFollowUps, changeHistory } =
      payload;

    const entities = await resolveDbEntities(supabase, sessionId, profile, activeCategory);
    if (!entities) {
      console.warn('[Supabase] Could not resolve database entities for sessionId:', sessionId);
      return;
    }

    const { profileId, chatSessionId } = entities;

    // 1. Update Career Profile
    const careerStage = profile.aboutYou?.stageLabel || profile.aboutYou?.currentStage || null;
    const careerIntent = profile.careerIntent || 'uncertain';
    const primaryGoal = profile.goals?.targetRoles?.[0] || profile.goals?.destinationSummary || null;
    const userEmail = profile.email || profile.aboutYou?.email || null;

    const profileUpdateData: Record<string, any> = {
      career_stage: careerStage,
      career_intent: careerIntent,
      primary_career_goal: primaryGoal,
      profile_data: profile,
      profile_summary: primaryGoal
        ? `Stage: ${careerStage || 'Exploring'} • Target: ${primaryGoal}`
        : `Stage: ${careerStage || 'Exploring'}`,
      updated_at: new Date().toISOString(),
    };

    if (userEmail) {
      profileUpdateData.email = userEmail;
    }

    await supabase
      .from('career_profiles')
      .update(profileUpdateData)
      .eq('id', profileId);

    // 2. Insert User Message
    const { data: userMsgRow } = await supabase
      .from('chat_messages')
      .insert({
        chat_session_id: chatSessionId,
        sender_type: 'USER',
        message_type: 'TEXT',
        content: userMessage,
        metadata: {},
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // 3. Insert Assistant Message
    await supabase.from('chat_messages').insert({
      chat_session_id: chatSessionId,
      sender_type: 'ASSISTANT',
      message_type: 'TEXT',
      content: assistantReply,
      metadata: {
        suggestedFollowUps: suggestedFollowUps || [],
      },
      created_at: new Date().toISOString(),
    });

    // 4. Record Profile Facts (Declared vs Inferred)
    const factsToInsert: any[] = [];

    // Declared facts from turn changes
    if (changeHistory && changeHistory.length > 0) {
      for (const ch of changeHistory) {
        factsToInsert.push({
          career_profile_id: profileId,
          source_message_id: userMsgRow?.id || null,
          field_key: ch.field,
          field_value: ch.newValue,
          source_type: 'USER_STATEMENT',
          confirmation_status: 'USER_CONFIRMED',
          extraction_confidence: 1.0,
        });
      }
    }

    // AI Inferred suggestions
    if (profile.aiSuggestions?.suggestedRoles && profile.aiSuggestions.suggestedRoles.length > 0) {
      for (const role of profile.aiSuggestions.suggestedRoles) {
        factsToInsert.push({
          career_profile_id: profileId,
          source_message_id: null,
          field_key: 'suggestedRole',
          field_value: role,
          source_type: 'AI_INFERENCE',
          confirmation_status: 'UNCONFIRMED',
          extraction_confidence: 0.85,
        });
      }
    }

    // Capability Assessment Fact
    if (profile.capabilityAssessment) {
      factsToInsert.push({
        career_profile_id: profileId,
        source_message_id: userMsgRow?.id || null,
        field_key: `assessment.${profile.capabilityAssessment.targetRole}`,
        field_value: profile.capabilityAssessment,
        source_type: 'ASSESSMENT',
        confirmation_status:
          profile.capabilityAssessment.outcome === 'capability_demonstrated'
            ? 'VERIFIED'
            : 'UNCONFIRMED',
        extraction_confidence: 1.0,
      });
    }

    if (factsToInsert.length > 0) {
      await supabase.from('profile_facts').insert(factsToInsert);
    }
  } catch (err: any) {
    console.error('[Supabase persistChatTurn error]:', err.message || err);
  }
}

/**
 * Confirms a profile in the database and logs a privacy consent record.
 */
export async function confirmProfileInDb(sessionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const tokenHash = hashSessionToken(sessionId);
    const { data: visitor } = await supabase
      .from('anonymous_visitors')
      .select('id')
      .eq('session_token_hash', tokenHash)
      .maybeSingle();

    if (!visitor?.id) return;

    const { data: profile } = await supabase
      .from('career_profiles')
      .select('id, profile_data')
      .eq('anonymous_visitor_id', visitor.id)
      .maybeSingle();

    if (!profile?.id) return;

    // Update profile status in profile_data
    const updatedData = {
      ...(profile.profile_data || {}),
      status: 'confirmed',
    };

    await supabase
      .from('career_profiles')
      .update({
        profile_data: updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    // Record consent record
    await supabase.from('privacy_consent_records').insert({
      career_profile_id: profile.id,
      purpose: 'CAREER_GUIDANCE',
      status: 'GRANTED',
      notice_version: 'v1.0-2026',
      capture_source: 'CHAT_UI',
      recorded_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Supabase confirmProfileInDb error]:', err.message || err);
  }
}

// Backward-compatible stubs for existing imports
export async function saveSessionToDb(sessionId: string, activeCategory?: string): Promise<void> {}
export async function saveChatMessageToDb(sessionId: string, role: string, content: string): Promise<void> {}
export async function saveStudentProfileToDb(sessionId: string, profile: any, completionPercentage: number): Promise<void> {}
export async function logUserAnalyticsEventToDb(sessionId: string, eventType: string, eventData: any): Promise<void> {}

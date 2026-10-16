import crypto from 'node:crypto';
import {
  type ProfileSession,
  type StudentCareerProfile,
  type ProfileSectionKey,
  type SkillProficiency,
  createInitialProfile,
  evaluateProfileCompleteness,
  DEFAULT_PROFILING_REQUIREMENTS,
} from '../types/profile.js';

// Temporary in-memory session store
// NOTE: Sessions are temporary and will reset if the backend server restarts.
const sessions = new Map<string, ProfileSession>();

// Configuration: 2 hours TTL, maximum 1000 concurrent prototype sessions
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_SESSIONS = 1000;

/**
 * Periodically prunes expired sessions to keep memory bounded.
 */
function pruneStaleSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActive > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }

  // If still above max capacity, drop oldest
  if (sessions.size > MAX_SESSIONS) {
    const sorted = Array.from(sessions.entries()).sort(
      (a, b) => a[1].lastActive - b[1].lastActive
    );
    const toRemove = sorted.slice(0, sessions.size - MAX_SESSIONS);
    for (const [id] of toRemove) {
      sessions.delete(id);
    }
  }
}

/**
 * Creates a new session with an unpredictable cryptographically secure identifier.
 */
export function createSession(): ProfileSession {
  pruneStaleSessions();

  const sessionId = crypto.randomUUID();
  const profile = createInitialProfile();
  const completeness = evaluateProfileCompleteness(profile);

  const session: ProfileSession = {
    sessionId,
    profile,
    missingFields: completeness.missingFields,
    sectionAnalyses: completeness.sectionAnalyses,
    completionPercentage: completeness.completionPercentage,
    activeQuestionCategory: 'about_you',
    history: [],
    changeHistory: [],
    createdAt: Date.now(),
    lastActive: Date.now(),
  };

  sessions.set(sessionId, session);
  return session;
}

/**
 * Retrieves an existing session or creates a fresh one if the ID is invalid or expired.
 */
export function getOrCreateSession(sessionId?: string): ProfileSession {
  pruneStaleSessions();

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    if (Date.now() - session.lastActive <= SESSION_TTL_MS) {
      session.lastActive = Date.now();
      return session;
    }
    sessions.delete(sessionId);
  }

  return createSession();
}

/**
 * Resets a session to initial state.
 */
export function resetSession(sessionId: string): ProfileSession {
  const session = getOrCreateSession(sessionId);
  session.profile = createInitialProfile();
  const completeness = evaluateProfileCompleteness(session.profile);
  session.missingFields = completeness.missingFields;
  session.sectionAnalyses = completeness.sectionAnalyses;
  session.completionPercentage = completeness.completionPercentage;
  session.activeQuestionCategory = 'about_you';
  session.history = [];
  session.changeHistory = [];
  session.lastActive = Date.now();
  return session;
}

export interface ProfileUpdatePayload {
  aboutYou?: Partial<StudentCareerProfile['aboutYou']>;
  education?: Partial<StudentCareerProfile['education']>;
  skills?: Array<{
    id?: string;
    name: string;
    category?: 'core' | 'frontend' | 'backend' | 'data_ai' | 'tools' | 'other';
    proficiency?: SkillProficiency;
    source?: 'self_reported';
  }>;
  removeSkills?: string[]; // for corrections: "remove Java"
  skillsExplicitlyAbsent?: boolean;
  skillsSkipped?: boolean;
  practicalExperience?: Partial<{
    hasProjects?: boolean | null;
    skipped?: boolean;
    summaryNote?: string;
    projects?: Array<{
      id?: string;
      title: string;
      description?: string;
      techStack?: string[];
      outcome?: string;
      link?: string;
      isInternship?: boolean;
    }>;
  }>;
  interests?: Partial<StudentCareerProfile['interests']>;
  goals?: Partial<StudentCareerProfile['goals']>;
  aiSuggestions?: Partial<StudentCareerProfile['aiSuggestions']>;
}

/**
 * Merges partial profile updates into the session, handles student corrections,
 * preserves raw student inputs, and recalculates granular section completeness.
 */
export function mergeProfileUpdates(
  sessionId: string,
  partialUpdate: ProfileUpdatePayload
): ProfileSession {
  const session = getOrCreateSession(sessionId);
  const now = new Date().toISOString();
  const p = session.profile;

  // 1. About You
  if (partialUpdate.aboutYou) {
    if (partialUpdate.aboutYou.currentStage && partialUpdate.aboutYou.currentStage !== p.aboutYou.currentStage) {
      session.changeHistory.push({
        field: 'aboutYou.currentStage',
        oldValue: p.aboutYou.currentStage,
        newValue: partialUpdate.aboutYou.currentStage,
        timestamp: now,
      });
      p.aboutYou.currentStage = partialUpdate.aboutYou.currentStage;
    }
    if (partialUpdate.aboutYou.stageLabel) {
      p.aboutYou.stageLabel = partialUpdate.aboutYou.stageLabel;
    }
    if (partialUpdate.aboutYou.skipped !== undefined) {
      p.aboutYou.skipped = partialUpdate.aboutYou.skipped;
    }
  }

  // 2. Education
  if (partialUpdate.education) {
    const edu = partialUpdate.education;
    if (edu.degree && edu.degree !== p.education.degree) {
      session.changeHistory.push({
        field: 'education.degree',
        oldValue: p.education.degree,
        newValue: edu.degree,
        timestamp: now,
      });
      p.education.degree = edu.degree;
    }
    if (edu.field && edu.field !== p.education.field) {
      session.changeHistory.push({
        field: 'education.field',
        oldValue: p.education.field,
        newValue: edu.field,
        timestamp: now,
      });
      p.education.field = edu.field;
    }
    if (edu.graduationYear && edu.graduationYear !== p.education.graduationYear) {
      session.changeHistory.push({
        field: 'education.graduationYear',
        oldValue: p.education.graduationYear,
        newValue: edu.graduationYear,
        timestamp: now,
      });
      p.education.graduationYear = edu.graduationYear;
    }
    if (edu.academicFocus && Array.isArray(edu.academicFocus)) {
      p.education.academicFocus = Array.from(new Set([...p.education.academicFocus, ...edu.academicFocus]));
    }
  }

  // 3. Technical Skills (strictly self-reported, proficiency is null unless stated)
  if (partialUpdate.removeSkills && Array.isArray(partialUpdate.removeSkills)) {
    const removeSet = new Set(partialUpdate.removeSkills.map((s) => s.toLowerCase().trim()));
    const beforeCount = p.skills.length;
    p.skills = p.skills.filter((s) => !removeSet.has(s.name.toLowerCase().trim()));
    if (p.skills.length !== beforeCount) {
      session.changeHistory.push({
        field: 'skills.removed',
        oldValue: partialUpdate.removeSkills,
        newValue: p.skills.map((s) => s.name),
        timestamp: now,
      });
    }
  }

  if (partialUpdate.skillsExplicitlyAbsent !== undefined) {
    p.skillsExplicitlyAbsent = partialUpdate.skillsExplicitlyAbsent;
  }
  if (partialUpdate.skillsSkipped !== undefined) {
    p.skillsSkipped = partialUpdate.skillsSkipped;
  }

  if (partialUpdate.skills && Array.isArray(partialUpdate.skills)) {
    const existingMap = new Map(p.skills.map((s) => [s.name.toLowerCase().trim(), s]));
    for (const skill of partialUpdate.skills) {
      const key = skill.name.toLowerCase().trim();
      if (!existingMap.has(key)) {
        existingMap.set(key, {
          id: skill.id || `skill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: skill.name,
          category: skill.category || 'core',
          proficiency: skill.proficiency || null, // null when unspecified! Never fabricate
          source: 'self_reported',
        });
      } else {
        // Update proficiency only if student explicitly stated it
        if (skill.proficiency !== undefined && skill.proficiency !== null) {
          const item = existingMap.get(key)!;
          item.proficiency = skill.proficiency;
        }
      }
    }
    p.skills = Array.from(existingMap.values());
    if (p.skills.length > 0) {
      p.skillsExplicitlyAbsent = false;
    }
  }

  // 4. Practical Experience
  if (partialUpdate.practicalExperience) {
    const pe = partialUpdate.practicalExperience;
    if (pe.hasProjects !== undefined && pe.hasProjects !== null) {
      p.practicalExperience.hasProjects = pe.hasProjects;
    }
    if (pe.skipped !== undefined) {
      p.practicalExperience.skipped = pe.skipped;
    }
    if (pe.summaryNote) {
      p.practicalExperience.summaryNote = pe.summaryNote;
    }
    if (pe.projects && Array.isArray(pe.projects)) {
      const existingProjectTitles = new Set(
        p.practicalExperience.projects.map((pr) => pr.title.toLowerCase().trim())
      );
      for (const pr of pe.projects) {
        if (!existingProjectTitles.has(pr.title.toLowerCase().trim())) {
          p.practicalExperience.projects.push({
            id: pr.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: pr.title,
            description: pr.description || '',
            techStack: pr.techStack || [],
            outcome: pr.outcome,
            link: pr.link,
            isInternship: pr.isInternship,
          });
          p.practicalExperience.hasProjects = true;
        }
      }
    }
  }

  // 5. Interests
  if (partialUpdate.interests) {
    const it = partialUpdate.interests;
    if (it.primaryTracks && Array.isArray(it.primaryTracks)) {
      p.interests.primaryTracks = Array.from(new Set([...p.interests.primaryTracks, ...it.primaryTracks]));
    }
    if (it.preferredDomains && Array.isArray(it.preferredDomains)) {
      p.interests.preferredDomains = Array.from(new Set([...p.interests.preferredDomains, ...it.preferredDomains]));
    }
    if (it.workEnvironment && it.workEnvironment !== p.interests.workEnvironment) {
      p.interests.workEnvironment = it.workEnvironment;
    }
    if (it.skipped !== undefined) {
      p.interests.skipped = it.skipped;
    }
  }

  // 6. Goals
  if (partialUpdate.goals) {
    const g = partialUpdate.goals;
    if (g.targetRoles && Array.isArray(g.targetRoles)) {
      p.goals.targetRoles = Array.from(new Set([...p.goals.targetRoles, ...g.targetRoles]));
    }
    if (g.topPriority && g.topPriority !== p.goals.topPriority) {
      p.goals.topPriority = g.topPriority;
    }
    if (g.timeline && g.timeline !== p.goals.timeline) {
      p.goals.timeline = g.timeline;
    }
    if (g.skipped !== undefined) {
      p.goals.skipped = g.skipped;
    }
  }

  // 7. Separate AI suggestions (kept strictly separated from self-reported profile fields)
  if (partialUpdate.aiSuggestions) {
    if (partialUpdate.aiSuggestions.suggestedSkillsToExplore) {
      p.aiSuggestions.suggestedSkillsToExplore = partialUpdate.aiSuggestions.suggestedSkillsToExplore;
    }
    if (partialUpdate.aiSuggestions.suggestedRoles) {
      p.aiSuggestions.suggestedRoles = partialUpdate.aiSuggestions.suggestedRoles;
    }
    if (partialUpdate.aiSuggestions.clarificationNeeded !== undefined) {
      p.aiSuggestions.clarificationNeeded = partialUpdate.aiSuggestions.clarificationNeeded;
    }
  }

  // Recalculate completeness with granular state tracking
  const completeness = evaluateProfileCompleteness(p, DEFAULT_PROFILING_REQUIREMENTS);
  session.missingFields = completeness.missingFields;
  session.sectionAnalyses = completeness.sectionAnalyses;
  session.completionPercentage = completeness.completionPercentage;

  if (completeness.isReadyForReview) {
    if (p.status !== 'confirmed') {
      p.status = 'ready_for_review';
    }
    session.activeQuestionCategory = 'review';
  } else {
    session.activeQuestionCategory = session.missingFields[0];
  }

  session.lastActive = Date.now();
  return session;
}

/**
 * Confirms student profile when they approve the review card.
 */
export function confirmStudentProfile(sessionId: string): ProfileSession {
  const session = getOrCreateSession(sessionId);
  session.profile.status = 'confirmed';
  session.lastActive = Date.now();
  return session;
}

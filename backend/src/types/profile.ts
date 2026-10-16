/**
 * Profile and Session Types for Dynamic Student Profiling (Phase 2 Refinement)
 * Implements strict separation of self-reported facts from AI inferences,
 * granular section states (unaddressed, partial, complete, explicitly_absent, skipped),
 * and configurable completion requirements.
 */

export type CareerStage = 'pre_final' | 'final_year' | 'early_years' | 'recent_grad';

export interface EducationInfo {
  degree: string;
  field: string;
  academicFocus: string[];
  graduationYear: string;
}

export type SkillProficiency = 'exploring' | 'practicing' | 'proficient' | null;

export interface SkillItem {
  id: string;
  name: string;
  category: 'core' | 'frontend' | 'backend' | 'data_ai' | 'tools' | 'other';
  proficiency: SkillProficiency; // null when student did not explicitly state experience level
  source: 'self_reported';
}

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  outcome?: string;
  link?: string;
  isInternship?: boolean;
}

export interface PracticalExperience {
  hasProjects: boolean | null; // true, false (if candidate explicitly states "no projects yet"), or null (unaddressed)
  skipped: boolean;
  projects: ProjectEntry[];
  summaryNote?: string;
}

export interface CareerInterests {
  primaryTracks: string[];
  workEnvironment: string;
  preferredDomains: string[];
  skipped?: boolean;
}

export interface CareerGoals {
  targetRoles: string[];
  topPriority: string;
  timeline: string;
  skipped?: boolean;
}

export interface AiSuggestions {
  suggestedSkillsToExplore: string[];
  suggestedRoles: string[];
  clarificationNeeded?: string | null;
}

export interface StudentCareerProfile {
  aboutYou: {
    currentStage: string;
    stageLabel: string;
    skipped?: boolean;
  };
  education: EducationInfo;
  skills: SkillItem[];
  skillsExplicitlyAbsent?: boolean; // true if candidate explicitly states "no technical skills yet"
  skillsSkipped?: boolean;
  practicalExperience: PracticalExperience;
  interests: CareerInterests;
  goals: CareerGoals;
  aiSuggestions: AiSuggestions;
  status: 'in_progress' | 'ready_for_review' | 'confirmed';
}

export type ProfileSectionKey =
  | 'about_you'
  | 'education'
  | 'skills'
  | 'practical_experience'
  | 'interests'
  | 'goals';

export type SectionState =
  | 'unaddressed'        // not yet mentioned
  | 'partial'            // partially collected (missing required subfields)
  | 'complete'           // all required fields for this section are collected
  | 'explicitly_absent'  // candidate explicitly stated they do not have this (e.g. no projects yet)
  | 'skipped';           // candidate explicitly chose to skip this section for now

export interface SectionAnalysis {
  key: ProfileSectionKey;
  label: string;
  state: SectionState;
  collectedSummary: string;
  missingDetails: string[];
}

export interface ProfilingRequirements {
  requireStage: boolean;
  requireGraduationYear: boolean;
  requireDegree: boolean;
  requireField: boolean;
  minSkillsCount: number;
  allowExplicitAbsentProjects: boolean;
  allowSkipProjects: boolean;
  requireInterests: boolean;
  requireGoals: boolean;
}

export const DEFAULT_PROFILING_REQUIREMENTS: ProfilingRequirements = {
  requireStage: true,
  requireGraduationYear: true,
  requireDegree: true,
  requireField: true,
  minSkillsCount: 1,
  allowExplicitAbsentProjects: true,
  allowSkipProjects: true,
  requireInterests: true,
  requireGoals: true,
};

export interface ProfileSession {
  sessionId: string;
  profile: StudentCareerProfile;
  missingFields: ProfileSectionKey[];
  sectionAnalyses: Record<ProfileSectionKey, SectionAnalysis>;
  completionPercentage: number;
  activeQuestionCategory: ProfileSectionKey | 'general_qa' | 'review';
  history: Array<{ role: 'user' | 'model'; text: string }>;
  changeHistory: Array<{ field: string; oldValue: any; newValue: any; timestamp: string }>;
  createdAt: number;
  lastActive: number;
}

export function createInitialProfile(): StudentCareerProfile {
  return {
    aboutYou: {
      currentStage: '',
      stageLabel: '',
      skipped: false,
    },
    education: {
      degree: '',
      field: '',
      academicFocus: [],
      graduationYear: '',
    },
    skills: [],
    skillsExplicitlyAbsent: false,
    skillsSkipped: false,
    practicalExperience: {
      hasProjects: null,
      skipped: false,
      projects: [],
      summaryNote: '',
    },
    interests: {
      primaryTracks: [],
      workEnvironment: '',
      preferredDomains: [],
      skipped: false,
    },
    goals: {
      targetRoles: [],
      topPriority: '',
      timeline: '',
      skipped: false,
    },
    aiSuggestions: {
      suggestedSkillsToExplore: [],
      suggestedRoles: [],
      clarificationNeeded: null,
    },
    status: 'in_progress',
  };
}

export const ALL_PROFILE_SECTIONS: ProfileSectionKey[] = [
  'about_you',
  'education',
  'skills',
  'practical_experience',
  'interests',
  'goals',
];

/**
 * Evaluates profile completeness with granular section states
 * distinguishing missing, partial, explicitly absent, skipped, and complete.
 */
export function evaluateProfileCompleteness(
  profile: StudentCareerProfile,
  requirements: ProfilingRequirements = DEFAULT_PROFILING_REQUIREMENTS
): {
  sectionAnalyses: Record<ProfileSectionKey, SectionAnalysis>;
  missingFields: ProfileSectionKey[];
  completionPercentage: number;
  isReadyForReview: boolean;
} {
  const analyses: Partial<Record<ProfileSectionKey, SectionAnalysis>> = {};

  // 1. About You (Stage & Graduation Year)
  {
    const hasStage = Boolean(profile.aboutYou.currentStage && profile.aboutYou.currentStage.trim());
    const hasGradYear = Boolean(profile.education.graduationYear && profile.education.graduationYear.trim());
    const isSkipped = Boolean(profile.aboutYou.skipped);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (isSkipped) {
      state = 'skipped';
    } else if (hasStage && hasGradYear) {
      state = 'complete';
    } else if (hasStage || hasGradYear) {
      state = 'partial';
      if (!hasStage && requirements.requireStage) missing.push('current career stage / year of study');
      if (!hasGradYear && requirements.requireGraduationYear) missing.push('target graduation year');
    } else {
      state = 'unaddressed';
      if (requirements.requireStage) missing.push('current career stage');
      if (requirements.requireGraduationYear) missing.push('graduation year');
    }

    analyses.about_you = {
      key: 'about_you',
      label: 'Career Stage & Timeline',
      state,
      collectedSummary: hasStage
        ? `${profile.aboutYou.stageLabel || profile.aboutYou.currentStage}${hasGradYear ? ` (Graduating ${profile.education.graduationYear})` : ''}`
        : hasGradYear
          ? `Graduating ${profile.education.graduationYear}`
          : 'Not provided',
      missingDetails: missing,
    };
  }

  // 2. Education (Degree & Field/Major)
  {
    const hasDegree = Boolean(profile.education.degree && profile.education.degree.trim());
    const hasField = Boolean(profile.education.field && profile.education.field.trim());

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (hasDegree && hasField) {
      state = 'complete';
    } else if (hasDegree || hasField) {
      state = 'partial';
      if (!hasDegree && requirements.requireDegree) missing.push('degree name');
      if (!hasField && requirements.requireField) missing.push('branch / field of study');
    } else {
      state = 'unaddressed';
      if (requirements.requireDegree) missing.push('degree name');
      if (requirements.requireField) missing.push('field of study');
    }

    analyses.education = {
      key: 'education',
      label: 'Education & Academics',
      state,
      collectedSummary: hasDegree && hasField
        ? `${profile.education.degree} in ${profile.education.field}`
        : hasDegree
          ? `${profile.education.degree} (major unspecified)`
          : hasField
            ? `${profile.education.field} (degree unspecified)`
            : 'Not provided',
      missingDetails: missing,
    };
  }

  // 3. Technical Skills
  {
    const skillCount = profile.skills.length;
    const isExplicitlyAbsent = Boolean(profile.skillsExplicitlyAbsent);
    const isSkipped = Boolean(profile.skillsSkipped);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (skillCount >= requirements.minSkillsCount) {
      state = 'complete';
    } else if (isExplicitlyAbsent) {
      state = 'explicitly_absent';
    } else if (isSkipped) {
      state = 'skipped';
    } else {
      state = 'unaddressed';
      missing.push('self-reported technical skills or tools');
    }

    analyses.skills = {
      key: 'skills',
      label: 'Technical Skills',
      state,
      collectedSummary: skillCount > 0
        ? profile.skills.map((s) => s.name).join(', ')
        : isExplicitlyAbsent
          ? 'Candidate reported no technical skills yet'
          : isSkipped
            ? 'Skipped for now'
            : 'None provided',
      missingDetails: missing,
    };
  }

  // 4. Practical Experience & Projects
  {
    const projectCount = profile.practicalExperience.projects.length;
    const isExplicitlyAbsent = profile.practicalExperience.hasProjects === false;
    const isSkipped = Boolean(profile.practicalExperience.skipped);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (projectCount > 0) {
      state = 'complete';
    } else if (isExplicitlyAbsent && requirements.allowExplicitAbsentProjects) {
      state = 'explicitly_absent';
    } else if (isSkipped && requirements.allowSkipProjects) {
      state = 'skipped';
    } else {
      state = 'unaddressed';
      missing.push('practical projects, coursework builds, or internships');
    }

    analyses.practical_experience = {
      key: 'practical_experience',
      label: 'Practical Experience',
      state,
      collectedSummary: projectCount > 0
        ? `${projectCount} project(s) logged`
        : isExplicitlyAbsent
          ? 'No practical projects yet (focusing on fundamentals)'
          : isSkipped
            ? 'Skipped for now'
            : 'None provided',
      missingDetails: missing,
    };
  }

  // 5. Interests & Work Preferences
  {
    const hasTracks = Boolean(profile.interests.primaryTracks && profile.interests.primaryTracks.length > 0);
    const hasDomains = Boolean(profile.interests.preferredDomains && profile.interests.preferredDomains.length > 0);
    const hasEnv = Boolean(profile.interests.workEnvironment && profile.interests.workEnvironment.trim());
    const isSkipped = Boolean(profile.interests.skipped);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (hasTracks || hasDomains || hasEnv) {
      state = 'complete';
    } else if (isSkipped) {
      state = 'skipped';
    } else {
      state = 'unaddressed';
      missing.push('preferred tech tracks, problem domains, or work style');
    }

    analyses.interests = {
      key: 'interests',
      label: 'Interests & Environment',
      state,
      collectedSummary: hasTracks
        ? profile.interests.primaryTracks.join(', ')
        : hasDomains
          ? profile.interests.preferredDomains.join(', ')
          : isSkipped
            ? 'Skipped for now'
            : 'None provided',
      missingDetails: missing,
    };
  }

  // 6. Goals & Target Roles
  {
    const hasRoles = Boolean(profile.goals.targetRoles && profile.goals.targetRoles.length > 0);
    const hasPriority = Boolean(profile.goals.topPriority && profile.goals.topPriority.trim());
    const isSkipped = Boolean(profile.goals.skipped);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (hasRoles || hasPriority) {
      state = 'complete';
    } else if (isSkipped) {
      state = 'skipped';
    } else {
      state = 'unaddressed';
      missing.push('target job roles or placement priority');
    }

    analyses.goals = {
      key: 'goals',
      label: 'Career Goals',
      state,
      collectedSummary: hasRoles
        ? profile.goals.targetRoles.join(', ')
        : hasPriority
          ? profile.goals.topPriority
          : isSkipped
            ? 'Skipped for now'
            : 'None provided',
      missingDetails: missing,
    };
  }

  const typedAnalyses = analyses as Record<ProfileSectionKey, SectionAnalysis>;

  // A section is satisfied if it is complete, explicitly absent, or skipped
  const satisfiedSections = ALL_PROFILE_SECTIONS.filter((key) => {
    const s = typedAnalyses[key].state;
    return s === 'complete' || s === 'explicitly_absent' || s === 'skipped';
  });

  const missingFields = ALL_PROFILE_SECTIONS.filter((key) => !satisfiedSections.includes(key));
  const completionPercentage = Math.round((satisfiedSections.length / ALL_PROFILE_SECTIONS.length) * 100);
  const isReadyForReview = missingFields.length === 0;

  return {
    sectionAnalyses: typedAnalyses,
    missingFields,
    completionPercentage,
    isReadyForReview,
  };
}

/**
 * Career Ladder Profile and Session Types
 * Supports all career stages (students, working professionals, career switchers),
 * across all industries (tech, commerce, sciences, arts, trades),
 * mapping from Point A (Current Position) to Point B (Desired Destination).
 *
 * Implements:
 * - Journey A (Career Decided) vs Journey B (Career Exploring)
 * - Strict separation of self-reported facts from AI inferences
 * - Non-blocking, flexible completion requirements across experience levels
 */

import type { CapabilityAssessmentRecord, ValidationState } from './validation.js';

export type CareerIntent = 'career_decided' | 'career_exploring' | 'uncertain';

export type CareerStage =
  | 'working_pro'
  | 'career_switcher'
  | 'recent_grad'
  | 'student'
  | 'job_seeker'
  | 'pre_final'
  | 'final_year'
  | 'early_years';

export interface EducationInfo {
  degree: string;
  field: string;
  academicFocus: string[];
  graduationYear: string;
  certifications?: string[];
  skipped?: boolean;
}

export type SkillProficiency = 'exploring' | 'practicing' | 'proficient' | null;

export interface SkillItem {
  id: string;
  name: string;
  category:
    | 'technical'
    | 'domain'
    | 'soft_skills'
    | 'tools'
    | 'core'
    | 'frontend'
    | 'backend'
    | 'data_ai'
    | 'other';
  proficiency: SkillProficiency; // null when candidate did not explicitly state experience level
  source: 'self_reported';
}

export interface ProjectEntry {
  id: string;
  title: string;
  organizationOrContext?: string;
  description: string;
  techStack?: string[];
  outcome?: string;
  link?: string;
  isWorkExperience?: boolean;
  isInternship?: boolean;
}

export interface PracticalExperience {
  hasProjects: boolean | null; // true, false (explicitly states no projects/work yet), or null
  hasExperience?: boolean | null;
  skipped: boolean;
  projects: ProjectEntry[];
  summaryNote?: string;
}

export interface CareerInterests {
  primaryTracks: string[];
  workEnvironment: string;
  preferredDomains: string[];
  motivations?: string[];
  constraints?: string[];
  skipped?: boolean;
}

export interface CareerGoals {
  targetRoles: string[]; // Point B targets when known
  topPriority: string;
  timeline: string;
  destinationSummary?: string; // Point B narrative summary
  transitionMotivations?: string;
  capabilityGapsOrUncertainties?: string[];
  skipped?: boolean;
}

export interface AiSuggestions {
  suggestedSkillsToExplore: string[];
  suggestedRoles: string[];
  suggestedDirectionsToExplore?: string[];
  potentialCapabilityGaps?: string[];
  clarificationNeeded?: string | null;
}

export interface StudentCareerProfile {
  careerIntent: CareerIntent;
  aboutYou: {
    currentStage: string;
    stageLabel: string;
    currentRole?: string; // Point A current role / job title
    yearsOfExperience?: string;
    industry?: string;
    email?: string;
    skipped?: boolean;
  };
  email?: string;
  education: EducationInfo;
  skills: SkillItem[];
  skillsExplicitlyAbsent?: boolean;
  skillsSkipped?: boolean;
  practicalExperience: PracticalExperience;
  interests: CareerInterests;
  goals: CareerGoals;
  aiSuggestions: AiSuggestions;
  pointASummary?: string; // Point A: current position synthesis
  pointBSummary?: string; // Point B: destination / target trajectory
  capabilityAssessment?: CapabilityAssessmentRecord;
  status: 'in_progress' | 'ready_for_review' | 'confirmed';
}

// Backwards-compatible alias for unified Career Ladder profile
export type CareerProfile = StudentCareerProfile;

export type ProfileSectionKey =
  | 'about_you'
  | 'education'
  | 'skills'
  | 'practical_experience'
  | 'interests'
  | 'goals';

export type SectionState =
  | 'unaddressed'        // not yet mentioned
  | 'partial'            // partially collected
  | 'complete'           // all essential fields collected
  | 'explicitly_absent'  // candidate explicitly stated they do not have this
  | 'skipped';           // candidate chose to skip this section

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
  requireGraduationYear: false, // Optional for experienced professionals
  requireDegree: false,         // Flexible across education levels
  requireField: false,
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
  activeQuestionCategory: ProfileSectionKey | 'general_qa' | 'review' | 'capability_validation';
  validationState?: ValidationState;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  changeHistory: Array<{ field: string; oldValue: any; newValue: any; timestamp: string }>;
  createdAt: number;
  lastActive: number;
}

export function createInitialProfile(): StudentCareerProfile {
  return {
    careerIntent: 'uncertain',
    aboutYou: {
      currentStage: '',
      stageLabel: '',
      currentRole: '',
      yearsOfExperience: '',
      industry: '',
      skipped: false,
    },
    education: {
      degree: '',
      field: '',
      academicFocus: [],
      graduationYear: '',
      certifications: [],
      skipped: false,
    },
    skills: [],
    skillsExplicitlyAbsent: false,
    skillsSkipped: false,
    practicalExperience: {
      hasProjects: null,
      hasExperience: null,
      skipped: false,
      projects: [],
      summaryNote: '',
    },
    interests: {
      primaryTracks: [],
      workEnvironment: '',
      preferredDomains: [],
      motivations: [],
      constraints: [],
      skipped: false,
    },
    goals: {
      targetRoles: [],
      topPriority: '',
      timeline: '',
      destinationSummary: '',
      transitionMotivations: '',
      capabilityGapsOrUncertainties: [],
      skipped: false,
    },
    aiSuggestions: {
      suggestedSkillsToExplore: [],
      suggestedRoles: [],
      suggestedDirectionsToExplore: [],
      potentialCapabilityGaps: [],
      clarificationNeeded: null,
    },
    pointASummary: '',
    pointBSummary: '',
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
 * Evaluates profile completeness across diverse backgrounds:
 * Adapts expectations whether candidate is a student, working professional, or career switcher,
 * and whether they are Career Decided (Journey A) or Career Exploring (Journey B).
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

  const isProfessional = Boolean(
    profile.aboutYou.currentRole ||
    (profile.aboutYou.yearsOfExperience && profile.aboutYou.yearsOfExperience !== '0') ||
    profile.aboutYou.currentStage === 'working_pro' ||
    profile.aboutYou.currentStage === 'career_switcher'
  );

  // 1. About You (Point A: Current Position)
  {
    const hasStage = Boolean(profile.aboutYou.currentStage && profile.aboutYou.currentStage.trim());
    const hasRole = Boolean(profile.aboutYou.currentRole && profile.aboutYou.currentRole.trim());
    const hasGradYear = Boolean(profile.education.graduationYear && profile.education.graduationYear.trim());
    const isSkipped = Boolean(profile.aboutYou.skipped);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (isSkipped) {
      state = 'skipped';
    } else if (hasStage || hasRole) {
      state = 'complete';
    } else {
      state = 'unaddressed';
      missing.push('current career stage, current role, or professional background');
    }

    const summaryParts: string[] = [];
    if (profile.aboutYou.currentRole) summaryParts.push(profile.aboutYou.currentRole);
    if (profile.aboutYou.stageLabel) summaryParts.push(profile.aboutYou.stageLabel);
    else if (profile.aboutYou.currentStage) summaryParts.push(profile.aboutYou.currentStage);
    if (profile.aboutYou.yearsOfExperience) summaryParts.push(`${profile.aboutYou.yearsOfExperience} exp`);
    if (hasGradYear && !isProfessional) summaryParts.push(`Graduating ${profile.education.graduationYear}`);

    analyses.about_you = {
      key: 'about_you',
      label: 'Current Position (Point A)',
      state,
      collectedSummary: summaryParts.length > 0 ? summaryParts.join(' • ') : 'Not provided',
      missingDetails: missing,
    };
  }

  // 2. Education & Qualifications
  {
    const hasDegree = Boolean(profile.education.degree && profile.education.degree.trim());
    const hasField = Boolean(profile.education.field && profile.education.field.trim());
    const hasCerts = Boolean(profile.education.certifications && profile.education.certifications.length > 0);
    const isSkipped = Boolean(profile.education.skipped);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (isSkipped) {
      state = 'skipped';
    } else if (hasDegree || hasField || hasCerts) {
      state = 'complete';
    } else if (isProfessional) {
      // For working professionals, unstated education is considered complete or optional
      state = 'complete';
    } else {
      state = 'unaddressed';
      missing.push('education level, field of study, or relevant training');
    }

    let eduSummary = 'Not provided';
    if (hasDegree && hasField) {
      eduSummary = `${profile.education.degree} in ${profile.education.field}`;
    } else if (hasDegree) {
      eduSummary = profile.education.degree;
    } else if (hasField) {
      eduSummary = `Background in ${profile.education.field}`;
    } else if (isProfessional) {
      eduSummary = 'Professional experience background';
    }

    analyses.education = {
      key: 'education',
      label: 'Education & Qualifications',
      state,
      collectedSummary: eduSummary,
      missingDetails: missing,
    };
  }

  // 3. Skills & Capabilities (Technical, Non-Technical, or Domain)
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
      missing.push('existing skills (technical, domain, or professional)');
    }

    analyses.skills = {
      key: 'skills',
      label: 'Skills & Capabilities',
      state,
      collectedSummary: skillCount > 0
        ? profile.skills.map((s) => s.name).join(', ')
        : isExplicitlyAbsent
          ? 'Candidate reported no specific formal skills yet (exploring from scratch)'
          : isSkipped
            ? 'Skipped for now'
            : 'None provided',
      missingDetails: missing,
    };
  }

  // 4. Practical Experience & Work Accomplishments
  {
    const projectCount = profile.practicalExperience.projects.length;
    const isExplicitlyAbsent = profile.practicalExperience.hasProjects === false || profile.practicalExperience.hasExperience === false;
    const isSkipped = Boolean(profile.practicalExperience.skipped);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (projectCount > 0 || Boolean(profile.practicalExperience.summaryNote)) {
      state = 'complete';
    } else if (isProfessional && Boolean(profile.aboutYou.currentRole)) {
      // Working professional whose experience is encapsulated in current/past role
      state = 'complete';
    } else if (isExplicitlyAbsent && requirements.allowExplicitAbsentProjects) {
      state = 'explicitly_absent';
    } else if (isSkipped && requirements.allowSkipProjects) {
      state = 'skipped';
    } else {
      state = 'unaddressed';
      missing.push('work history, projects, or practical accomplishments');
    }

    analyses.practical_experience = {
      key: 'practical_experience',
      label: 'Practical Experience & Projects',
      state,
      collectedSummary: projectCount > 0
        ? `${projectCount} accomplishment(s)/project(s) logged`
        : profile.practicalExperience.summaryNote
          ? profile.practicalExperience.summaryNote
          : isProfessional
            ? `Experience logged via role: ${profile.aboutYou.currentRole || 'Professional'}`
            : isExplicitlyAbsent
              ? 'No formal practical projects yet'
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
    const hasMotivations = Boolean(profile.interests.motivations && profile.interests.motivations.length > 0);
    const isSkipped = Boolean(profile.interests.skipped);
    const isDecided = profile.careerIntent === 'career_decided';
    const hasDecidedGoal = Boolean(profile.goals.targetRoles && profile.goals.targetRoles.length > 0) || Boolean(profile.goals.destinationSummary);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (hasTracks || hasDomains || hasEnv || hasMotivations || (isDecided && hasDecidedGoal)) {
      state = 'complete';
    } else if (isSkipped) {
      state = 'skipped';
    } else {
      state = 'unaddressed';
      missing.push('career interests, work style, or problem spaces');
    }

    analyses.interests = {
      key: 'interests',
      label: 'Interests & Work Preferences',
      state,
      collectedSummary: hasTracks
        ? profile.interests.primaryTracks.join(', ')
        : hasDomains
          ? profile.interests.preferredDomains.join(', ')
          : hasEnv
            ? profile.interests.workEnvironment
            : isDecided && profile.goals.targetRoles?.length
              ? `Aligned with target goal: ${profile.goals.targetRoles.join(', ')}`
              : isSkipped
                ? 'Skipped for now'
                : 'None provided',
      missingDetails: missing,
    };
  }

  // 6. Career Goals & Destination (Point B)
  {
    const hasRoles = Boolean(profile.goals.targetRoles && profile.goals.targetRoles.length > 0);
    const hasDestSummary = Boolean(profile.goals.destinationSummary && profile.goals.destinationSummary.trim());
    const hasPriority = Boolean(profile.goals.topPriority && profile.goals.topPriority.trim());
    const isExploring = profile.careerIntent === 'career_exploring';
    const isSkipped = Boolean(profile.goals.skipped);

    let state: SectionState = 'unaddressed';
    const missing: string[] = [];

    if (hasRoles || hasDestSummary || (isExploring && (hasPriority || profile.interests.primaryTracks.length > 0))) {
      state = 'complete';
    } else if (isSkipped) {
      state = 'skipped';
    } else {
      state = 'unaddressed';
      missing.push(isExploring ? 'career exploration focus or timeline' : 'target career role or destination');
    }

    analyses.goals = {
      key: 'goals',
      label: 'Career Destination & Goals (Point B)',
      state,
      collectedSummary: hasRoles
        ? profile.goals.targetRoles.join(', ')
        : hasDestSummary
          ? profile.goals.destinationSummary!
          : isExploring
            ? 'Actively exploring viable career directions'
            : hasPriority
              ? profile.goals.topPriority
              : isSkipped
                ? 'Skipped for now'
                : 'None provided',
      missingDetails: missing,
    };
  }

  const typedAnalyses = analyses as Record<ProfileSectionKey, SectionAnalysis>;

  const satisfiedSections = ALL_PROFILE_SECTIONS.filter((key) => {
    const s = typedAnalyses[key].state;
    return s === 'complete' || s === 'explicitly_absent' || s === 'skipped';
  });

  const missingFields = ALL_PROFILE_SECTIONS.filter((key) => !satisfiedSections.includes(key));
  const completionPercentage = Math.round((satisfiedSections.length / ALL_PROFILE_SECTIONS.length) * 100);
  const isReadyForReview = missingFields.length === 0;

  // Synthesize Point A and Point B summary strings
  profile.pointASummary = typedAnalyses.about_you.collectedSummary;
  profile.pointBSummary = typedAnalyses.goals.collectedSummary;

  return {
    sectionAnalyses: typedAnalyses,
    missingFields,
    completionPercentage,
    isReadyForReview,
  };
}

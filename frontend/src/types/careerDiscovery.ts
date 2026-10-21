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
  proficiency: SkillProficiency;
  source?: 'self_reported' | 'verified';
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
  hasProjects: boolean | null;
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
  targetRoles: string[];
  topPriority: string;
  timeline: string;
  destinationSummary?: string;
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

export type SectionState =
  | 'unaddressed'
  | 'partial'
  | 'complete'
  | 'explicitly_absent'
  | 'skipped';

export interface SectionAnalysis {
  key: string;
  label: string;
  state: SectionState;
  collectedSummary: string;
  missingDetails: string[];
}

export interface StudentCareerProfile {
  careerIntent?: CareerIntent;
  aboutYou: {
    currentStage: string;
    stageLabel: string;
    currentRole?: string;
    yearsOfExperience?: string;
    industry?: string;
    graduationYear?: string;
    skipped?: boolean;
  };
  education: EducationInfo;
  skills: SkillItem[];
  skillsExplicitlyAbsent?: boolean;
  skillsSkipped?: boolean;
  projects?: ProjectEntry[];
  practicalExperience: PracticalExperience;
  interests: CareerInterests;
  goals: CareerGoals;
  aiSuggestions?: AiSuggestions;
  pointASummary?: string;
  pointBSummary?: string;
  status?: 'in_progress' | 'ready_for_review' | 'confirmed';
}

export type CareerProfile = StudentCareerProfile;

export type DiscoverySectionId =
  | 'welcome'
  | 'about_you'
  | 'education'
  | 'skills'
  | 'experience'
  | 'interests'
  | 'goals'
  | 'review'
  | 'results';

export interface DiscoverySectionMeta {
  id: DiscoverySectionId;
  index: number;
  label: string;
  shortLabel: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export interface CareerPathRecommendation {
  id: string;
  title: string;
  matchScore: number;
  summary: string;
  matchedSkills: string[];
  skillsToAcquire: string[];
  demandLevel: 'Very High' | 'High' | 'Steady';
  targetRoles: string[];
  averageTimelineMonths: number;
}

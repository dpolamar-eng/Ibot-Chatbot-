export type CareerStage =
  | 'pre_final'
  | 'final_year'
  | 'early_years'
  | 'recent_grad';

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
  proficiency: SkillProficiency;
  source?: 'self_reported' | 'verified';
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
  hasProjects: boolean | null;
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
  aboutYou: {
    currentStage: string;
    stageLabel: string;
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
  status?: 'in_progress' | 'ready_for_review' | 'confirmed';
}

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
  matchScore: number; // self-reported match index
  summary: string;
  matchedSkills: string[];
  skillsToAcquire: string[];
  demandLevel: 'Very High' | 'High' | 'Steady';
  targetRoles: string[];
  averageTimelineMonths: number;
}

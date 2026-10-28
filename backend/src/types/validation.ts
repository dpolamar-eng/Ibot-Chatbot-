/**
 * 14 Approved Capability Dimensions from the IBOT Career Ladder Specification
 */
export type CapabilityDimension =
  | 'Knowledge Depth'
  | 'Practical Execution'
  | 'Individual Ownership'
  | 'Problem Solving'
  | 'Decision Making'
  | 'Troubleshooting'
  | 'Quality Assurance'
  | 'Independence'
  | 'Communication'
  | 'Adaptability'
  | 'Delivery Reliability'
  | 'Evidence'
  | 'AI-Assisted Work'
  | 'Learning Application';

/**
 * Three Non-Negotiable Assessment Outcomes
 */
export type AssessmentOutcome =
  | 'profile_complete'
  | 'capability_partially_assessed'
  | 'capability_demonstrated';

/**
 * Validation Conversational Steps
 */
export type ValidationStep = 'knowledge' | 'reasoning' | 'task' | 'complete';

export interface RoleQuestionSpec {
  dimension: CapabilityDimension;
  assessmentType: 'Knowledge' | 'Reasoning' | 'Problem Solving' | 'Decision Making' | 'Troubleshooting' | 'Quality Assurance' | 'Practical Execution';
  prompt: string;
  expectedCriteria: string;
}

export interface RoleValidationBank {
  targetRole: string;
  knowledgeQuestions: RoleQuestionSpec[];
  reasoningQuestions: RoleQuestionSpec[];
  practicalTask: {
    taskTitle: string;
    taskDescription: string;
    requiredEvidence: string;
    acceptanceCriteria: string[];
  };
}

export interface ValidationState {
  targetRole: string;
  currentStep: ValidationStep;
  knowledgeAnswers?: string[];
  reasoningAnswers?: string[];
  practicalDeliverable?: string;
  assistanceTier?: 'purely_manual' | 'ai_assisted_verified' | 'ai_generated' | 'not_disclosed';
  outcome?: AssessmentOutcome;
  assessedDimensions?: Record<string, { verified: boolean; notes: string }>;
  verifiedAt?: string;
}

export interface CapabilityAssessmentRecord {
  targetRole: string;
  version: string;
  outcome: AssessmentOutcome;
  outcomeLabel: string;
  assessedDimensions: string[];
  verifiedDimensions: string[];
  unmetDimensions?: string[];
  evidenceUrlOrSummary?: string;
  assistanceTier?: string;
  assessedAt: string;
  strengths: string[];
  limitations: string[];
  growthNextSteps: string[];
}

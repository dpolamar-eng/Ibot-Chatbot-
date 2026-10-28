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

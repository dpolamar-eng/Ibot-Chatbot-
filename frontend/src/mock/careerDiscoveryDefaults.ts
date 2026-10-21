import {
  StudentCareerProfile,
  DiscoverySectionMeta,
  CareerPathRecommendation,
} from '../types/careerDiscovery';

export const INITIAL_SECTIONS: DiscoverySectionMeta[] = [
  {
    id: 'about_you',
    index: 1,
    label: '1. Current Position (Point A)',
    shortLabel: 'Point A',
    description: 'Where you are now: career stage, role, or background',
    isCompleted: false,
    isRequired: true,
  },
  {
    id: 'education',
    index: 2,
    label: '2. Education & Qualifications',
    shortLabel: 'Education',
    description: 'Degrees, certifications, or self-directed training',
    isCompleted: false,
    isRequired: false, // Optional for experienced professionals
  },
  {
    id: 'skills',
    index: 3,
    label: '3. Skills & Capabilities',
    shortLabel: 'Skills',
    description: 'Technical, domain, and professional competencies',
    isCompleted: false,
    isRequired: true,
  },
  {
    id: 'experience',
    index: 4,
    label: '4. Practical Experience & Work',
    shortLabel: 'Experience',
    description: 'Work history, notable projects, or practical exposure',
    isCompleted: false,
    isRequired: false, // Optional with skip
  },
  {
    id: 'interests',
    index: 5,
    label: '5. Interests & Work Preferences',
    shortLabel: 'Preferences',
    description: 'Target industries, work environment, and motivations',
    isCompleted: false,
    isRequired: true,
  },
  {
    id: 'goals',
    index: 6,
    label: '6. Career Destination (Point B)',
    shortLabel: 'Point B',
    description: 'Target roles or exploration focus, timeline, and priorities',
    isCompleted: false,
    isRequired: true,
  },
  {
    id: 'review',
    index: 7,
    label: '7. Career Synthesis & Review',
    shortLabel: 'Review',
    description: 'Review declared Point A to Point B synthesis',
    isCompleted: false,
    isRequired: true,
  },
];

export const INITIAL_STUDENT_PROFILE: StudentCareerProfile = {
  careerIntent: 'uncertain',
  aboutYou: {
    currentStage: '',
    stageLabel: '',
    currentRole: '',
    yearsOfExperience: '',
    industry: '',
    graduationYear: '',
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
  projects: [],
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

export const COMMON_SKILLS_CATALOG = [
  // Core Technical & Software
  { id: 'python', name: 'Python', category: 'core' as const },
  { id: 'sql', name: 'SQL & Database Design', category: 'core' as const },
  { id: 'javascript', name: 'JavaScript / TypeScript', category: 'core' as const },
  { id: 'java', name: 'Java', category: 'core' as const },
  { id: 'cpp', name: 'C++', category: 'core' as const },
  { id: 'react', name: 'React', category: 'frontend' as const },
  { id: 'fastapi', name: 'FastAPI / REST APIs', category: 'backend' as const },
  { id: 'nodejs', name: 'Node.js', category: 'backend' as const },
  { id: 'docker', name: 'Docker & Containerization', category: 'tools' as const },
  { id: 'aws', name: 'AWS Cloud Services', category: 'tools' as const },
  { id: 'git', name: 'Git & Version Control', category: 'tools' as const },

  // Data, AI & Analytics
  { id: 'pandas', name: 'Data Analysis (Pandas/Excel)', category: 'data_ai' as const },
  { id: 'powerbi', name: 'PowerBI / Tableau Dashboards', category: 'data_ai' as const },
  { id: 'aiml', name: 'Machine Learning / GenAI', category: 'data_ai' as const },

  // Business, Product & Operations (Non-technical & Cross-industry)
  { id: 'financial_modeling', name: 'Financial Modeling & Valuation', category: 'other' as const },
  { id: 'product_strategy', name: 'Product Strategy & Roadmaps', category: 'other' as const },
  { id: 'project_mgmt', name: 'Agile & Project Management', category: 'other' as const },
  { id: 'digital_marketing', name: 'Digital Marketing & Growth', category: 'other' as const },
  { id: 'sales_crm', name: 'B2B Sales & Account Management', category: 'other' as const },
  { id: 'uiux_design', name: 'UI/UX Design & User Research', category: 'other' as const },
  { id: 'ops_logistics', name: 'Operations & Process Improvement', category: 'other' as const },
  { id: 'leadership', name: 'Team Leadership & Communication', category: 'other' as const },
];

export const DEMO_RECOMMENDATIONS: CareerPathRecommendation[] = [
  {
    id: 'transition-ai',
    title: 'Applied AI Engineer (Transition Path)',
    matchScore: 84,
    summary:
      'High synergy from your established software backend foundation. Your primary growth levers are hands-on LLM pipeline orchestration and production vector databases.',
    matchedSkills: ['Python', 'SQL & Database Design', 'FastAPI / REST APIs', 'Git & Version Control'],
    skillsToAcquire: [
      'LangChain / RAG Pipeline Architecture',
      'Vector Database Indexing (Pinecone/Chroma)',
      'PyTorch Core Neural Networks',
    ],
    demandLevel: 'Very High',
    targetRoles: ['AI Engineer', 'Machine Learning Engineer', 'AI Solutions Architect'],
    averageTimelineMonths: 4,
  },
  {
    id: 'analytics-consulting',
    title: 'Business Intelligence & Strategy Lead',
    matchScore: 78,
    summary:
      'Strong fit for problem solvers combining structured quantitative modeling with business decision communication.',
    matchedSkills: ['Data Analysis (Pandas/Excel)', 'SQL & Database Design', 'PowerBI / Tableau Dashboards'],
    skillsToAcquire: [
      'Executive Stakeholder Storytelling',
      'Financial ROI Modeling',
      'Enterprise Data Warehousing (Snowflake)',
    ],
    demandLevel: 'High',
    targetRoles: ['Business Analytics Lead', 'Strategy Associate', 'Data Product Manager'],
    averageTimelineMonths: 3,
  },
];

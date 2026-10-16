import {
  StudentCareerProfile,
  DiscoverySectionMeta,
  CareerPathRecommendation,
} from '../types/careerDiscovery';

export const INITIAL_SECTIONS: DiscoverySectionMeta[] = [
  {
    id: 'about_you',
    index: 1,
    label: '1. About You',
    shortLabel: 'Stage',
    description: 'Current career stage and target timeline',
    isCompleted: false,
    isRequired: true,
  },
  {
    id: 'education',
    index: 2,
    label: '2. Education',
    shortLabel: 'Education',
    description: 'Degree, field of study & core fundamentals',
    isCompleted: false,
    isRequired: true,
  },
  {
    id: 'skills',
    index: 3,
    label: '3. Skills & Capabilities',
    shortLabel: 'Skills',
    description: 'Self-reported tech stack and comfort levels',
    isCompleted: false,
    isRequired: true,
  },
  {
    id: 'experience',
    index: 4,
    label: '4. Experience & Projects',
    shortLabel: 'Projects',
    description: 'Hands-on practical work and code artifacts',
    isCompleted: false,
    isRequired: false, // optional with skip
  },
  {
    id: 'interests',
    index: 5,
    label: '5. Interests & Preferences',
    shortLabel: 'Interests',
    description: 'Problem spaces and work environment styles',
    isCompleted: false,
    isRequired: true,
  },
  {
    id: 'goals',
    index: 6,
    label: '6. Career Goals',
    shortLabel: 'Goals',
    description: 'Target roles and primary development priority',
    isCompleted: false,
    isRequired: true,
  },
  {
    id: 'review',
    index: 7,
    label: '7. Profile Review',
    shortLabel: 'Review',
    description: 'Review self-reported inputs before analysis',
    isCompleted: false,
    isRequired: true,
  },
];

export const INITIAL_STUDENT_PROFILE: StudentCareerProfile = {
  aboutYou: {
    currentStage: '',
    stageLabel: '',
    graduationYear: '',
  },
  education: {
    degree: '',
    field: '',
    academicFocus: [],
    graduationYear: '',
  },
  skills: [],
  projects: [],
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
  },
  goals: {
    targetRoles: [],
    topPriority: '',
    timeline: '',
  },
  status: 'in_progress',
};

export const COMMON_SKILLS_CATALOG = [
  // Core Languages
  { id: 'python', name: 'Python', category: 'core' as const },
  { id: 'java', name: 'Java', category: 'core' as const },
  { id: 'cpp', name: 'C++', category: 'core' as const },
  { id: 'typescript', name: 'TypeScript', category: 'core' as const },
  { id: 'javascript', name: 'JavaScript', category: 'core' as const },
  { id: 'sql', name: 'SQL', category: 'core' as const },
  { id: 'go', name: 'Go (Golang)', category: 'core' as const },

  // Web & Frontend
  { id: 'react', name: 'React', category: 'frontend' as const },
  { id: 'nextjs', name: 'Next.js', category: 'frontend' as const },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'frontend' as const },
  { id: 'html_css', name: 'HTML & CSS', category: 'frontend' as const },

  // Backend & Cloud
  { id: 'fastapi', name: 'FastAPI', category: 'backend' as const },
  { id: 'nodejs', name: 'Node.js / Express', category: 'backend' as const },
  { id: 'django', name: 'Django', category: 'backend' as const },
  { id: 'postgresql', name: 'PostgreSQL', category: 'backend' as const },
  { id: 'mongodb', name: 'MongoDB', category: 'backend' as const },
  { id: 'redis', name: 'Redis Caching', category: 'backend' as const },

  // Data & AI
  { id: 'pytorch', name: 'PyTorch', category: 'data_ai' as const },
  { id: 'pandas', name: 'Pandas & NumPy', category: 'data_ai' as const },
  { id: 'langchain', name: 'LangChain & RAG', category: 'data_ai' as const },
  { id: 'scikit', name: 'Scikit-Learn', category: 'data_ai' as const },
  { id: 'powerbi', name: 'PowerBI / Tableau', category: 'data_ai' as const },

  // Tools & DevOps
  { id: 'git', name: 'Git & GitHub', category: 'tools' as const },
  { id: 'docker', name: 'Docker', category: 'tools' as const },
  { id: 'linux', name: 'Linux CLI', category: 'tools' as const },
  { id: 'aws', name: 'AWS Cloud Basics', category: 'tools' as const },
  { id: 'dsa', name: 'Data Structures & Algorithms', category: 'core' as const },
  { id: 'sysdesign', name: 'System Design Basics', category: 'core' as const },
];

export const DEMO_RECOMMENDATIONS: CareerPathRecommendation[] = [
  {
    id: 'sde-fullstack',
    title: 'Full-Stack Software Engineer (SDE-1)',
    matchScore: 88,
    summary:
      'High alignment based on your self-reported programming core and web framework exposure. Recommended focus on end-to-end API design and structured problem solving.',
    matchedSkills: ['Python', 'React', 'SQL', 'Git & GitHub'],
    skillsToAcquire: [
      'Production Docker Containers',
      'PostgreSQL Query Optimization',
      'System Design Fundamentals',
    ],
    demandLevel: 'Very High',
    targetRoles: ['SDE-1', 'Full-Stack Developer', 'Frontend Engineer'],
    averageTimelineMonths: 3,
  },
  {
    id: 'ai-ml-eng',
    title: 'Applied AI & GenAI Engineer',
    matchScore: 76,
    summary:
      'Strong foundational potential. Your Python proficiency provides an excellent on-ramp into LLM application development, RAG pipelines, and data orchestration.',
    matchedSkills: ['Python', 'Pandas & NumPy', 'SQL'],
    skillsToAcquire: [
      'PyTorch Deep Learning Basics',
      'Vector Databases (Pinecone / ChromaDB)',
      'LangChain / LlamaIndex Orchestration',
    ],
    demandLevel: 'Very High',
    targetRoles: ['Associate AI Engineer', 'ML Operations Intern', 'Generative AI Developer'],
    averageTimelineMonths: 4,
  },
  {
    id: 'data-analytics',
    title: 'Data & Business Intelligence Analyst',
    matchScore: 72,
    summary:
      'A practical, direct path combining SQL data queries with exploratory business logic and dashboard storytelling.',
    matchedSkills: ['SQL', 'Python', 'Pandas & NumPy'],
    skillsToAcquire: [
      'Advanced SQL Window Functions',
      'Tableau / PowerBI Dashboard Design',
      'Statistical Hypothesis Testing',
    ],
    demandLevel: 'High',
    targetRoles: ['Data Analyst', 'Product Analyst', 'BI Associate'],
    averageTimelineMonths: 2,
  },
];

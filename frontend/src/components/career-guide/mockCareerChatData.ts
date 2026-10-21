export type MessageInputType =
  | 'stage_select'
  | 'education_select'
  | 'skills_select'
  | 'projects_entry'
  | 'interests_select'
  | 'goals_select'
  | 'summary_card';

export interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  attachedFile?: {
    name: string;
    size: string;
  };
  followupQuestions?: string[];
  inputType?: MessageInputType;
  stepIndex?: number; // 1 to 6
  stepTitle?: string;
  isCompletedStep?: boolean;
  stepData?: any;
}

export interface QuickReplyOption {
  id: string;
  label: string;
  highlighted?: boolean;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Guided Discovery Initial Message (Step 1)
export function getGuidedInitialMessage(): ChatMessage {
  return {
    id: 'guided-step-1',
    sender: 'assistant',
    text: "Welcome to Career Ladder! 👋\nI'm your AI career intelligence assistant.\n\nMy mission is to help you navigate from **Point A (where you are now)** to **Point B (where you want to go)**. Whether you already have a target destination in mind or are exploring new directions across any field, I'll help you map out your trajectory.\n\nTo begin, what best describes your current career stage?",
    timestamp: getCurrentTimeString(),
    inputType: 'stage_select',
    stepIndex: 1,
    stepTitle: 'Current Position (Point A)',
    isCompletedStep: false,
  };
}

// Standard Greeting (For freeform Q&A mode)
export function getInitialMessages(): ChatMessage[] {
  return [
    {
      id: 'msg-1',
      sender: 'assistant',
      text: "Hi there! 👋\nWelcome to Career Ladder — discover where you are, explore where you want to go, and understand how to get there.\n\nAre you looking to transition to a specific role (Career Decided), or exploring new directions (Career Exploring)?",
      timestamp: getCurrentTimeString(),
      followupQuestions: [
        'I know my target role (Career Decided)',
        'I want to explore career options (Career Exploring)',
        'Experienced professional looking to pivot',
        'How does Career Ladder map Point A to Point B?',
      ],
    },
  ];
}

export const INITIAL_MESSAGES: ChatMessage[] = getInitialMessages();

export const REFERENCE_QUICK_REPLIES: QuickReplyOption[] = [
  { id: 'decided', label: 'I know my target career', highlighted: true },
  { id: 'exploring', label: 'Exploring different options' },
  { id: 'pro', label: 'Working Professional' },
  { id: 'student', label: 'Student / Recent Graduate' },
];

export const TOTAL_GUIDED_STEPS = 6;

export function getGuidedStepMessage(stepNumber: number, profileState: any): ChatMessage {
  const time = getCurrentTimeString();

  switch (stepNumber) {
    case 2:
      return {
        id: `guided-step-2-${Date.now()}`,
        sender: 'assistant',
        text: 'Great! Next, tell me about your educational or training background. What is your field of study or highest qualification? (If you are an experienced professional or self-taught, you can share certifications or key background areas).',
        timestamp: time,
        inputType: 'education_select',
        stepIndex: 2,
        stepTitle: 'Education & Qualifications',
        isCompletedStep: false,
      };

    case 3:
      return {
        id: `guided-step-3-${Date.now()}`,
        sender: 'assistant',
        text: 'Now, let’s identify your core capabilities and strengths. What skills, tools, domain competencies, or specialized methodologies do you work with or know best? You can also specify your comfort level.',
        timestamp: time,
        inputType: 'skills_select',
        stepIndex: 3,
        stepTitle: 'Skills & Capabilities',
        isCompletedStep: false,
      };

    case 4:
      return {
        id: `guided-step-4-${Date.now()}`,
        sender: 'assistant',
        text: 'Practical exposure and accomplishments prove real-world execution. What key projects, work achievements, or practical experiences stand out in your journey so far?\n\n(If you are just getting started or focusing on fundamentals, feel free to skip this step!)',
        timestamp: time,
        inputType: 'projects_entry',
        stepIndex: 4,
        stepTitle: 'Practical Experience & Accomplishments',
        isCompletedStep: false,
      };

    case 5:
      return {
        id: `guided-step-5-${Date.now()}`,
        sender: 'assistant',
        text: 'Let’s look at your interests and work style preferences. What problem domains, industries, or working environments bring out your best performance and motivation?',
        timestamp: time,
        inputType: 'interests_select',
        stepIndex: 5,
        stepTitle: 'Interests & Work Preferences',
        isCompletedStep: false,
      };

    case 6:
      return {
        id: `guided-step-6-${Date.now()}`,
        sender: 'assistant',
        text: 'Almost done! Now let’s define Point B: What is your target career destination, or what specific directions are you exploring? What is your primary development priority right now?',
        timestamp: time,
        inputType: 'goals_select',
        stepIndex: 6,
        stepTitle: 'Career Destination & Goals (Point B)',
        isCompletedStep: false,
      };

    case 7:
    default:
      return {
        id: `guided-step-summary-${Date.now()}`,
        sender: 'assistant',
        text: 'Congratulations! 🎉 Your career profile mapping is complete. Below is your synthesized Point A to Point B overview and initial development insights:',
        timestamp: time,
        inputType: 'summary_card',
        stepIndex: 7,
        stepTitle: 'Career Synthesis & Review',
        isCompletedStep: true,
        followupQuestions: [
          'What are my primary capability gaps?',
          'What transferable skills can I leverage?',
          'How to structure my transition timeline?',
          'Explore alternative career options',
        ],
      };
  }
}

export function getMockAssistantReply(
  userMessage: string,
  fileName?: string
): { replyText: string; followupQuestions: string[]; nextReplies?: QuickReplyOption[] } {
  const normalized = userMessage.toLowerCase().trim();

  // If a file was attached (e.g. resume or project report)
  if (fileName) {
    return {
      replyText: `I have received your document "${fileName}"! 📄\n\nBased on your profile, here is how you can maximize your impact:\n• Highlight measurable outcomes in your key projects or professional achievements.\n• Showcase hands-on experience with core domain tools and frameworks.\n• Keep your capabilities organized and interview-ready.\n\nWhich area would you like to review further?`,
      followupQuestions: [
        'How to write bullet points with measurable impact',
        'Projects to add to strengthen this resume',
        'Common ATS resume mistakes to avoid',
        'Software Development Roadmap',
      ],
      nextReplies: REFERENCE_QUICK_REPLIES,
    };
  }

  // DSA / LeetCode / Coding interview queries
  if (
    normalized.includes('dsa') ||
    normalized.includes('leetcode') ||
    normalized.includes('algorithms') ||
    normalized.includes('data structures') ||
    normalized.includes('coding interview')
  ) {
    return {
      replyText:
        'Here is a proven, stress-free technical preparation roadmap:\n\n1. **Phase 1 (Arrays & Strings)**: Master Two Pointers, Sliding Window, and HashMaps (30 problems).\n2. **Phase 2 (Lists, Stacks & Queues)**: Pointer manipulation and monotonic stacks (25 problems).\n3. **Phase 3 (Trees & Graphs)**: BFS/DFS traversals and Binary Search Trees (30 problems).\n4. **Phase 4 (Dynamic Programming)**: Master standard 1D and 2D patterns (25 problems).\n\nFocus on recognizing core patterns rather than memorizing individual solutions!',
      followupQuestions: [
        'Top 10 most common interview patterns',
        'How to master Dynamic Programming',
        'System Design fundamentals',
        'High-impact projects for career transitions',
      ],
    };
  }

  // Project ideas query
  if (
    normalized.includes('project ideas') ||
    normalized.includes('project') ||
    normalized.includes('projects') ||
    normalized.includes('portfolio')
  ) {
    return {
      replyText:
        'Here are 3 high-impact project ideas recruiters notice immediately:\n\n1. **Full-Stack SaaS with Auth & Billing**: React/Next.js frontend, FastAPI backend, PostgreSQL, and Stripe checkout.\n2. **AI Document Search & Q&A**: RAG pipeline built with LangChain, ChromaDB vector store, and OpenAI/Claude API.\n3. **Distributed Task Queue & Metrics Monitor**: Celery worker cluster, Redis cache, and live WebSocket monitoring dashboard.\n\nMake sure to deploy them live and write an architecture diagram in the README!',
      followupQuestions: [
        'How to deploy projects on AWS / Docker',
        'How to write a standout GitHub README',
        'How to prepare for DSA & LeetCode?',
        'Resume tips for career transitions',
      ],
    };
  }

  if (
    normalized.includes('software development') ||
    normalized.includes('development') ||
    normalized.includes('web dev') ||
    normalized.includes('backend') ||
    normalized.includes('frontend')
  ) {
    return {
      replyText:
        'Software Development is a high-impact, high-growth path! Here is a focused roadmap:\n\n1. **Core CS & Languages**: Master Data Structures, Algorithms, and Object-Oriented design.\n2. **Web Frameworks**: Build production-ready REST APIs using FastAPI, Django, or Node.js.\n3. **Databases & Caching**: Learn PostgreSQL schema design and Redis caching.\n4. **End-to-End Projects**: Deploy 2 complete full-stack apps with Docker and CI/CD.\n\nWhich area would you like to explore next?',
      followupQuestions: [
        'High-impact project ideas for transitions',
        'FastAPI vs Django: which should I learn?',
        'How to prepare for technical interviews?',
        'What databases are asked in tech interviews?',
      ],
      nextReplies: [
        { id: 'project-ideas', label: 'Project Ideas', highlighted: true },
        { id: 'interview-prep', label: 'Interview Prep' },
        { id: 'explore-more', label: 'Explore Other Tracks' },
      ],
    };
  }

  if (
    normalized.includes('data analytics') ||
    normalized.includes('analytics') ||
    normalized.includes('data analysis')
  ) {
    return {
      replyText:
        'Data Analytics is in huge demand across industry leaders:\n\n1. **Python Data Stack**: Deep-dive into Pandas, NumPy, and Seaborn for exploratory data analysis.\n2. **SQL Mastery**: Practice window functions, CTEs, and complex joins on real business schemas.\n3. **BI & Dashboards**: Build interactive dashboards with PowerBI or Tableau.\n4. **Portfolio Projects**: Analyze open datasets from Kaggle to showcase actionable business insights.\n\nWhat would you like to dive into next?',
      followupQuestions: [
        'Top SQL queries asked in analyst interviews',
        'Best Kaggle datasets to build a portfolio',
        'PowerBI vs Tableau: which is better?',
        'How much Python is needed for Data Analytics?',
      ],
      nextReplies: [
        { id: 'sql-prep', label: 'SQL Practice', highlighted: true },
        { id: 'kaggle-datasets', label: 'Top Kaggle Projects' },
        { id: 'explore-more', label: 'Explore Other Tracks' },
      ],
    };
  }

  if (
    normalized.includes('ai') ||
    normalized.includes('ml') ||
    normalized.includes('machine learning') ||
    normalized.includes('deep learning')
  ) {
    return {
      replyText:
        'AI & Machine Learning offers massive innovation opportunities right now:\n\n1. **Foundational Math**: Linear algebra, multivariate calculus, and probability.\n2. **Machine Learning**: Supervised and unsupervised algorithms with Scikit-Learn.\n3. **Deep Learning**: PyTorch fundamentals and neural network architectures.\n4. **Generative AI & LLMs**: Build RAG (Retrieval-Augmented Generation) applications with LangChain.\n\nWhich topic would you like to explore first?',
      followupQuestions: [
        'How to build my first RAG app with LangChain',
        'What math is actually needed for ML?',
        'Fine-tuning LLMs vs Prompt Engineering',
        'Best free resources to learn PyTorch',
      ],
      nextReplies: [
        { id: 'rag-apps', label: 'Building RAG Apps', highlighted: true },
        { id: 'math-foundations', label: 'Math Foundations' },
        { id: 'explore-more', label: 'Explore Other Tracks' },
      ],
    };
  }

  if (
    normalized.includes('resume') ||
    normalized.includes('cv') ||
    normalized.includes('placement') ||
    normalized.includes('internship') ||
    normalized.includes('interview') ||
    normalized.includes('transition')
  ) {
    return {
      replyText:
        'For competitive hiring and career transitions, hiring managers look for:\n\n1. **2 High-Impact Accomplishments/Projects**: Live outcomes, clear contributions, and measurable metrics.\n2. **Demonstrated Problem Solving**: Practical execution and strong domain knowledge.\n3. **Clean Resume Format**: Single page, ATS-friendly, highlighting capabilities and achievements.\n\nWhat would you like assistance with?',
      followupQuestions: [
        'How to write bullet points with measurable impact',
        'Common ATS resume mistakes to avoid',
        'Technical interview preparation priorities',
        'How to prepare for behavioral rounds',
      ],
      nextReplies: [
        { id: 'project-ideas', label: 'Project Ideas', highlighted: true },
        { id: 'dsa-prep', label: 'Technical Prep Strategy' },
        { id: 'dev', label: 'Software Development' },
      ],
    };
  }

  // Fallback intelligent response
  return {
    replyText:
      "That's a great question! In career advancement and transitions, consistency is key. Focus on applying what you learn through hands-on accomplishments, keeping your practical portfolio current, and building strong domain fundamentals.\n\nWhich area would you like to explore next?",
    followupQuestions: [
      'Software Development Roadmap',
      'How to get started in AI / ML?',
      'High-impact projects for career transitions',
      'Resume & portfolio review tips',
    ],
    nextReplies: REFERENCE_QUICK_REPLIES,
  };
}

export type MessageInputType =
  | 'email_prompt'
  | 'intent_select'
  | 'transition_navigator'
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
  stepIndex?: number; // 0 to 6
  stepTitle?: string;
  isCompletedStep?: boolean;
  stepData?: any;
  isEdited?: boolean;
  selectedOption?: string;
  answeredMessageId?: string;
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

// Guided Discovery Initial Message (Step 0: Welcome & Optional Email for Detailed Profile)
export function getGuidedInitialMessage(): ChatMessage {
  return {
    id: 'guided-step-welcome-email',
    sender: 'assistant',
    text: "Welcome to **Career Ladder**! 👋\n\nTo get your detailed **Career Ladder** profile, please enter a valid email below (or you can skip for now):",
    timestamp: getCurrentTimeString(),
    inputType: 'email_prompt',
    stepIndex: 0,
    stepTitle: 'Welcome & Updates',
    isCompletedStep: false,
  };
}

// Standard Greeting (For Career Q&A & Goal Pathway mode)
export function getInitialMessages(): ChatMessage[] {
  return [
    {
      id: 'msg-qa-1',
      sender: 'assistant',
      text: "Hi there! 👋\nWelcome to **Career Transition & Goal Pathway Navigator**.\n\nI'm your senior transition strategist. In this mode, I help working professionals:\n• **Map career pivots from your current role to your target destination**\n• **Analyze transferable skills, capability gaps, and high-impact bridge projects**\n• **Clarify career doubts, salary benchmarks, and transition interview prep**\n\nTo save your transition roadmap, please enter a valid email below (or you can skip for now):",
      timestamp: getCurrentTimeString(),
      inputType: 'email_prompt',
      stepIndex: 0,
      stepTitle: 'Welcome & Updates',
      isCompletedStep: false,
    },
  ];
}

export const INITIAL_MESSAGES: ChatMessage[] = getInitialMessages();

export const REFERENCE_QUICK_REPLIES: QuickReplyOption[] = [
  { id: 'transition', label: '🚀 Plan my career transition pathway', highlighted: true },
  { id: 'transferable', label: 'What skills transfer from my current job?' },
  { id: 'resume', label: 'How to position my resume for a career switch' },
  { id: 'interviews', label: 'Interview traps for career switchers' },
];

export const TOTAL_GUIDED_STEPS = 6;

export function getGuidedStepMessage(
  stepNumber: number,
  profileState: any,
  careerIntent?: 'career_decided' | 'career_exploring' | 'uncertain'
): ChatMessage {
  const time = getCurrentTimeString();
  const intent = careerIntent || profileState?.careerIntent || 'career_decided';

  switch (stepNumber) {
    case 1:
      return {
        id: `guided-step-1-${Date.now()}`,
        sender: 'assistant',
        text: "Before we map your profile, choose how you would like to proceed with your career planning:",
        timestamp: time,
        inputType: 'intent_select',
        stepIndex: 1,
        stepTitle: 'Journey Track',
        isCompletedStep: false,
      };

    case 2:
      if (intent === 'career_decided') {
        return {
          id: `guided-step-2-goals-${Date.now()}`,
          sender: 'assistant',
          text: "Awesome! Since you already have a target role or destination in mind, let's establish that first.\n\nWhat is your goal role (or top roles you are aiming for), and what is your primary development priority right now?",
          timestamp: time,
          inputType: 'goals_select',
          stepIndex: 2,
          stepTitle: 'Target Destination & Goals (Point B)',
          isCompletedStep: false,
        };
      } else {
        return {
          id: `guided-step-2-interests-${Date.now()}`,
          sender: 'assistant',
          text: "Fantastic! Since you are exploring careers based on what excites you, let's start with your interests.\n\nWhat problem domains, industries, or working environments bring out your best performance and curiosity?",
          timestamp: time,
          inputType: 'interests_select',
          stepIndex: 2,
          stepTitle: 'Interests & Work Preferences',
          isCompletedStep: false,
        };
      }

    case 3:
      return {
        id: `guided-step-3-${Date.now()}`,
        sender: 'assistant',
        text: "Now let's map your baseline: where are you currently in your journey? Select your current career stage and target timeline:",
        timestamp: time,
        inputType: 'stage_select',
        stepIndex: 3,
        stepTitle: 'Current Position (Point A)',
        isCompletedStep: false,
      };

    case 4:
      return {
        id: `guided-step-4-${Date.now()}`,
        sender: 'assistant',
        text: "Great! Next, tell me about your educational or training background. What is your field of study or highest qualification? (Certifications, self-taught focus areas, or bootcamps are welcome too).",
        timestamp: time,
        inputType: 'education_select',
        stepIndex: 4,
        stepTitle: 'Education & Qualifications',
        isCompletedStep: false,
      };

    case 5:
      return {
        id: `guided-step-5-${Date.now()}`,
        sender: 'assistant',
        text: "Now let's identify your core capabilities and strengths. What skills, tools, domain competencies, or specialized methodologies do you work with or know best? You can also specify your comfort level.",
        timestamp: time,
        inputType: 'skills_select',
        stepIndex: 5,
        stepTitle: 'Skills & Capabilities',
        isCompletedStep: false,
      };

    case 6:
      return {
        id: `guided-step-6-${Date.now()}`,
        sender: 'assistant',
        text: "Practical exposure and accomplishments prove real-world execution. What key projects, work achievements, or practical experiences stand out in your journey so far?\n\n(If you are just getting started or focusing on fundamentals, feel free to skip this step!)",
        timestamp: time,
        inputType: 'projects_entry',
        stepIndex: 6,
        stepTitle: 'Practical Experience & Accomplishments',
        isCompletedStep: false,
      };

    case 7:
    default:
      if (intent === 'career_decided') {
        return {
          id: `guided-step-summary-${Date.now()}`,
          sender: 'assistant',
          text: "Congratulations! 🎉 Your career profile mapping is complete. Below is your synthesized Point A to Point B overview, capability gap analysis, and tailored roadmap toward your target role:",
          timestamp: time,
          inputType: 'summary_card',
          stepIndex: 7,
          stepTitle: 'Career Synthesis & Review',
          isCompletedStep: true,
          followupQuestions: [
            'What are my primary capability gaps?',
            'Build my step-by-step learning roadmap',
            'High-impact projects for this role',
            'Interview & preparation tips',
          ],
        };
      } else {
        return {
          id: `guided-step-summary-${Date.now()}`,
          sender: 'assistant',
          text: "Congratulations! 🎉 Your career profile mapping is complete. Below is your synthesized profile, curated role discovery matches based on your interests, and recommended next steps:",
          timestamp: time,
          inputType: 'summary_card',
          stepIndex: 7,
          stepTitle: 'Career Synthesis & Review',
          isCompletedStep: true,
          followupQuestions: [
            'Compare top recommended career paths',
            'What transferable skills can I leverage?',
            'How to structure my learning timeline?',
            'Explore high-demand emerging roles',
          ],
        };
      }
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

  // Career Transition Flow response
  if (normalized.includes('career transition') || normalized.includes('moving from') || normalized.includes('pivot')) {
    return {
      replyText:
        `### 🚀 Career Transition Blueprint\n\nHere is your strategic transition blueprint designed for working professionals:\n\n#### 1. 🔄 Transferable Strengths Matrix\n* **Domain Intuition:** Your background provides real-world familiarity with development workflows, edge-case analysis, and systems quality that fresh graduates lack.\n* **Process & Tooling:** Exposure to Git, Jira, CI/CD, and cross-functional teams translates directly into your new role.\n\n#### 2. 🎯 High-Leverage Capability Gaps\n* **Core Engineering Depth:** Master hands-on API design, data structures, and production architecture.\n* **Modern Stacks:** Focus on Python/TypeScript, FastAPI/React, and Cloud deployment.\n*(Skip deep theoretical trivia—focus on practical execution)*.\n\n#### 3. 🛠️ The "Bridge Project" (Proof of Capability)\n* **Project Concept:** Build an intelligent domain tool (e.g. an automated test-generation agent or system monitor) that bridges your past domain with your target role.\n* **Why It Works:** It proves you understand the target role while turning your past experience into an unfair advantage.\n\n#### 4. 📅 Phased Part-Time Transition Roadmap (5–10 hrs/week)\n* **Month 1:** Core Fundamentals, syntax fluency & system architecture.\n* **Month 2:** Applied frameworks, databases, and microservices.\n* **Month 3:** Build, containerize, and deploy the Bridge Project with live demo & GitHub README.\n* **Month 4:** Resume repositioning, LinkedIn optimization & technical mock interviews.`,
      followupQuestions: [
        '📄 How to tailor my resume for this career transition',
        '💼 Expected compensation & salary impact during transition',
        '⚠️ Top interview traps for career switchers',
        '🛠️ Step-by-step guidance for the Bridge Project',
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

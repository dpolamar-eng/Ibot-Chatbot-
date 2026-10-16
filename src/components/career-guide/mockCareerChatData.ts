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

// Dynamic initial greeting with real-time current clock timestamp
export function getInitialMessages(): ChatMessage[] {
  return [
    {
      id: 'msg-1',
      sender: 'assistant',
      text: "Hi there! 👋\nI'm IBOT, your AI career guide.\nHow can I help you today?",
      timestamp: getCurrentTimeString(),
      followupQuestions: [
        'Software Development Roadmap',
        'How to get started in AI / ML?',
        'Data Analytics Career Track',
        'Resume tips for college placements',
      ],
    },
  ];
}

// Initial state contains the bot greeting with dynamic current time
export const INITIAL_MESSAGES: ChatMessage[] = getInitialMessages();

// The four pill options from the reference design
export const REFERENCE_QUICK_REPLIES: QuickReplyOption[] = [
  { id: 'dev', label: 'Software Development', highlighted: true },
  { id: 'data', label: 'Data Analytics' },
  { id: 'aiml', label: 'AI / ML' },
  { id: 'unsure', label: 'Not sure yet' },
];

export function getMockAssistantReply(
  userMessage: string,
  fileName?: string
): { replyText: string; followupQuestions: string[]; nextReplies?: QuickReplyOption[] } {
  const normalized = userMessage.toLowerCase().trim();

  // If a file was attached (e.g. resume or project report)
  if (fileName) {
    return {
      replyText: `I have received your document "${fileName}"! 📄\n\nBased on your profile, here is how you can maximize your impact:\n• Highlight measurable outcomes in your key projects.\n• Showcase hands-on experience with Python and production frameworks.\n• Keep your technical skills organized and placement-ready.\n\nWhich area would you like to review further?`,
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
        'Here is a proven, stress-free DSA roadmap for tech placements:\n\n1. **Phase 1 (Arrays & Strings)**: Master Two Pointers, Sliding Window, and HashMaps (30 problems).\n2. **Phase 2 (Lists, Stacks & Queues)**: Pointer manipulation and monotonic stacks (25 problems).\n3. **Phase 3 (Trees & Graphs)**: BFS/DFS traversals and Binary Search Trees (30 problems).\n4. **Phase 4 (Dynamic Programming)**: Master standard 1D and 2D patterns (25 problems).\n\nFocus on recognizing core patterns rather than memorizing individual solutions!',
      followupQuestions: [
        'Top 10 most common interview patterns',
        'How to master Dynamic Programming',
        'System Design basics for freshers',
        'Top full-stack project ideas for placements',
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
        'Resume tips for college placements',
      ],
    };
  }

  // Reference scenario response matching the exact screenshot dialog
  if (
    normalized.includes('3rd year') ||
    normalized.includes('b.tech') ||
    normalized.includes('know basic python') ||
    normalized.includes('what should i do next') ||
    normalized.includes('python')
  ) {
    return {
      replyText:
        'Great! With your current skills, you have several exciting paths. You can focus on building projects, strengthening your core concepts, and choose a track that matches your interests and career goals.\n\nWhich area interests you the most?',
      followupQuestions: [
        'Software Development Roadmap',
        'Data Analytics Career Track',
        'How to get started in AI / ML?',
        'Top full-stack project ideas for placements',
      ],
      nextReplies: REFERENCE_QUICK_REPLIES,
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
        'Software Development is a high-impact, high-growth path with Python! Here is a focused roadmap for your 3rd year:\n\n1. **Core CS & Python**: Master Data Structures, Algorithms, and Object-Oriented design.\n2. **Web Framework**: Build production-ready REST APIs using FastAPI or Django.\n3. **Databases & Caching**: Learn PostgreSQL schema design and Redis caching.\n4. **End-to-End Projects**: Deploy 2 complete full-stack apps with Docker and CI/CD.\n\nWhich area would you like to explore next?',
      followupQuestions: [
        'Top full-stack project ideas for placements',
        'FastAPI vs Django: which should I learn?',
        'How to prepare for DSA & LeetCode?',
        'What databases are asked in tech interviews?',
      ],
      nextReplies: [
        { id: 'project-ideas', label: 'Project Ideas', highlighted: true },
        { id: 'interview-prep', label: 'Placement Prep' },
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
    normalized.includes('not sure') ||
    normalized.includes('unsure') ||
    normalized.includes('confused') ||
    normalized.includes('explore other')
  ) {
    return {
      replyText:
        "That's completely normal! Let's explore your natural inclinations:\n\n• Do you enjoy seeing immediate visual results? 👉 **Full-Stack Development**\n• Do you love finding patterns in numbers and telling stories? 👉 **Data Analytics**\n• Do you like algorithms, automation, and intelligent systems? 👉 **AI / ML**\n\nA great approach is spending 1 week building a mini-project in two different tracks to see what clicks for you!",
      followupQuestions: [
        'Take a quick career inclination quiz',
        'Compare tech salaries & market demand',
        'Software Engineering vs Data Analytics',
        'Day in the life of a Junior Developer',
      ],
      nextReplies: REFERENCE_QUICK_REPLIES,
    };
  }

  if (
    normalized.includes('resume') ||
    normalized.includes('cv') ||
    normalized.includes('placement') ||
    normalized.includes('internship') ||
    normalized.includes('interview')
  ) {
    return {
      replyText:
        'For college placements and internships, hiring managers look for:\n\n1. **2 High-Impact Projects**: Live deployment, clean GitHub README, and measurable metrics.\n2. **Strong Problem Solving**: Consistent practice on LeetCode/CodeChef (100+ medium problems).\n3. **Clean Resume Format**: Single page, ATS-friendly, highlighting tech stack and achievements.\n\nWhat would you like assistance with?',
      followupQuestions: [
        'How to write bullet points with measurable impact',
        'Common ATS resume mistakes to avoid',
        'Top DSA topics asked in college placements',
        'How to prepare for HR & behavioral rounds',
      ],
      nextReplies: [
        { id: 'project-ideas', label: 'Project Ideas', highlighted: true },
        { id: 'dsa-prep', label: 'DSA Prep Strategy' },
        { id: 'dev', label: 'Software Development' },
      ],
    };
  }

  // Fallback intelligent response with relevant follow-ups
  return {
    replyText:
      "That's a great question! In building your tech career, consistency is key. Focus on applying what you learn by shipping 2-3 end-to-end projects, keeping your GitHub active, and building strong problem-solving fundamentals.\n\nWhich area would you like to explore next?",
    followupQuestions: [
      'Software Development Roadmap',
      'How to get started in AI / ML?',
      'Top full-stack project ideas for placements',
      'Resume tips for college placements',
    ],
    nextReplies: REFERENCE_QUICK_REPLIES,
  };
}

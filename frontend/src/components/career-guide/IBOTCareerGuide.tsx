import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { QuickReplies } from './QuickReplies';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import {
  getGuidedInitialMessage,
  getGuidedStepMessage,
  getInitialMessages,
  getCurrentTimeString,
  getMockAssistantReply,
  TOTAL_GUIDED_STEPS,
  type ChatMessage,
  type QuickReplyOption,
} from './mockCareerChatData';
import avatarImg from '../../assets/ibot-avatar-generated.png';
import { sendChatMessage, confirmStudentProfileApi, resetSessionApi } from '../../lib/api';
import { INITIAL_STUDENT_PROFILE } from '../../mock/careerDiscoveryDefaults';
import { StudentCareerProfile, SectionAnalysis } from '../../types/careerDiscovery';
import type { CareerIntentType } from './inputs/IntentSelector';

export interface IBOTCareerGuideProps {
  className?: string;
  mode?: 'panel' | 'drawer' | 'floating';
  isOpen?: boolean;
  isFloating?: boolean; // legacy alias for mode="floating"
  subtitle?: string;
  initialMode?: 'guided' | 'qa';
  skipIntroAnimation?: boolean;
  externalPrompt?: string;
  onExternalPromptConsumed?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onRefresh?: () => void;
  onComplete?: (profileData: any) => void;
}

const getStepTitle = (
  stepIdx: number,
  intent: CareerIntentType = 'career_decided',
  isGuided: boolean = true
): string => {
  if (!isGuided) {
    if (stepIdx === 0) return 'Welcome & Updates';
    return 'Career Transition & Goal Pathway';
  }
  switch (stepIdx) {
    case 0:
      return 'Welcome & Updates';
    case 1:
      return 'Journey Track';
    case 2:
      return intent === 'career_exploring'
        ? 'Interests & Work Preferences'
        : 'Target Destination & Goals (Point B)';
    case 3:
      return 'Current Position (Point A)';
    case 4:
      return 'Education & Qualifications';
    case 5:
      return 'Skills & Capabilities';
    case 6:
      return 'Practical Experience & Accomplishments';
    case 7:
    default:
      return 'Career Synthesis & Review';
  }
};

export const IBOTCareerGuide: React.FC<IBOTCareerGuideProps> = ({
  className,
  mode = 'panel',
  isOpen = true,
  isFloating = false,
  subtitle = 'Discover where you are, explore where you want to go, and understand how to get there.',
  initialMode = 'guided',
  skipIntroAnimation = false,
  externalPrompt,
  onExternalPromptConsumed,
  onClose,
  onMinimize,
  onRefresh,
  onComplete,
}) => {
  const effectiveMode: 'panel' | 'drawer' | 'floating' = isFloating ? 'floating' : mode;

  // Mode switcher: Guided Discovery (structured 6-step intake) vs Freeform Q&A vs Capability Validation
  const [chatMode, setChatMode] = useState<'discovery' | 'qa' | 'validation'>(
    initialMode === 'guided' ? 'discovery' : 'qa'
  );
  const isGuidedMode = chatMode === 'discovery';
  const setIsGuidedMode = (guided: boolean) => setChatMode(guided ? 'discovery' : 'qa');

  // Guided flow state (starts at 0 for welcome/email prompt)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [careerIntent, setCareerIntent] = useState<CareerIntentType>('career_decided');
  const [profileData, setProfileData] = useState<Record<string, any>>({});

  // Dynamic Profiling Session State (Phase 2)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<StudentCareerProfile>(INITIAL_STUDENT_PROFILE);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [activeQuestionCategory, setActiveQuestionCategory] = useState<string>('about_you');
  const [sectionAnalyses, setSectionAnalyses] = useState<Record<string, SectionAnalysis>>({});

  // Messages in active session
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMode === 'guided' ? [getGuidedInitialMessage()] : getInitialMessages()
  );

  const [quickReplies, setQuickReplies] = useState<QuickReplyOption[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState<boolean>(skipIntroAnimation);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isInternalMinimized, setIsInternalMinimized] = useState<boolean>(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Once chat has started (user has sent a message or moved past step 0), disable toggling between Discovery and Q&A
  const hasChatStarted = messages.some((m) => m.sender === 'user') || currentStepIndex > 0;

  // Check if there are active response boxes / input forms on top
  const hasActiveResponseBoxes =
    (isGuidedMode && currentStepIndex <= TOTAL_GUIDED_STEPS) ||
    messages.some((m) => m.sender === 'assistant' && !!m.inputType && !m.isCompletedStep);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  // Close on Escape in drawer mode
  useEffect(() => {
    if (effectiveMode === 'drawer') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose?.();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [effectiveMode, onClose]);

  // Intro waving animation (synchronized to 1800ms with header word reveal)
  useEffect(() => {
    if (!hasPlayedIntro) {
      const timer = setTimeout(() => {
        setHasPlayedIntro(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [hasPlayedIntro]);

  const isInitialMount = useRef<boolean>(true);
  const prevMessagesLength = useRef<number>(messages.length);
  const prevLastMessageId = useRef<string | undefined>(messages[messages.length - 1]?.id);

  // Ensure on initial mount/reload that the window and container always start at the very top
  useEffect(() => {
    window.scrollTo(0, 0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior,
        });
      }
    });
  };

  // Scroll to a specific message's top so the response starts cleanly from the top
  const scrollToMessageTop = (messageId?: string, behavior: ScrollBehavior = 'smooth') => {
    const performScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      let element: HTMLElement | null = null;
      if (messageId) {
        element = container.querySelector(`[data-message-id="${messageId}"]`);
      }

      if (!element) {
        const allMsgElements = container.querySelectorAll('[data-message-id]');
        if (allMsgElements.length > 0) {
          element = allMsgElements[allMsgElements.length - 1] as HTMLElement;
        }
      }

      if (element) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const currentScrollTop = container.scrollTop;
        const offsetFromContainerTop = elementRect.top - containerRect.top;
        // Position message cleanly at the top of the container with an 8px margin
        const targetScrollTop = currentScrollTop + offsetFromContainerTop - 8;

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior,
        });
      }
    };

    // Immediate frame + short stabilization frame to ensure nested subcomponents (e.g. selectors) are laid out
    requestAnimationFrame(performScroll);
    setTimeout(performScroll, 50);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
      prevMessagesLength.current = messages.length;
      prevLastMessageId.current = messages[messages.length - 1]?.id;
      return;
    }

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    const hasNewMessage =
      messages.length !== prevMessagesLength.current ||
      lastMsg.id !== prevLastMessageId.current;

    prevMessagesLength.current = messages.length;
    prevLastMessageId.current = lastMsg.id;

    if (hasNewMessage) {
      if (lastMsg.sender === 'assistant') {
        // When assistant gives an answer, ALWAYS start the message from the top
        scrollToMessageTop(lastMsg.id, 'smooth');
      } else {
        // When user sends a message, gently scroll to reveal it
        scrollToBottom('smooth');
      }
    }
  }, [messages]);

  // Confirm student profile (Phase 2 review card action)
  const handleConfirmProfile = async () => {
    if (!sessionId) return;
    try {
      await confirmStudentProfileApi(sessionId);
      setProfile((prev) => ({ ...prev, status: 'confirmed' }));
      const targetRole = profile?.goals?.targetRoles?.[0] || 'Python Backend Developer';
      const confirmMsg: ChatMessage = {
        id: `confirm-${Date.now()}`,
        sender: 'assistant',
        text: `🎉 **Career Profile Verified & Confirmed! (Outcome: Profile Complete)**\n\nYour self-reported Point A to Point B profile is securely saved in your session.\n\n🎯 **What would you like to do next?**\n1. **Capability Validation:** Test your knowledge, reasoning, and practical deliverables against the 14 approved dimensions for **${targetRole}**.\n2. **Goal Role Pathway:** Create your step-by-step roadmap from Point A to Point B.\n3. **Career Q&A:** Clarify any industry doubts, tools, or transition questions.`,
        timestamp: getCurrentTimeString(),
        followupQuestions: [
          `🛡️ Validate My Capabilities for ${targetRole}`,
          `🚀 Generate My Step-by-Step Pathway to ${targetRole}`,
          `What are my biggest capability gaps for ${targetRole}?`,
        ],
      };
      setMessages((prev) => [...prev, confirmMsg]);
      setQuickReplies([
        { id: 'val-dest', label: `🛡️ Validate My Capabilities for ${targetRole}`, highlighted: true },
        { id: 'pathway-dest', label: `🚀 Generate My Step-by-Step Pathway to ${targetRole}` },
        { id: 'gaps', label: `What are my biggest capability gaps for ${targetRole}?` },
      ]);
      onComplete?.(profile);
    } catch (err) {
      console.error('Failed to confirm profile:', err);
    }
  };

  // Restart / Reset active session
  const handleRefresh = () => {
    setHasPlayedIntro(false);
    setIsScrolled(false);
    setIsTyping(false);
    setQuickReplies([]);
    setCurrentStepIndex(0);
    setCareerIntent('career_decided');
    prevMessagesLength.current = 1;
    prevLastMessageId.current = undefined;
    setProfile(INITIAL_STUDENT_PROFILE);
    setProfileData({});
    setCompletionPercentage(0);
    setMissingFields([]);
    setActiveQuestionCategory('about_you');
    setEditingMessageId(null);

    if (sessionId) {
      resetSessionApi(sessionId).catch(console.warn);
    }

    if (isGuidedMode) {
      setMessages([getGuidedInitialMessage()]);
    } else {
      setMessages(getInitialMessages());
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    onRefresh?.();
  };

  // Switch between Guided Discovery and Q&A modes
  const handleToggleGuidedMode = (guided: boolean) => {
    if (guided === isGuidedMode) return;
    if (hasChatStarted) return; // Prevent switching once chat has started in either section
    setIsGuidedMode(guided);
    setIsTyping(false);
    setQuickReplies([]);

    if (guided) {
      // Switch to guided discovery
      setCurrentStepIndex(0);
      setMessages([getGuidedInitialMessage()]);
    } else {
      // Switch to Q&A mode
      setMessages(getInitialMessages());
    }
  };

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else if (onClose) {
      onClose();
    } else {
      setIsInternalMinimized(true);
    }
  };

  // Handle student clicking Continue / Confirm on an interactive question
  const handleSubmitInteractiveAnswer = async (
    stepIndex: number,
    formattedAnswerText: string,
    stepData: any
  ) => {
    // 1. Mark the assistant message for this step as answered
    setMessages((prev) =>
      prev.map((msg) =>
        msg.stepIndex === stepIndex ? { ...msg, isCompletedStep: true, stepData } : msg
      )
    );

    // 2. Add user's concise summary bubble
    const userMsg: ChatMessage = {
      id: `user-step-${stepIndex}-${Date.now()}`,
      sender: 'user',
      text: formattedAnswerText,
      timestamp: getCurrentTimeString(),
      status: 'read',
      stepIndex,
      stepData,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // If answering the initial welcome email prompt in Career Q&A mode:
    if (!isGuidedMode && stepIndex === 0) {
      setIsTyping(false);
      const emailAck = stepData?.email
        ? `Thank you! 📬 We've saved your email (**${stepData.email}**) to send your tailored transition blueprint.\n\n`
        : `No problem at all! 👍\n\n`;

      const transitionMsg: ChatMessage = {
        id: `asst-transition-${Date.now()}`,
        sender: 'assistant',
        text: `${emailAck}**Ready to transition from your existing career?** 🚀\n\nTell us your current role, experience, target destination, and weekly study bandwidth. We'll generate an executive **4-Pillar Career Transition Blueprint** highlighting your transferable strengths, bridge projects, and realistic part-time roadmap.`,
        timestamp: getCurrentTimeString(),
        inputType: 'transition_navigator',
        stepIndex: 1,
        stepTitle: 'Career Transition Navigator',
      };
      setCurrentStepIndex(1);
      setMessages((prev) => [...prev, transitionMsg]);
      setQuickReplies([]);
      return;
    }

    // If user chose open-ended Q&A instead of transition card:
    if (!isGuidedMode && stepData?.openEndedQa) {
      setIsTyping(false);
      const openQaMsg: ChatMessage = {
        id: `asst-open-qa-${Date.now()}`,
        sender: 'assistant',
        text: `Sure thing! Feel free to ask any career transition, technical doubt, interview, or salary question below. Or click one of the common topics to begin:`,
        timestamp: getCurrentTimeString(),
        followupQuestions: [
          'How do I transition from QA to Full Stack Developer?',
          'Which AI skills are most in demand in 2026?',
          'How do I explain a career switch in interviews?',
          'What projects can prove my capability without prior job experience?',
        ],
      };
      setMessages((prev) => [...prev, openQaMsg]);
      setQuickReplies([
        { id: 'qa-1', label: 'How do I transition from QA to Full Stack Developer?', highlighted: true },
        { id: 'qa-2', label: 'Which AI skills are most in demand in 2026?' },
        { id: 'qa-3', label: 'How do I explain a career switch in interviews?' },
        { id: 'qa-4', label: 'What projects prove my capability without job experience?' },
      ]);
      return;
    }

    // 3. Format structured payload for backend profile merge
    let structuredAnswer: any = null;
    const activeIntent: CareerIntentType =
      stepIndex === 1 && stepData?.careerIntent ? stepData.careerIntent : careerIntent;

    if (stepIndex === 1 && stepData?.careerIntent) {
      setCareerIntent(stepData.careerIntent);
    }

    if (!isGuidedMode) {
      structuredAnswer = {
        careerTransition: {
          currentRole: stepData?.currentRole,
          experienceYears: stepData?.experienceYears,
          targetRole: stepData?.targetRole,
          bandwidthWeekly: stepData?.bandwidthWeekly,
        },
        goals: {
          targetRoles: stepData?.targetRole ? [stepData.targetRole] : [],
        },
      };
    } else if (stepIndex === 0) {
      if (stepData?.email) {
        structuredAnswer = {
          aboutYou: { email: stepData.email },
        };
      }
    } else if (stepIndex === 1) {
      structuredAnswer = {
        careerIntent: activeIntent,
      };
    } else if (stepIndex === 2) {
      if (activeIntent === 'career_decided') {
        structuredAnswer = { goals: stepData.goals || stepData };
      } else {
        structuredAnswer = { interests: stepData.interests || stepData };
      }
    } else if (stepIndex === 3) {
      structuredAnswer = {
        aboutYou: {
          currentStage: stepData.stageId || stepData.currentStage,
          stageLabel: stepData.stageLabel,
        },
        education: {
          graduationYear: stepData.gradYear || stepData.graduationYear,
        },
      };
    } else if (stepIndex === 4) {
      structuredAnswer = { education: stepData.education || stepData };
    } else if (stepIndex === 5) {
      structuredAnswer = { skills: stepData.skills || stepData };
    } else if (stepIndex === 6) {
      if (stepData.skipped) {
        structuredAnswer = { practicalExperience: { skipped: true, projects: [] } };
      } else {
        structuredAnswer = { practicalExperience: { projects: stepData.projects || [] } };
      }
    }

    try {
      const boundedHistory = messages
        .filter((m) => m.text && m.text.trim().length > 0 && m.inputType !== 'summary_card')
        .slice(-10)
        .map((m) => ({
          role: (m.sender === 'assistant' ? 'model' : 'user') as 'model' | 'user',
          text: m.text,
        }));

      const res = await sendChatMessage(
        formattedAnswerText,
        boundedHistory,
        sessionId,
        structuredAnswer,
        isGuidedMode ? 'discovery' : 'qa'
      );

      setSessionId(res.sessionId);
      if (res.profile) setProfile(res.profile);
      if (res.completionPercentage !== undefined) setCompletionPercentage(res.completionPercentage);
      if (res.missingFields) setMissingFields(res.missingFields);
      if (res.activeQuestionCategory) setActiveQuestionCategory(res.activeQuestionCategory);
      if (res.sectionAnalyses) setSectionAnalyses(res.sectionAnalyses);

      // In Q&A mode: render the 4-pillar transition blueprint directly!
      if (!isGuidedMode) {
        const transitionBlueprintMsg: ChatMessage = {
          id: `asst-blueprint-${Date.now()}`,
          sender: 'assistant',
          text: res.reply,
          timestamp: getCurrentTimeString(),
          followupQuestions:
            res.followupQuestions && res.followupQuestions.length > 0
              ? res.followupQuestions
              : [
                  'How do I re-position my resume for this pivot?',
                  'What are the most common interview traps for career switchers?',
                  'Can you elaborate on the Bridge Project specifications?',
                  'What salary expectation should I set during the transition?',
                ],
        };
        setMessages((prev) => [...prev, transitionBlueprintMsg]);
        if (transitionBlueprintMsg.followupQuestions) {
          setQuickReplies(
            transitionBlueprintMsg.followupQuestions.map((q, i) => ({
              id: `qr-trans-${i}`,
              label: q,
              highlighted: i === 0,
            }))
          );
        }
        return;
      }

      const nextStep = stepIndex + 1;
      setCurrentStepIndex(nextStep);

      // If finished all sections or ready for review, render the Review Card
      if (res.completionPercentage === 100 || res.activeQuestionCategory === 'review' || nextStep >= 7) {
        const isDecided = activeIntent === 'career_decided';
        const defaultSynthesis = isDecided
          ? 'Congratulations! 🎉 Your career profile mapping is complete. Below is your synthesized Point A to Point B overview, capability gap analysis, and tailored roadmap toward your target role:'
          : 'Congratulations! 🎉 Your career profile mapping is complete. Below is your synthesized profile, curated role discovery matches based on your interests, and recommended next steps:';
        const reviewMsg: ChatMessage = {
          id: `summary-review-${Date.now()}`,
          sender: 'assistant',
          text: `${res.reply || defaultSynthesis}\n\nHere is your **Self-Reported Career Profile Summary**. Please review the details below. You can confirm it or make any corrections:`,
          timestamp: getCurrentTimeString(),
          inputType: 'summary_card',
          stepData: res.profile,
          followupQuestions: isDecided
            ? ['Confirm Profile', 'What are my primary capability gaps?', 'Build my step-by-step learning roadmap', 'High-impact projects for this role']
            : ['Confirm Profile', 'Compare top recommended career paths', 'What transferable skills can I leverage?', 'How to structure my learning timeline?'],
        };
        setMessages((prev) => [...prev, reviewMsg]);
        onComplete?.(res.profile);
      } else {
        const nextAssistantMsg = getGuidedStepMessage(nextStep, res.profile, activeIntent);
        if (stepIndex === 0) {
          const emailAck = stepData?.email
            ? `Thank you! 📬 We've saved your email (**${stepData.email}**) to send you your detailed career ladder profile.\n\n`
            : `No problem at all! 👍\n\n`;
          nextAssistantMsg.text = `${emailAck}${nextAssistantMsg.text}`;
        } else if (res.reply) {
          nextAssistantMsg.text = `${res.reply}\n\n${nextAssistantMsg.text}`;
        }
        setMessages((prev) => [...prev, nextAssistantMsg]);
      }

      if (isGuidedMode && nextStep <= TOTAL_GUIDED_STEPS) {
        setQuickReplies([]);
      } else if (res.followupQuestions && res.followupQuestions.length > 0) {
        setQuickReplies(res.followupQuestions.map((q, i) => ({ id: `qr-${i}`, label: q })));
      } else {
        setQuickReplies([]);
      }
    } catch (err) {
      console.warn('Backend call failed, continuing with fallback:', err);
      if (!isGuidedMode) {
        const fallback = getMockAssistantReply(formattedAnswerText);
        const fallbackMsg: ChatMessage = {
          id: `asst-fallback-${Date.now()}`,
          sender: 'assistant',
          text: fallback.replyText,
          timestamp: getCurrentTimeString(),
          followupQuestions: fallback.followupQuestions || [
            'How do I re-position my resume for this pivot?',
            'What are the most common interview traps for career switchers?',
            'Can you elaborate on the Bridge Project specifications?',
            'What salary expectation should I set during the transition?',
          ],
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        setQuickReplies(
          fallback.nextReplies || [
            { id: 'fallback-1', label: 'How do I re-position my resume for this pivot?', highlighted: true },
            { id: 'fallback-2', label: 'What are the most common interview traps for career switchers?' },
            { id: 'fallback-3', label: 'Can you elaborate on the Bridge Project specifications?' },
            { id: 'fallback-4', label: 'What salary expectation should I set during the transition?' },
          ]
        );
        return;
      }
      const nextStep = stepIndex + 1;
      const nextProfile = { ...profileData, [`step_${stepIndex}`]: stepData, careerIntent: activeIntent };
      setProfileData(nextProfile);
      setCurrentStepIndex(nextStep);
      setQuickReplies([]);
      const nextAssistantMsg = getGuidedStepMessage(nextStep, nextProfile, activeIntent);
      if (stepIndex === 0) {
        const emailAck = stepData?.email
          ? `Thank you! 📬 We've saved your email (**${stepData.email}**) to send you your detailed career ladder profile.\n\n`
          : `No problem at all! 👍\n\n`;
        nextAssistantMsg.text = `${emailAck}${nextAssistantMsg.text}`;
      }
      setMessages((prev) => [...prev, nextAssistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle "Previous" backtracking
  const handlePreviousStep = () => {
    if (currentStepIndex <= 1) return;

    const targetStep = currentStepIndex - 1;
    setQuickReplies([]);

    setMessages((prev) => {
      const filtered = prev.filter((m) => {
        if (m.stepIndex === currentStepIndex && m.sender === 'assistant') return false;
        if (m.id.startsWith(`user-step-${targetStep}`)) return false;
        return true;
      });

      return filtered.map((m) =>
        m.stepIndex === targetStep ? { ...m, isCompletedStep: false } : m
      );
    });

    setCurrentStepIndex(targetStep);
    const targetMsg = messages.find((m) => m.stepIndex === targetStep && m.sender === 'assistant');
    if (targetMsg) {
      scrollToMessageTop(targetMsg.id, 'smooth');
    }
  };

  // Re-open an earlier answered step
  const handleReopenStep = (stepIndex: number) => {
    setQuickReplies([]);
    setMessages((prev) =>
      prev.map((m) => (m.stepIndex === stepIndex ? { ...m, isCompletedStep: false } : m))
    );
    setCurrentStepIndex(stepIndex);
    const targetMsg = messages.find((m) => m.stepIndex === stepIndex && m.sender === 'assistant');
    if (targetMsg) {
      scrollToMessageTop(targetMsg.id, 'smooth');
    }
  };

  // Handle selection of a suggested follow-up option from an assistant message
  const handleSelectFollowup = (question: string, assistantMessageId?: string) => {
    if (assistantMessageId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, selectedOption: question, isCompletedStep: true }
            : m
        )
      );
    }
    handleSendMessage(question);
  };

  // Edit an existing user response
  const handleEditUserMessage = async (messageId: string, newText: string, stepIndex?: number) => {
    setEditingMessageId(null);

    // 1. Update the message text and mark as edited, and update parent option tracking
    setMessages((prev) => {
      const targetIdx = prev.findIndex((m) => m.id === messageId);
      return prev.map((m, idx) => {
        if (m.id === messageId) {
          return { ...m, text: newText, isEdited: true };
        }
        if (targetIdx !== -1 && idx === targetIdx - 1 && m.sender === 'assistant') {
          return { ...m, selectedOption: newText };
        }
        return m;
      });
    });

    // 2. If it's a guided step response, reopen the step selector
    if (stepIndex !== undefined && stepIndex >= 0) {
      handleReopenStep(stepIndex);
      return;
    }

    // 3. Re-trigger chatbot reply for this edited question
    setIsTyping(true);
    try {
      const editIdx = messages.findIndex((m) => m.id === messageId);
      const priorMessages = editIdx !== -1 ? messages.slice(0, editIdx) : messages;

      const boundedHistory = priorMessages
        .filter((m) => m.id !== messageId && m.text && m.text.trim().length > 0 && m.inputType !== 'summary_card')
        .slice(-10)
        .map((m) => ({
          role: (m.sender === 'assistant' ? 'model' : 'user') as 'model' | 'user',
          text: m.text,
        }));

      const res = await sendChatMessage(
        newText,
        boundedHistory,
        sessionId,
        null,
        chatMode === 'validation' ? 'validation' : isGuidedMode ? 'discovery' : 'qa'
      );

      setSessionId(res.sessionId);
      if (res.profile) setProfile(res.profile);

      // Truncate any obsolete messages that were after the edited message and append fresh reply
      setMessages((prev) => {
        const curEditIdx = prev.findIndex((m) => m.id === messageId);
        if (curEditIdx !== -1) {
          const updated = prev.slice(0, curEditIdx + 1);
          updated.push({
            id: `asst-edit-reply-${Date.now()}`,
            sender: 'assistant',
            text: res.reply,
            timestamp: getCurrentTimeString(),
            followupQuestions: res.followupQuestions,
          });
          return updated;
        } else {
          return [
            ...prev,
            {
              id: `asst-edit-reply-${Date.now()}`,
              sender: 'assistant',
              text: res.reply,
              timestamp: getCurrentTimeString(),
              followupQuestions: res.followupQuestions,
            },
          ];
        }
      });

      if (res.followupQuestions && res.followupQuestions.length > 0) {
        setQuickReplies(res.followupQuestions.map((q, i) => ({ id: `qr-${i}`, label: q })));
      }
    } catch (err) {
      console.warn('Failed to regenerate response for edited message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  // Freeform text message submission (extracts profile details dynamically via Gemini)
  const handleSendMessage = async (text: string, attachedFile?: { name: string; size: string }) => {
    if (!text || text.trim().length === 0) return;

    if (text.trim() === 'Start Guided Career Discovery') {
      if (!hasChatStarted) {
        handleToggleGuidedMode(true);
      }
      return;
    }

    if (text.trim().toLowerCase() === 'confirm profile') {
      await handleConfirmProfile();
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: getCurrentTimeString(),
      status: 'read',
      attachedFile,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuickReplies([]);
    setIsTyping(true);

    try {
      // Build bounded conversation history for Gemini (excluding summary cards)
      const boundedHistory = messages
        .filter((m) => m.text && m.text.trim().length > 0 && m.inputType !== 'summary_card')
        .slice(-10)
        .map((m) => ({
          role: (m.sender === 'assistant' ? 'model' : 'user') as 'model' | 'user',
          text: m.text,
        }));

      // Determine effective mode:
      const isValidationTrigger =
        text.toLowerCase().includes('validate my capabilities') ||
        text.toLowerCase().includes('validate capabilities') ||
        text.toLowerCase().includes('start capability validation') ||
        text.toLowerCase().includes('take capability assessment') ||
        text.toLowerCase().includes('retake assessment') ||
        chatMode === 'validation';

      const isPathwayOrDoubt =
        text.includes('Generate My Step-by-Step Pathway') ||
        text.includes('Goal Role Pathway') ||
        text.toLowerCase().includes('create my pathway') ||
        text.toLowerCase().includes('roadmap') ||
        (!isGuidedMode && !isValidationTrigger);

      let effectiveApiMode: 'discovery' | 'qa' | 'validation' = 'discovery';

      if (isValidationTrigger && !text.includes('Generate My Step-by-Step Pathway')) {
        effectiveApiMode = 'validation';
        setChatMode('validation');
      } else if (isPathwayOrDoubt) {
        effectiveApiMode = 'qa';
        setChatMode('qa');
      } else {
        effectiveApiMode = 'discovery';
        setChatMode('discovery');
      }

      // Call backend Gemini extraction, QA, or Validation endpoint
      const result = await sendChatMessage(text, boundedHistory, sessionId, undefined, effectiveApiMode);

      setSessionId(result.sessionId);
      if (result.profile) setProfile(result.profile);
      if (result.completionPercentage !== undefined) setCompletionPercentage(result.completionPercentage);
      if (result.missingFields) setMissingFields(result.missingFields);
      if (result.activeQuestionCategory) setActiveQuestionCategory(result.activeQuestionCategory);
      if (result.sectionAnalyses) setSectionAnalyses(result.sectionAnalyses);

      // If in Discovery mode and complete / ready for review, show the review card
      if (effectiveApiMode === 'discovery' && (result.completionPercentage === 100 || result.activeQuestionCategory === 'review')) {
        const reviewMsg: ChatMessage = {
          id: `summary-review-${Date.now()}`,
          sender: 'assistant',
          text: `${result.reply}\n\nHere is your complete **Self-Reported Career Profile Summary**. You can confirm it or make any corrections:`,
          timestamp: getCurrentTimeString(),
          inputType: 'summary_card',
          stepData: result.profile,
          followupQuestions: ['Confirm Profile', 'Change my skills', 'Change my graduation year', 'Change my target roles'],
        };
        setMessages((prev) => [...prev, reviewMsg]);
        onComplete?.(result.profile);
      } else {
        const assistantMessage: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: result.reply,
          timestamp: getCurrentTimeString(),
          followupQuestions: result.followupQuestions,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      // Populate interactive quick-reply chips from AI response
      if (result.followupQuestions && result.followupQuestions.length > 0) {
        setQuickReplies(result.followupQuestions.map((q, i) => ({ id: `qr-${i}-${Date.now()}`, label: q })));
      }
    } catch (err) {
      console.warn('Backend call failed, falling back to local career guide:', err);
      const { replyText, followupQuestions, nextReplies } = getMockAssistantReply(
        text,
        attachedFile?.name
      );

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: getCurrentTimeString(),
        followupQuestions,
      };

      if (nextReplies && nextReplies.length > 0) {
        setQuickReplies(nextReplies);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectQuickReply = (option: QuickReplyOption) => {
    handleSendMessage(option.label);
  };

  // Consume any external prompt triggered by host
  useEffect(() => {
    if (externalPrompt && externalPrompt.trim().length > 0) {
      if (isInternalMinimized) {
        setIsInternalMinimized(false);
      }
      handleSendMessage(externalPrompt.trim());
      onExternalPromptConsumed?.();
    }
  }, [externalPrompt]);

  // Minimized pill fallback
  if (isInternalMinimized) {
    return (
      <div className="flex items-center justify-center p-4">
        <button
          type="button"
          onClick={() => setIsInternalMinimized(false)}
          className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-[#1e34c9] via-[#2552f4] to-[#3b59f8] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 select-none group"
          title="Click to restore chat"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/40 shadow-xs">
            <img src={avatarImg} alt="IBOT Avatar" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-[13.5px] font-bold leading-tight">IBOT</span>
            <span className="text-[11px] text-white/80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              Restore Career Guide
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Active step title
  const activeStepTitle = getStepTitle(currentStepIndex, careerIntent, isGuidedMode);

  // Inner chat container contents
  const ChatContent = (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden bg-white text-slate-800 font-sans h-full w-full',
        effectiveMode === 'panel' && 'rounded-2xl border border-slate-200/90 shadow-xs',
        effectiveMode === 'drawer' && 'h-full border-l border-slate-200 shadow-2xl',
        effectiveMode === 'floating' &&
          'max-w-[450px] h-[730px] max-h-[92vh] rounded-[28px] sm:rounded-[32px] shadow-[0_25px_70px_-15px_rgba(37,59,211,0.28),0_12px_24px_-8px_rgba(0,0,0,0.06)] border border-slate-200/90 ring-1 ring-blue-500/15',
        className
      )}
      role="region"
      aria-label="IBOT Career Guide Chatbot"
    >
      {/* 1. Header with live milestone tracker, mode toggle, and close/refresh buttons */}
      <ChatHeader
        mode={effectiveMode}
        subtitle={
          subtitle ||
          (chatMode === 'validation'
            ? 'Capability Validation: Objective Knowledge, Reasoning & Evidence'
            : isGuidedMode
            ? 'Discovery Phase: Identify your Point A background & Point B destination'
            : 'Career Q&A: Clarify doubts & build your goal role pathway')
        }
        currentStep={currentStepIndex}
        totalSteps={6}
        stepTitle={activeStepTitle}
        isGuidedMode={isGuidedMode}
        completionPercentage={completionPercentage}
        onToggleGuidedMode={handleToggleGuidedMode}
        isModeSwitchDisabled={hasChatStarted}
        onClose={onClose}
        onMinimize={effectiveMode !== 'panel' || onMinimize ? handleMinimize : undefined}
        onRefresh={handleRefresh}
      />

      {/* 2. White Conversation Body with overlapping rounded top */}
      <div className="relative flex-1 flex flex-col bg-white -mt-2.5 rounded-t-[22px] overflow-hidden z-10 pt-2.5">
        {/* Top smooth fading gradient overlay */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white via-white/85 to-transparent pointer-events-none z-20 transition-opacity duration-200',
            isScrolled ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        />

        {/* Scrollable Messages Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-5 pt-3 pb-2 scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#e2e8f0 transparent',
          }}
        >
          {messages.map((msg, index) => {
            // Find the immediate subsequent user message answering this assistant message
            const subsequentUserMsg = messages
              .slice(index + 1)
              .find((m) => m.sender === 'user');

            // Find the immediate parent assistant message for this user message
            const parentAssistantMsg =
              msg.sender === 'user'
                ? messages
                    .slice(0, index)
                    .reverse()
                    .find((m) => m.sender === 'assistant')
                : undefined;

            // Is the response to this assistant message currently being edited?
            const isResponseBeingEdited =
              msg.sender === 'assistant' &&
              editingMessageId !== null &&
              subsequentUserMsg?.id === editingMessageId;

            // Older options are disabled if a user message has already been sent,
            // UNLESS the user is currently editing their response to this message!
            const isOptionsDisabled =
              msg.sender === 'assistant' &&
              !!subsequentUserMsg &&
              !isResponseBeingEdited;

            // Determine which option was selected (if any)
            const selectedOption =
              msg.selectedOption ||
              (subsequentUserMsg ? subsequentUserMsg.text : undefined);

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isIntroWaving={index === 0 && !hasPlayedIntro}
                onSelectFollowup={(q) => {
                  if (isResponseBeingEdited && subsequentUserMsg) {
                    handleEditUserMessage(subsequentUserMsg.id, q, subsequentUserMsg.stepIndex);
                  } else {
                    handleSelectFollowup(q, msg.id);
                  }
                }}
                onSubmitInteractiveAnswer={handleSubmitInteractiveAnswer}
                onReopenStep={handleReopenStep}
                onPreviousStep={handlePreviousStep}
                onConfirmProfile={handleConfirmProfile}
                onEditUserMessage={handleEditUserMessage}
                isEditing={editingMessageId === msg.id}
                onStartEdit={() => setEditingMessageId(msg.id)}
                onCancelEdit={() => setEditingMessageId(null)}
                parentFollowupQuestions={parentAssistantMsg?.followupQuestions}
                isOptionsDisabled={isOptionsDisabled}
                selectedOption={selectedOption}
                isResponseBeingEdited={isResponseBeingEdited}
                canGoBack={currentStepIndex > 1}
                disabled={isTyping}
                profile={profile}
                sectionAnalyses={sectionAnalyses}
              />
            );
          })}

          {isTyping && <TypingIndicator />}

          {/* Follow-up Quick Reply Pills (only shown when no response boxes are active on top) */}
          {quickReplies && quickReplies.length > 0 && !isTyping && !hasActiveResponseBoxes && (
            <QuickReplies
              options={quickReplies}
              onSelect={handleSelectQuickReply}
              disabled={isTyping}
            />
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* 3. Bottom Sticky Message Input */}
        <div className="shrink-0 border-t border-slate-100 bg-white">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isTyping}
            placeholder={
              chatMode === 'validation'
                ? 'Type your answer, or paste project link/code...'
                : isGuidedMode && currentStepIndex <= 6
                ? 'Select answer above or specify your details...'
                : 'Ask any career doubt or say "Create my pathway to [Goal Role]"...'
            }
          />
        </div>
      </div>
    </div>
  );

  // If Drawer presentation is requested:
  if (effectiveMode === 'drawer') {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity cursor-pointer"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Slide-out Drawer Panel */}
        <div className="relative z-10 w-full sm:w-[460px] md:w-[480px] h-full shadow-2xl animate-in slide-in-from-right duration-300">
          {ChatContent}
        </div>
      </div>
    );
  }

  return ChatContent;
};

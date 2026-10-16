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
  type ChatMessage,
  type QuickReplyOption,
} from './mockCareerChatData';
import avatarImg from '../../assets/ibot-avatar-generated.png';
import { sendChatMessage, confirmStudentProfileApi, resetSessionApi } from '../../lib/api';
import { INITIAL_STUDENT_PROFILE } from '../../mock/careerDiscoveryDefaults';
import { StudentCareerProfile, SectionAnalysis } from '../../types/careerDiscovery';

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

const STEP_TITLES: Record<number, string> = {
  1: 'Career Stage & Timeline',
  2: 'Education & Academic Focus',
  3: 'Technical Skills & Capabilities',
  4: 'Practical Experience & Projects',
  5: 'Interests & Work Preferences',
  6: 'Target Roles & Aspirations',
  7: 'Career Discovery Results',
};

export const IBOTCareerGuide: React.FC<IBOTCareerGuideProps> = ({
  className,
  mode = 'panel',
  isOpen = true,
  isFloating = false,
  subtitle = 'Identify Phase • Guided Career Discovery',
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

  // Mode switcher: Guided Discovery (structured 6-step intake) vs Freeform Q&A
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(initialMode === 'guided');

  // Guided flow state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);
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

  // Intro waving animation
  useEffect(() => {
    if (!hasPlayedIntro) {
      const timer = setTimeout(() => {
        setHasPlayedIntro(true);
      }, 1850);
      return () => clearTimeout(timer);
    }
  }, [hasPlayedIntro]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isTyping, quickReplies]);

  // Confirm student profile (Phase 2 review card action)
  const handleConfirmProfile = async () => {
    if (!sessionId) return;
    try {
      await confirmStudentProfileApi(sessionId);
      setProfile((prev) => ({ ...prev, status: 'confirmed' }));
      const confirmMsg: ChatMessage = {
        id: `confirm-${Date.now()}`,
        sender: 'assistant',
        text: '🎉 **Profile Confirmed!**\n\nYour self-reported career profile has been verified and safely saved in your session. All data is ready for the Identify stage evaluation.',
        timestamp: getCurrentTimeString(),
      };
      setMessages((prev) => [...prev, confirmMsg]);
      onComplete?.(profile);
    } catch (err) {
      console.error('Failed to confirm profile:', err);
    }
  };

  // Restart / Reset active session
  const handleRefresh = () => {
    setHasPlayedIntro(true);
    setIsScrolled(false);
    setIsTyping(false);
    setQuickReplies([]);
    setCurrentStepIndex(1);
    setProfile(INITIAL_STUDENT_PROFILE);
    setProfileData({});
    setCompletionPercentage(0);
    setMissingFields([]);
    setActiveQuestionCategory('about_you');

    if (sessionId) {
      resetSessionApi(sessionId).catch(console.warn);
    }

    if (isGuidedMode) {
      setMessages([getGuidedInitialMessage()]);
    } else {
      setMessages(getInitialMessages());
    }

    onRefresh?.();
  };

  // Switch between Guided Discovery and Q&A modes
  const handleToggleGuidedMode = (guided: boolean) => {
    if (guided === isGuidedMode) return;
    setIsGuidedMode(guided);
    setIsTyping(false);
    setQuickReplies([]);

    if (guided) {
      // Switch to guided discovery
      setCurrentStepIndex(1);
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
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // 3. Format structured payload for backend profile merge
    let structuredAnswer: any = null;
    if (stepIndex === 1) {
      structuredAnswer = {
        aboutYou: {
          currentStage: stepData.stageId || stepData.currentStage,
          stageLabel: stepData.stageLabel,
        },
        education: {
          graduationYear: stepData.gradYear || stepData.graduationYear,
        },
      };
    } else if (stepIndex === 2) {
      structuredAnswer = { education: stepData };
    } else if (stepIndex === 3) {
      structuredAnswer = { skills: stepData };
    } else if (stepIndex === 4) {
      structuredAnswer = { practicalExperience: stepData };
    } else if (stepIndex === 5) {
      structuredAnswer = { interests: stepData };
    } else if (stepIndex === 6) {
      structuredAnswer = { goals: stepData };
    }

    try {
      const boundedHistory = messages
        .filter((m) => m.text && m.text.trim().length > 0 && m.inputType !== 'summary_card')
        .slice(-10)
        .map((m) => ({
          role: (m.sender === 'assistant' ? 'model' : 'user') as 'model' | 'user',
          text: m.text,
        }));

      const res = await sendChatMessage(formattedAnswerText, boundedHistory, sessionId, structuredAnswer);

      setSessionId(res.sessionId);
      if (res.profile) setProfile(res.profile);
      if (res.completionPercentage !== undefined) setCompletionPercentage(res.completionPercentage);
      if (res.missingFields) setMissingFields(res.missingFields);
      if (res.activeQuestionCategory) setActiveQuestionCategory(res.activeQuestionCategory);
      if (res.sectionAnalyses) setSectionAnalyses(res.sectionAnalyses);

      const nextStep = stepIndex + 1;
      setCurrentStepIndex(nextStep);

      // If finished all sections or ready for review, render the Review Card
      if (res.completionPercentage === 100 || res.activeQuestionCategory === 'review' || nextStep >= 7) {
        const reviewMsg: ChatMessage = {
          id: `summary-review-${Date.now()}`,
          sender: 'assistant',
          text: `${res.reply}\n\nHere is your **Self-Reported Career Profile Summary**. Please review the details below. You can confirm it or make any corrections:`,
          timestamp: getCurrentTimeString(),
          inputType: 'summary_card',
          stepData: res.profile,
          followupQuestions: ['Confirm Profile', 'I want to update my skills', 'I want to update my target roles'],
        };
        setMessages((prev) => [...prev, reviewMsg]);
        onComplete?.(res.profile);
      } else {
        const nextAssistantMsg = getGuidedStepMessage(nextStep, res.profile);
        if (res.reply) {
          nextAssistantMsg.text = `${res.reply}\n\n${nextAssistantMsg.text}`;
        }
        setMessages((prev) => [...prev, nextAssistantMsg]);
      }

      if (res.followupQuestions && res.followupQuestions.length > 0) {
        setQuickReplies(res.followupQuestions.map((q, i) => ({ id: `qr-${i}`, label: q })));
      }
    } catch (err) {
      console.warn('Backend call failed, continuing with local step:', err);
      const nextStep = stepIndex + 1;
      const nextProfile = { ...profileData, [`step_${stepIndex}`]: stepData };
      setProfileData(nextProfile);
      setCurrentStepIndex(nextStep);
      const nextAssistantMsg = getGuidedStepMessage(nextStep, nextProfile);
      setMessages((prev) => [...prev, nextAssistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle "Previous" backtracking
  const handlePreviousStep = () => {
    if (currentStepIndex <= 1) return;

    const targetStep = currentStepIndex - 1;

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
  };

  // Re-open an earlier answered step
  const handleReopenStep = (stepIndex: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.stepIndex === stepIndex ? { ...m, isCompletedStep: false } : m))
    );
    setCurrentStepIndex(stepIndex);
  };

  // Freeform text message submission (extracts profile details dynamically via Gemini)
  const handleSendMessage = async (text: string, attachedFile?: { name: string; size: string }) => {
    if (!text || text.trim().length === 0) return;

    if (text.trim() === 'Start Guided Career Discovery') {
      handleToggleGuidedMode(true);
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

      // Call backend Gemini extraction endpoint
      const result = await sendChatMessage(text, boundedHistory, sessionId);

      setSessionId(result.sessionId);
      if (result.profile) setProfile(result.profile);
      if (result.completionPercentage !== undefined) setCompletionPercentage(result.completionPercentage);
      if (result.missingFields) setMissingFields(result.missingFields);
      if (result.activeQuestionCategory) setActiveQuestionCategory(result.activeQuestionCategory);
      if (result.sectionAnalyses) setSectionAnalyses(result.sectionAnalyses);

      // If complete or ready for review, show the review card
      if (result.completionPercentage === 100 || result.activeQuestionCategory === 'review') {
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
  const activeStepTitle = STEP_TITLES[currentStepIndex] || 'Career Discovery';

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
        subtitle={subtitle}
        currentStep={currentStepIndex}
        totalSteps={6}
        stepTitle={activeStepTitle}
        isGuidedMode={isGuidedMode}
        completionPercentage={completionPercentage}
        onToggleGuidedMode={handleToggleGuidedMode}
        onClose={onClose}
        onMinimize={effectiveMode !== 'panel' || onMinimize ? handleMinimize : undefined}
        onRefresh={handleRefresh}
      />

      {/* 2. White Conversation Body with overlapping rounded top */}
      <div className="relative flex-1 flex flex-col bg-white -mt-4 rounded-t-[26px] overflow-hidden z-10 pt-3">
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
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isIntroWaving={index === 0 && !hasPlayedIntro}
              onSelectFollowup={handleSendMessage}
              onSubmitInteractiveAnswer={handleSubmitInteractiveAnswer}
              onReopenStep={handleReopenStep}
              onPreviousStep={handlePreviousStep}
              onConfirmProfile={handleConfirmProfile}
              canGoBack={currentStepIndex > 1}
              disabled={isTyping}
              profile={profile}
              sectionAnalyses={sectionAnalyses}
            />
          ))}

          {isTyping && <TypingIndicator />}

          {/* Follow-up Quick Reply Pills */}
          {quickReplies && quickReplies.length > 0 && !isTyping && (
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
              isGuidedMode && currentStepIndex <= 6
                ? 'Select answer above, or type a custom question...'
                : 'Ask about career roadmaps, skills, placements, resume...'
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

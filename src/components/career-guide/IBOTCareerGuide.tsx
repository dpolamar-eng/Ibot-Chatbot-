import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { QuickReplies } from './QuickReplies';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import {
  INITIAL_MESSAGES,
  getInitialMessages,
  getCurrentTimeString,
  getMockAssistantReply,
  type ChatMessage,
  type QuickReplyOption,
} from './mockCareerChatData';
import avatarImg from '../../assets/ibot-avatar-generated.png';

export interface IBOTCareerGuideProps {
  className?: string;
  isFloating?: boolean;
  subtitle?: string;
  skipIntroAnimation?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onRefresh?: () => void;
}

export const IBOTCareerGuide: React.FC<IBOTCareerGuideProps> = ({
  className,
  isFloating = false,
  subtitle,
  skipIntroAnimation = false,
  onClose,
  onMinimize,
  onRefresh,
}) => {
  // Start with the bot's greeting using the real-time current clock timestamp
  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages());
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

  // Clean any old sessionStorage keys to prevent stale locks
  useEffect(() => {
    try {
      sessionStorage.removeItem('ibot_chat_intro_played');
    } catch {}
  }, []);

  // Keep initial greeting timestamp updated in real-time until user begins chatting
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].sender === 'assistant') {
          const newTime = getCurrentTimeString();
          if (prev[0].timestamp !== newTime) {
            return [{ ...prev[0], timestamp: newTime }];
          }
        }
        return prev;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Intro waving animation runs once for 1.85s when chat session mounts
  useEffect(() => {
    if (!hasPlayedIntro) {
      const timer = setTimeout(() => {
        setHasPlayedIntro(true);
      }, 1850);
      return () => clearTimeout(timer);
    }
  }, [hasPlayedIntro]);

  const handleRefresh = () => {
    // When using the chat refresh option inside the header, clear chat history
    // and refresh initial message timestamp to the current clock time
    setHasPlayedIntro(true);
    setIsScrolled(false);
    setMessages(getInitialMessages());
    setQuickReplies([]);
    setIsTyping(false);
    onRefresh?.();
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

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isTyping, quickReplies]);

  const getCurrentTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleSendMessage = (text: string, attachedFile?: { name: string; size: string }) => {
    const newMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: newMsgId,
      sender: 'user',
      text,
      timestamp: getCurrentTimestamp(),
      status: 'read',
      attachedFile,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuickReplies([]); // clear current quick replies while typing
    setIsTyping(true);

    setTimeout(() => {
      const { replyText, followupQuestions, nextReplies } = getMockAssistantReply(text, attachedFile?.name);
      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: getCurrentTimestamp(),
        followupQuestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);

      if (nextReplies && nextReplies.length > 0) {
        setQuickReplies(nextReplies);
      }
    }, 750);
  };

  const handleSelectQuickReply = (option: QuickReplyOption) => {
    handleSendMessage(option.label);
  };

  if (isInternalMinimized) {
    return (
      <div className="flex items-center justify-center p-4">
        <button
          type="button"
          onClick={() => setIsInternalMinimized(false)}
          className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-[#253bd3] via-[#2f46e5] to-[#3b59f8] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 select-none group"
          title="Click to restore chat"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/40 shadow-xs">
            <img src={avatarImg} alt="IBOT Avatar" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-[13.5px] font-bold leading-tight">IBOT</span>
            <span className="text-[11px] text-white/80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              Click to restore chat
            </span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden bg-white text-slate-800 font-sans',
        'w-full max-w-[450px] h-[730px] max-h-[92vh]',
        'rounded-[28px] sm:rounded-[32px]',
        'shadow-[0_24px_60px_-12px_rgba(37,59,211,0.22),0_12px_24px_-8px_rgba(0,0,0,0.06)]',
        'border border-slate-100/80',
        'animate-in fade-in duration-300 ease-out',
        className
      )}
      role="region"
      aria-label="IBOT Career Guide Chatbot"
    >
      {/* 1. Header: Royal Indigo with Chat Refresh and Minimize buttons in right upper corner */}
      <ChatHeader
        isFloating={isFloating}
        subtitle={subtitle}
        onClose={onClose}
        onMinimize={handleMinimize}
        onRefresh={handleRefresh}
      />

      {/* 2. White Conversation Body with overlapping rounded top */}
      <div className="relative flex-1 flex flex-col bg-white -mt-4 rounded-t-[26px] overflow-hidden z-10 pt-3">
        {/* Top smooth fading gradient overlay that dissolves past chats */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-11 bg-gradient-to-b from-white via-white/85 to-transparent pointer-events-none z-20 transition-opacity duration-200',
            isScrolled ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        />

        {/* Scrollable Messages Area with Top Alpha Fade Mask */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-5 pt-3 pb-2 scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#e2e8f0 transparent',
            maskImage: isScrolled
              ? 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.25) 12px, rgba(0, 0, 0, 0.85) 30px, rgba(0, 0, 0, 1) 48px, rgba(0, 0, 0, 1) 100%)'
              : 'none',
            WebkitMaskImage: isScrolled
              ? 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.25) 12px, rgba(0, 0, 0, 0.85) 30px, rgba(0, 0, 0, 1) 48px, rgba(0, 0, 0, 1) 100%)'
              : 'none',
            transition: 'mask-image 0.2s ease, -webkit-mask-image 0.2s ease',
          }}
        >
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isIntroWaving={index === 0 && !hasPlayedIntro}
              onSelectFollowup={handleSendMessage}
              disabled={isTyping}
            />
          ))}

          {isTyping && <TypingIndicator />}

          {/* Follow-up Quick Reply Pills (appears after bot response) */}
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
        <div className="shrink-0 border-t border-slate-50 bg-white">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isTyping}
          />
        </div>
      </div>
    </div>
  );
};

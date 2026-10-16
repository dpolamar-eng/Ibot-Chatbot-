import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X, RotateCcw } from 'lucide-react';

interface ChatHeaderProps {
  className?: string;
  isFloating?: boolean;
  subtitle?: string;
  onRefresh?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
}

const LETTERS = ['I', 'B', 'O', 'T'];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  className,
  isFloating = false,
  subtitle = 'Your AI guide for career & placements',
  onRefresh,
  onClose,
  onMinimize,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [visibleLetters, setVisibleLetters] = useState<number>(0);
  const [animKey, setAnimKey] = useState<number>(0);

  // Sequence:
  // 1. Initial (0-400ms): small compact squircle/pill with blinking green dot alone
  // 2. 400ms: box smoothly stretches towards the right side (duration ~600ms, finishes at ~1000ms)
  // 3. Staggered reveal: I -> B -> O -> T illuminate one by one
  useEffect(() => {
    setIsExpanded(false);
    setVisibleLetters(0);

    const tExpand = setTimeout(() => {
      setIsExpanded(true);
    }, 420);

    const tI = setTimeout(() => {
      setVisibleLetters(1); // 'I'
    }, 1020);

    const tB = setTimeout(() => {
      setVisibleLetters(2); // 'B'
    }, 1200);

    const tO = setTimeout(() => {
      setVisibleLetters(3); // 'O'
    }, 1380);

    const tT = setTimeout(() => {
      setVisibleLetters(4); // 'T'
    }, 1560);

    return () => {
      clearTimeout(tExpand);
      clearTimeout(tI);
      clearTimeout(tB);
      clearTimeout(tO);
      clearTimeout(tT);
    };
  }, [animKey]);

  const handleRefreshClick = () => {
    setAnimKey((prev) => prev + 1);
    onRefresh?.();
  };

  const handleBadgeClick = () => {
    setAnimKey((prev) => prev + 1);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden pt-6 pb-8 px-6 select-none',
        'bg-gradient-to-br from-[#3b59f8] via-[#2a46e5] to-[#1e34c9]',
        className
      )}
    >
      {/* Decorative ambient lighting & organic glass curves */}
      <div
        className="absolute -top-12 -right-8 w-64 h-64 rounded-full bg-gradient-to-br from-cyan-400/25 to-blue-400/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      {/* Radiant cyan backlight aura directly behind IBOT */}
      <div
        className="absolute -top-6 -left-6 w-48 h-36 rounded-full bg-gradient-to-r from-[#00f2fe]/30 via-[#38bdf8]/20 to-transparent blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full border border-white/10 bg-white/[0.04] pointer-events-none transform translate-x-12 -translate-y-8"
        aria-hidden="true"
      />
      <div
        className="absolute top-4 right-10 w-32 h-32 rounded-full border border-white/[0.08] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-10 left-4 w-48 h-48 rounded-full bg-indigo-600/35 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Right Upper Corner Action Buttons: Frosted Circular Glass Pills */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5">
        {/* 1. Chat refresh button */}
        <button
          type="button"
          onClick={handleRefreshClick}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/85 hover:text-white border border-white/15 transition-all duration-150 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-white/40"
          title="Restart & clear chat"
          aria-label="Restart & clear chat"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>

        {/* 2. Button for minimizing the widget */}
        <button
          type="button"
          onClick={onMinimize || onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/85 hover:text-white border border-white/15 transition-all duration-150 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-white/40"
          title="Minimize chat"
          aria-label="Minimize chat"
        >
          <X className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      </div>

      {/* Main Header Content: Animated crystal pill containing blinking green dot and sequential IBOT */}
      <div className="relative z-10 flex flex-col items-start gap-1.5 pr-16">
        <button
          type="button"
          onClick={handleBadgeClick}
          className={cn(
            'group relative flex items-center h-[38px] rounded-full text-left',
            'bg-gradient-to-r from-white/30 via-white/20 to-white/15 backdrop-blur-xl',
            'border border-white/45 shadow-[0_4px_24px_rgba(0,229,255,0.38),inset_0_1px_1.5px_rgba(255,255,255,0.85)] ring-1 ring-[#00e5ff]/40',
            'transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer select-none overflow-hidden',
            isExpanded ? 'w-[114px] pl-[14px] pr-3.5' : 'w-[38px] pl-[14px] pr-0'
          )}
          title="Click to replay IBOT animation"
          aria-label="IBOT AI Assistant"
        >
          {/* Solid Matte Dark Green Status Dot (No shine, clean blink) */}
          <span
            className="w-2.5 h-2.5 rounded-full bg-[#15803d] animate-ibot-dot shrink-0"
            aria-hidden="true"
          />

          {/* Sequential letters container */}
          <div
            className={cn(
              'ml-2.5 flex items-center tracking-tight transition-opacity duration-300 font-sans',
              isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            aria-label="IBOT"
          >
            <h1 className="flex items-center text-[22px] sm:text-[23px] font-black tracking-tight text-white select-none leading-none drop-shadow-[0_2px_12px_rgba(0,240,255,0.7)] font-sans">
              {LETTERS.map((letter, idx) => {
                const isVisible = visibleLetters > idx;
                return (
                  <span
                    key={letter + idx}
                    className={cn(
                      'inline-block transition-all duration-200 ease-out transform',
                      isVisible
                        ? 'opacity-100 scale-100 translate-y-0 filter-none'
                        : 'opacity-0 scale-50 -translate-y-1 blur-[1px]'
                    )}
                  >
                    {letter}
                  </span>
                );
              })}
            </h1>
          </div>
        </button>

        <p className="text-white/90 text-[12.5px] sm:text-[13px] font-medium tracking-normal leading-snug mt-0.5 drop-shadow-xs">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

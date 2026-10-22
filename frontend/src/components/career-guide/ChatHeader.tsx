import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X, RotateCcw, Sparkles, Compass, MessageSquare, Bot } from 'lucide-react';

interface ChatHeaderProps {
  className?: string;
  mode?: 'panel' | 'drawer' | 'floating';
  subtitle?: string;
  currentStep?: number;
  totalSteps?: number;
  stepTitle?: string;
  isGuidedMode?: boolean;
  completionPercentage?: number;
  onToggleGuidedMode?: (guided: boolean) => void;
  onRefresh?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
}

const LETTERS = ['I', 'B', 'O', 'T'];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  className,
  mode = 'panel',
  subtitle = 'Discover where you are, explore where you want to go, and understand how to get there.',
  currentStep = 1,
  totalSteps = 6,
  stepTitle = 'Current Position (Point A)',
  isGuidedMode = true,
  completionPercentage,
  onToggleGuidedMode,
  onRefresh,
  onClose,
  onMinimize,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [visibleLetters, setVisibleLetters] = useState<number>(4);
  const [animKey, setAnimKey] = useState<number>(0);

  // Staggered reveal effect synchronized with the bot profile wave animation (1800ms total)
  useEffect(() => {
    setIsExpanded(false);
    setVisibleLetters(0);

    const tExpand = setTimeout(() => setIsExpanded(true), 150);
    const tI = setTimeout(() => setVisibleLetters(1), 250);
    const tB = setTimeout(() => setVisibleLetters(2), 650);
    const tO = setTimeout(() => setVisibleLetters(3), 1050);
    const tT = setTimeout(() => setVisibleLetters(4), 1450);

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

  const progressPercent =
    completionPercentage !== undefined
      ? completionPercentage
      : Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div
      className={cn(
        'relative overflow-hidden select-none',
        'bg-gradient-to-r from-[#1e34c9] via-[#2552f4] to-[#3b59f8] text-white',
        'pt-3.5 pb-6 px-5 sm:px-6',
        className
      )}
    >
      {/* Background ambient lighting */}
      <div
        className="absolute -top-12 -right-8 w-56 h-56 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 left-0 w-44 h-44 rounded-full bg-indigo-900/40 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top action row */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-2.5">
        {/* IBOT Crystal Badge */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'group relative flex items-center h-[34px] rounded-full text-left',
              'bg-white/20 backdrop-blur-md border border-white/35 shadow-xs',
              'transition-all duration-300 select-none pl-3 pr-3.5'
            )}
          >
            {/* Blinking green status dot */}
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse shrink-0"
              aria-hidden="true"
            />

            {/* IBOT Letters */}
            <div className="ml-2 flex items-center font-sans tracking-tight">
              <span className="text-base font-black tracking-tight text-white select-none leading-none flex items-center">
                {LETTERS.map((letter, idx) => (
                  <span
                    key={letter + idx}
                    className={cn(
                      'inline-block transition-all duration-350 ease-out',
                      visibleLetters > idx
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-75 translate-y-1'
                    )}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-white/80 bg-white/10 px-2.5 py-1 rounded-full border border-white/15 hidden sm:inline-block">
            Career Ladder
          </span>
        </div>

        {/* Action icons: Guided/Q&A Switcher, Restart, Close */}
        <div className="flex items-center gap-1.5">
          {onToggleGuidedMode && (
            <div className="flex items-center bg-black/25 p-0.5 rounded-lg border border-white/20 text-[11px]">
              <button
                type="button"
                onClick={() => onToggleGuidedMode(true)}
                className={cn(
                  'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                  isGuidedMode ? 'bg-white text-[#2552f4] shadow-xs' : 'text-white/80 hover:text-white'
                )}
                title="Discovery Phase: Identify your background & goals"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Discovery</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleGuidedMode(false)}
                className={cn(
                  'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                  !isGuidedMode ? 'bg-white text-[#2552f4] shadow-xs' : 'text-white/80 hover:text-white'
                )}
                title="Career Q&A: Clarify doubts & build goal role pathway"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Career Q&A</span>
              </button>
            </div>
          )}

          {/* Restart Button */}
          <button
            type="button"
            onClick={handleRefreshClick}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer"
            title="Restart session"
            aria-label="Restart session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Close button for drawer or modal */}
          {(onClose || onMinimize) && (
            <button
              type="button"
              onClick={onClose || onMinimize}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Subtitle & Progress Context */}
      <div className="relative z-10 flex flex-col gap-1">
        <p className="text-white/90 text-xs font-medium tracking-normal leading-snug">
          {subtitle}
        </p>

        {/* Milestone Indicator if in Guided Discovery */}
        {isGuidedMode && currentStep <= totalSteps && (
          <div className="pt-1.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-white/85 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                <span>
                  Step {currentStep} of {totalSteps}: {stepTitle}
                </span>
              </span>
              <span className="font-bold text-cyan-200">{progressPercent}%</span>
            </div>

            {/* Factual Progress Bar */}
            <div className="w-full h-1.5 bg-black/25 rounded-full overflow-hidden border border-white/15">
              <div
                className="h-full bg-gradient-to-r from-cyan-300 to-white rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { cn } from '../../lib/utils';
import { X, RotateCcw, Compass, MessageSquare } from 'lucide-react';
import { NeonWaveHeaderBackground } from './NeonWaveHeaderBackground';

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
  isModeSwitchDisabled?: boolean;
}

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
  isModeSwitchDisabled = false,
}) => {
  const handleRefreshClick = () => {
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
        'pt-4 pb-5 px-5 sm:px-6 text-white',
        className
      )}
    >
      {/* 1. Ethereal Neon Wave & Dark Teal-to-Violet Background */}
      <NeonWaveHeaderBackground />

      {/* 2. Top action row */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-2.5">
        {/* Combined IBOT Career Ladder Badge */}
        <div
          className={cn(
            'group relative flex items-center h-[34px] rounded-full text-left',
            'bg-white/10 backdrop-blur-md border border-white/20 shadow-xs',
            'transition-all duration-300 select-none px-4'
          )}
        >
          {/* IBOT + Career Ladder */}
          <div className="flex items-center font-sans tracking-tight select-none">
            <span className="text-[14px] font-black tracking-tight text-white leading-none">
              IBOT
            </span>
            <span className="text-[13px] font-bold text-white ml-2 tracking-normal leading-none">
              Career Ladder
            </span>
          </div>
        </div>

        {/* Action icons: Guided/Q&A Switcher, Restart, Close */}
        <div className="flex items-center gap-2">
          {onToggleGuidedMode && (
            <div className="flex items-center bg-slate-900/60 backdrop-blur-md p-1 rounded-xl border border-white/15 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  if (!isModeSwitchDisabled) {
                    onToggleGuidedMode(true);
                  }
                }}
                disabled={!isGuidedMode && isModeSwitchDisabled}
                className={cn(
                  'px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5',
                  isGuidedMode
                    ? 'bg-white text-slate-900 shadow-sm cursor-default'
                    : isModeSwitchDisabled
                    ? 'text-white/35 cursor-not-allowed opacity-50 select-none'
                    : 'text-white/80 hover:text-white cursor-pointer'
                )}
                title={
                  !isGuidedMode && isModeSwitchDisabled
                    ? 'Mode locked to Career Q&A while chat is in progress. Click restart (↺) to switch.'
                    : 'Discovery Phase: Identify your background & goals'
                }
                aria-disabled={!isGuidedMode && isModeSwitchDisabled}
              >
                <Compass className="w-3.5 h-3.5 text-[#2552f4]" />
                <span>Discovery</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isModeSwitchDisabled) {
                    onToggleGuidedMode(false);
                  }
                }}
                disabled={isGuidedMode && isModeSwitchDisabled}
                className={cn(
                  'px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5',
                  !isGuidedMode
                    ? 'bg-white text-slate-900 shadow-sm cursor-default'
                    : isModeSwitchDisabled
                    ? 'text-white/35 cursor-not-allowed opacity-50 select-none'
                    : 'text-white/80 hover:text-white cursor-pointer'
                )}
                title={
                  isGuidedMode && isModeSwitchDisabled
                    ? 'Mode locked to Discovery while chat is in progress. Click restart (↺) to switch.'
                    : 'Career Q&A: Clarify doubts & build goal role pathway'
                }
                aria-disabled={isGuidedMode && isModeSwitchDisabled}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Career Q&A</span>
              </button>
            </div>
          )}

          {/* Restart Button with blue glass tint */}
          <button
            type="button"
            onClick={handleRefreshClick}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-600/70 hover:bg-blue-600/90 text-white border border-white/25 shadow-xs transition-all cursor-pointer"
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
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Subtitle & Progress Context */}
      <div className="relative z-10 flex flex-col gap-1.5 mt-2">
        <p className="text-slate-200 text-xs font-normal tracking-normal leading-relaxed">
          {subtitle}
        </p>

        {/* Milestone Indicator if in Guided Discovery */}
        {isGuidedMode && currentStep <= totalSteps && (
          <div className="pt-1.5 space-y-1.5">
            <div className="flex items-center justify-between text-[12px] text-white/95 font-medium">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span>
                  Step {currentStep} of {totalSteps}: {stepTitle}
                </span>
              </span>
              <span className="font-bold text-cyan-300">{progressPercent}%</span>
            </div>

            {/* Factual Progress Bar with neon gradient fill */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.7)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

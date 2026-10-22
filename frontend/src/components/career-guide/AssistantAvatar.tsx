import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import avatarRestImg from '../../assets/ibot-avatar-generated.png';
import robotWavingImg from '../../assets/ibot-hand-wave-only.webp';

interface AssistantAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isIntroWaving?: boolean;
}

export const AssistantAvatar: React.FC<AssistantAvatarProps> = ({
  className,
  size = 'md',
  isIntroWaving = false,
}) => {
  const [isWaving, setIsWaving] = useState(isIntroWaving);

  useEffect(() => {
    if (isIntroWaving) {
      setIsWaving(true);
      const timer = setTimeout(() => {
        setIsWaving(false);
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setIsWaving(false);
    }
  }, [isIntroWaving]);

  const handleTriggerWave = () => {
    if (!isWaving) {
      setIsWaving(true);
      setTimeout(() => {
        setIsWaving(false);
      }, 1800);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 min-w-8 min-h-8',
    md: 'w-11 h-11 min-w-11 min-h-11',
    lg: 'w-14 h-14 min-w-14 min-h-14',
  }[size];

  return (
    <div
      onClick={handleTriggerWave}
      className={cn(
        'relative shrink-0 select-none flex items-center justify-center cursor-pointer group',
        sizeClasses,
        className
      )}
      title="Click bot to wave 👋"
      aria-label="IBOT Assistant Avatar"
    >
      {/* 1. STATIONARY PROFILE BACKGROUND — Stays fixed, never moves */}
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          'bg-gradient-to-tr from-[#1d3bbd] via-[#2f55e0] to-[#4568f5] shadow-xs',
          'ring-1 ring-[#00e5ff]/25'
        )}
        aria-hidden="true"
      />

      {/* 2. ONLY THE BOT CHARACTER COMES OUT FROM THE TOP TO WAVE */}
      {isWaving ? (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ibot-emerge-settle"
          style={{ willChange: 'transform' }}
        >
          <img
            src={robotWavingImg}
            alt="IBOT Assistant Waving"
            className="w-full h-full object-contain select-none drop-shadow-[0_8px_14px_rgba(15,30,120,0.35)]"
            loading="eager"
          />
        </div>
      ) : (
        /* 3. SETTLED STATE: Pristine static avatar perfectly set inside the stationary circle */
        <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center z-10 transition-opacity duration-200">
          <img
            src={avatarRestImg}
            alt="IBOT Assistant"
            className="w-full h-full object-contain select-none"
            loading="eager"
          />
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { cn } from '../../lib/utils';

interface WavingArmProps {
  className?: string;
  isWaving?: boolean;
}

export const WavingArm: React.FC<WavingArmProps> = ({ className, isWaving = false }) => {
  return (
    <div
      className={cn(
        'absolute pointer-events-none z-30 select-none',
        'w-7 h-7 -top-2.5 -right-2',
        isWaving ? 'animate-ibot-hand-wave' : 'opacity-0 scale-0',
        className
      )}
      style={{
        transformOrigin: '25% 85%', // shoulder pivot point
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_4px_rgba(20,40,120,0.25)]"
      >
        <defs>
          {/* Ceramic White to Soft Periwinkle Robot Arm Gradient */}
          <linearGradient id="armWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f0f5ff" />
            <stop offset="100%" stopColor="#cfe0fc" />
          </linearGradient>

          {/* Arm Outline Gradient */}
          <linearGradient id="armStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>

          {/* Palm Cyan Energy Light */}
          <radialGradient id="palmCyanLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#0284c7" />
          </radialGradient>
        </defs>

        {/* Forearm / Wrist Joint */}
        <path
          d="M 8 28 C 9 22, 13 16, 17 12"
          stroke="url(#armWhiteGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Robot Hand Mitten / Palm */}
        <ellipse
          cx="20"
          cy="9"
          rx="5.5"
          ry="6"
          fill="url(#armWhiteGrad)"
          stroke="url(#armStrokeGrad)"
          strokeWidth="0.8"
          transform="rotate(15 20 9)"
        />

        {/* Glowing Cyan Energy Sensor in Center of Palm */}
        <ellipse
          cx="20"
          cy="9.5"
          rx="2.6"
          ry="3"
          fill="url(#palmCyanLight)"
          transform="rotate(15 20 9.5)"
        />

        {/* Cute Thumb */}
        <ellipse
          cx="14.5"
          cy="11.5"
          rx="2"
          ry="3.2"
          fill="url(#armWhiteGrad)"
          stroke="url(#armStrokeGrad)"
          strokeWidth="0.6"
          transform="rotate(-40 14.5 11.5)"
        />

        {/* Cute Curved Fingers (3 Finger Segments) */}
        <ellipse
          cx="18.5"
          cy="3.8"
          rx="1.6"
          ry="2.8"
          fill="url(#armWhiteGrad)"
          transform="rotate(5 18.5 3.8)"
        />
        <ellipse
          cx="22"
          cy="4.2"
          rx="1.6"
          ry="2.8"
          fill="url(#armWhiteGrad)"
          transform="rotate(22 22 4.2)"
        />
        <ellipse
          cx="24.8"
          cy="6.2"
          rx="1.5"
          ry="2.6"
          fill="url(#armWhiteGrad)"
          transform="rotate(38 24.8 6.2)"
        />
      </svg>
    </div>
  );
};

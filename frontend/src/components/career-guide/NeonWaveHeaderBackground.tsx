import React from 'react';

/**
 * NeonWaveHeaderBackground
 * Renders an ethereal, luminous neon wave composed of flowing cyan, teal,
 * electric blue, and magenta/violet light ribbons with smooth GPU-accelerated
 * animations that create an organic flowing, moving wave effect.
 */
export const NeonWaveHeaderBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes waveSway1 {
          0% {
            transform: translate3d(0px, 0px, 0) scale(1, 1);
          }
          33% {
            transform: translate3d(16px, -3.5px, 0) scale(1.02, 1.03);
          }
          66% {
            transform: translate3d(-10px, 2px, 0) scale(0.99, 0.98);
          }
          100% {
            transform: translate3d(0px, 0px, 0) scale(1, 1);
          }
        }

        @keyframes waveSway2 {
          0% {
            transform: translate3d(0px, 0px, 0) scale(1, 1);
          }
          33% {
            transform: translate3d(-14px, 3px, 0) scale(0.98, 0.97);
          }
          66% {
            transform: translate3d(12px, -2px, 0) scale(1.01, 1.02);
          }
          100% {
            transform: translate3d(0px, 0px, 0) scale(1, 1);
          }
        }

        @keyframes waveSway3 {
          0% {
            transform: translate3d(0px, 0px, 0);
          }
          50% {
            transform: translate3d(9px, -2.5px, 0);
          }
          100% {
            transform: translate3d(0px, 0px, 0);
          }
        }

        @keyframes neonStream1 {
          0% {
            stroke-dashoffset: 720;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes neonStream2 {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -720;
          }
        }

        @keyframes hotspotBreathe {
          0%, 100% {
            transform: scale(1) translate3d(0, 0, 0);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.25) translate3d(4px, -1.5px, 0);
            opacity: 1;
          }
        }

        @keyframes haloPulseCyan {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate3d(24px, -10px, 0) scale(1.15);
            opacity: 0.35;
          }
        }

        @keyframes haloPulseMagenta {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.25;
          }
          50% {
            transform: translate3d(-20px, 8px, 0) scale(1.2);
            opacity: 0.38;
          }
        }

        .anim-wave-sway-1 {
          animation: waveSway1 8.5s ease-in-out infinite;
          transform-origin: 65% 50%;
          will-change: transform;
        }

        .anim-wave-sway-2 {
          animation: waveSway2 11.5s ease-in-out infinite;
          transform-origin: 55% 45%;
          will-change: transform;
        }

        .anim-wave-sway-3 {
          animation: waveSway3 6.8s ease-in-out infinite;
          transform-origin: 70% 55%;
          will-change: transform;
        }

        .anim-stream-fast {
          stroke-dasharray: 140 220;
          animation: neonStream1 4.8s linear infinite;
        }

        .anim-stream-slow {
          stroke-dasharray: 100 260;
          animation: neonStream1 7.2s linear infinite;
        }

        .anim-stream-alt {
          stroke-dasharray: 120 240;
          animation: neonStream2 6s linear infinite;
        }

        .anim-hotspot {
          animation: hotspotBreathe 3.6s ease-in-out infinite;
          transform-origin: 950px 162px;
          will-change: transform, opacity;
        }

        .anim-halo-cyan {
          animation: haloPulseCyan 7s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .anim-halo-magenta {
          animation: haloPulseMagenta 8.5s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-wave-sway-1,
          .anim-wave-sway-2,
          .anim-wave-sway-3,
          .anim-stream-fast,
          .anim-stream-slow,
          .anim-stream-alt,
          .anim-hotspot,
          .anim-halo-cyan,
          .anim-halo-magenta {
            animation: none !important;
          }
        }
      `}</style>

      {/* 1. Base Dark Teal-to-Deep-Blue-to-Violet Background Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(108deg, #022530 0%, #061e38 22%, #0a1344 48%, #1f0b4d 74%, #380854 100%)',
        }}
      />

      {/* 2. Living Ambient Colored Light Halos */}
      {/* Cyan-teal glow on left/center */}
      <div className="anim-halo-cyan absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-44 rounded-full bg-cyan-400/20 blur-[60px]" />

      {/* Electric blue glow in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 w-96 h-48 rounded-full bg-blue-600/25 blur-[70px]" />

      {/* Rich magenta/violet flare on top-right */}
      <div className="anim-halo-magenta absolute -top-10 right-1/4 w-80 h-52 rounded-full bg-fuchsia-600/25 blur-[65px]" />

      {/* Hotspot flare at wave intersection near right bottom */}
      <div className="anim-hotspot absolute bottom-2 right-[22%] w-48 h-28 rounded-full bg-cyan-300/35 blur-[35px]" />
      <div className="anim-hotspot absolute bottom-1 right-[20%] w-36 h-24 rounded-full bg-fuchsia-400/40 blur-[28px]" />

      {/* 3. High-definition Neon Wave SVG Ribbon with Moving Layers */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 220"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Neon Glow Filters */}
          <filter id="neonGlowStrong" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur1" />
            <feGaussianBlur stdDeviation="1.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="neonGlowSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients for ribbons */}
          <linearGradient id="waveCyanToBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f5ff" stopOpacity="0" />
            <stop offset="25%" stopColor="#00f5ff" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="78%" stopColor="#818cf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="waveMagentaViolet" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="30%" stopColor="#818cf8" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#d946ef" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="waveTealMagenta" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="20%" stopColor="#06b6d4" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#e879f9" stopOpacity="1" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="waveElectricCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="30%" stopColor="#00f5ff" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#67e8f9" stopOpacity="1" />
            <stop offset="100%" stopColor="#a5f3fc" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* --- Group 1: Magenta / Purple Upper Flow Lines (Floating Wave Layer 2) --- */}
        <g className="anim-wave-sway-2">
          <path
            d="M 320 160 C 460 145 520 85 640 68 C 760 52 830 115 900 135 C 970 155 1060 120 1180 90"
            stroke="url(#waveMagentaViolet)"
            strokeWidth="1.2"
            fill="none"
            opacity="0.65"
            filter="url(#neonGlowSoft)"
          />
          <path
            d="M 340 162 C 480 146 535 88 650 72 C 765 56 835 118 905 137 C 975 156 1070 122 1190 92"
            stroke="url(#waveMagentaViolet)"
            strokeWidth="1.6"
            fill="none"
            opacity="0.8"
            filter="url(#neonGlowStrong)"
          />
          {/* Animated streaming light pulse on magenta path */}
          <path
            d="M 340 162 C 480 146 535 88 650 72 C 765 56 835 118 905 137 C 975 156 1070 122 1190 92"
            stroke="#fbcfe8"
            strokeWidth="1.8"
            fill="none"
            opacity="0.7"
            className="anim-stream-slow"
            filter="url(#neonGlowStrong)"
          />
          <path
            d="M 360 164 C 500 148 550 92 660 76 C 770 60 840 120 910 139 C 980 158 1080 124 1200 95"
            stroke="url(#waveMagentaViolet)"
            strokeWidth="1.2"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M 380 166 C 520 150 565 96 670 80 C 775 64 845 122 915 141 C 985 160 1090 126 1210 98"
            stroke="url(#waveMagentaViolet)"
            strokeWidth="1.8"
            fill="none"
            opacity="0.85"
            filter="url(#neonGlowSoft)"
          />
        </g>

        {/* --- Group 2: Central Glowing Cyan / Electric Blue Ribbons (Floating Wave Layer 1) --- */}
        <g className="anim-wave-sway-1">
          <path
            d="M 280 155 C 440 140 540 75 680 75 C 800 75 845 145 920 155 C 985 163 1070 130 1220 90"
            stroke="url(#waveCyanToBlue)"
            strokeWidth="1.4"
            fill="none"
            opacity="0.75"
            filter="url(#neonGlowSoft)"
          />
          <path
            d="M 295 157 C 455 142 555 78 690 78 C 810 78 850 147 925 156 C 990 164 1078 132 1225 92"
            stroke="url(#waveCyanToBlue)"
            strokeWidth="2.0"
            fill="none"
            opacity="0.9"
            filter="url(#neonGlowStrong)"
          />
          <path
            d="M 310 159 C 470 144 570 82 700 82 C 818 82 855 149 930 157 C 995 165 1085 134 1230 94"
            stroke="url(#waveCyanToBlue)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.85"
          />
          <path
            d="M 325 161 C 485 146 585 86 710 86 C 825 86 860 151 935 158 C 1000 166 1092 136 1235 96"
            stroke="url(#waveCyanToBlue)"
            strokeWidth="2.2"
            fill="none"
            opacity="0.95"
            filter="url(#neonGlowStrong)"
          />
          {/* Animated streaming light pulse on cyan path */}
          <path
            d="M 325 161 C 485 146 585 86 710 86 C 825 86 860 151 935 158 C 1000 166 1092 136 1235 96"
            stroke="#e0f2fe"
            strokeWidth="2.2"
            fill="none"
            opacity="0.8"
            className="anim-stream-fast"
            filter="url(#neonGlowStrong)"
          />
        </g>

        {/* --- Group 3: Core High-Intensity Filaments & Lower Swirls (Floating Wave Layer 3) --- */}
        <g className="anim-wave-sway-3">
          {/* Electric Cyan Core */}
          <path
            d="M 350 165 C 500 150 600 92 725 92 C 835 92 868 153 942 160 C 1008 168 1100 138 1240 100"
            stroke="url(#waveElectricCyan)"
            strokeWidth="1.5"
            fill="none"
            opacity="1"
            filter="url(#neonGlowStrong)"
          />
          {/* Traveling white neon energy beam */}
          <path
            d="M 370 167 C 515 153 615 97 735 97 C 842 97 872 155 948 162 C 1014 170 1108 140 1245 103"
            stroke="#ffffff"
            strokeWidth="1.2"
            fill="none"
            opacity="0.9"
            className="anim-stream-fast"
            filter="url(#neonGlowSoft)"
          />
          <path
            d="M 370 167 C 515 153 615 97 735 97 C 842 97 872 155 948 162 C 1014 170 1108 140 1245 103"
            stroke="#ffffff"
            strokeWidth="0.85"
            fill="none"
            opacity="0.75"
            filter="url(#neonGlowSoft)"
          />
          <path
            d="M 385 169 C 530 155 628 102 745 102 C 850 102 878 157 954 163 C 1020 171 1115 143 1250 106"
            stroke="url(#waveTealMagenta)"
            strokeWidth="2.0"
            fill="none"
            opacity="0.9"
            filter="url(#neonGlowStrong)"
          />
          <path
            d="M 400 172 C 545 158 640 108 755 108 C 858 108 884 160 960 165 C 1026 172 1122 146 1255 110"
            stroke="url(#waveTealMagenta)"
            strokeWidth="1.6"
            fill="none"
            opacity="0.85"
          />
          {/* Animated counter-streaming teal/magenta pulse */}
          <path
            d="M 400 172 C 545 158 640 108 755 108 C 858 108 884 160 960 165 C 1026 172 1122 146 1255 110"
            stroke="#c084fc"
            strokeWidth="1.8"
            fill="none"
            opacity="0.75"
            className="anim-stream-alt"
            filter="url(#neonGlowSoft)"
          />
          <path
            d="M 420 175 C 560 162 655 114 768 114 C 865 114 890 162 966 166 C 1032 173 1130 149 1260 114"
            stroke="url(#waveMagentaViolet)"
            strokeWidth="1.4"
            fill="none"
            opacity="0.75"
            filter="url(#neonGlowSoft)"
          />
          <path
            d="M 440 178 C 575 166 670 120 780 120 C 872 120 896 164 972 168 C 1038 174 1138 152 1265 118"
            stroke="url(#waveMagentaViolet)"
            strokeWidth="1.2"
            fill="none"
            opacity="0.65"
          />
        </g>

        {/* Group 4: Living Hotspot Burst at wave intersection */}
        <g className="anim-hotspot">
          <circle cx="945" cy="160" r="14" fill="#00f5ff" opacity="0.4" filter="url(#neonGlowStrong)" />
          <circle cx="952" cy="162" r="9" fill="#ffffff" opacity="0.75" filter="url(#neonGlowSoft)" />
          <circle cx="958" cy="163" r="16" fill="#d946ef" opacity="0.45" filter="url(#neonGlowStrong)" />
        </g>
      </svg>
    </div>
  );
};

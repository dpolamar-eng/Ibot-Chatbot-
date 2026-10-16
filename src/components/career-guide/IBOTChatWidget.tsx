import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { IBOTCareerGuide } from './IBOTCareerGuide';
import avatarImg from '../../assets/ibot-avatar-generated.png';
import { MessageSquare, X } from 'lucide-react';

interface IBOTChatWidgetProps {
  defaultOpen?: boolean;
  className?: string;
}

export const IBOTChatWidget: React.FC<IBOTChatWidgetProps> = ({
  defaultOpen = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'fixed bottom-5 right-5 z-50 flex flex-col items-end select-none',
        className
      )}
    >
      {/* Expanded Chatbot Panel */}
      {isOpen && (
        <div
          className={cn(
            'mb-4 transition-all duration-300 transform origin-bottom-right',
            'animate-in fade-in zoom-in-95 slide-in-from-bottom-6',
            'w-[92vw] sm:w-[430px] md:w-[450px]'
          )}
        >
          <IBOTCareerGuide
            isFloating={true}
            onClose={() => setIsOpen(false)}
            onMinimize={() => setIsOpen(false)}
          />
        </div>
      )}

      {/* Floating Launcher Button */}
      <div className="relative group">
        {!isOpen && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-[13px] font-medium shadow-lg backdrop-blur-sm pointer-events-none transition-all duration-200 opacity-0 group-hover:opacity-100 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span>Chat with IBOT Career Guide</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer shadow-xl',
            'focus:outline-none focus:ring-4 focus:ring-[#315cfc]/30',
            isOpen
              ? 'w-13 h-13 bg-slate-800 hover:bg-slate-900 text-white'
              : 'w-15 h-15 bg-gradient-to-tr from-[#253bd3] via-[#2f46e5] to-[#3b59f8] p-1 hover:scale-105 active:scale-95 shadow-[0_10px_25px_-5px_rgba(47,70,229,0.5)]'
          )}
          aria-label={isOpen ? 'Close IBOT Chatbot' : 'Open IBOT Career Guide Chatbot'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <img
                src={avatarImg}
                alt="IBOT Avatar"
                className="w-full h-full object-contain rounded-full"
              />
              {/* Online Green Pulsing Indicator */}
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#22c55e] border-2 border-white rounded-full shadow-sm" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

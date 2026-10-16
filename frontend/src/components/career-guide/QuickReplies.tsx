import React from 'react';
import { cn } from '../../lib/utils';
import { type QuickReplyOption } from './mockCareerChatData';

interface QuickRepliesProps {
  options: QuickReplyOption[];
  onSelect: (option: QuickReplyOption) => void;
  disabled?: boolean;
  className?: string;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  options,
  onSelect,
  disabled = false,
  className,
}) => {
  if (!options || options.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2.5 pt-2 pb-3 px-1 transition-opacity duration-200 select-none',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
      role="group"
      aria-label="Quick replies"
    >
      {options.map((option) => {
        const isHighlighted = option.highlighted;

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option)}
            className={cn(
              'px-5 py-2.5 rounded-full text-[14px] sm:text-[14.5px] font-medium tracking-[-0.01em]',
              'border-[1.5px] transition-all duration-200 cursor-pointer shadow-xs',
              'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-98 focus:outline-none focus:ring-2 focus:ring-[#315cfc]/30',
              isHighlighted
                ? 'bg-[#dbeafe]/70 hover:bg-[#dbeafe] border-[#7ea8fc] text-[#2552f4] font-semibold'
                : 'bg-white hover:bg-[#f8faff] border-[#b8ccfa] hover:border-[#7ea8fc] text-[#274ce8]'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

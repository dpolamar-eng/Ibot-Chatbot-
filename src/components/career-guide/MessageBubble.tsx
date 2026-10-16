import React from 'react';
import { cn } from '../../lib/utils';
import { AssistantAvatar } from './AssistantAvatar';
import { FileText, ArrowRight } from 'lucide-react';
import { type ChatMessage } from './mockCareerChatData';

interface MessageBubbleProps {
  message: ChatMessage;
  className?: string;
  isIntroWaving?: boolean;
  onSelectFollowup?: (question: string) => void;
  disabled?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  className,
  isIntroWaving = false,
  onSelectFollowup,
  disabled = false,
}) => {
  const isAssistant = message.sender === 'assistant';

  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-fade-in transition-all duration-200',
        isAssistant ? 'justify-start items-start gap-3' : 'justify-end items-end',
        className
      )}
    >
      {/* Bot avatar only for assistant messages */}
      {isAssistant && (
        <div className="pt-0.5 shrink-0">
          <AssistantAvatar size="md" isIntroWaving={isIntroWaving} />
        </div>
      )}

      {/* Bubble Column with timestamp */}
      <div
        className={cn(
          'flex flex-col',
          isAssistant ? 'items-start max-w-[85%]' : 'items-end max-w-[80%]'
        )}
      >
        <div
          className={cn(
            'px-5 py-3.5 text-[15px] sm:text-[15.5px] leading-[1.4] tracking-[-0.005em] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
            isAssistant
              ? 'bg-[#eff0fa] text-[#1e293b] rounded-[22px] rounded-tl-[8px]'
              : 'bg-[#315cfc] text-white rounded-[22px] rounded-br-[8px] font-normal shadow-[0_4px_14px_rgba(49,92,252,0.25)]'
          )}
        >
          {/* Attached File Preview inside Message Bubble */}
          {message.attachedFile && (
            <div
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl mb-2 text-xs font-medium',
                isAssistant
                  ? 'bg-white border border-slate-200 text-slate-800'
                  : 'bg-white/15 border border-white/25 text-white'
              )}
            >
              <FileText className="w-4 h-4 shrink-0 text-current" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold truncate">{message.attachedFile.name}</span>
                <span className="opacity-80 text-[10.5px]">{message.attachedFile.size}</span>
              </div>
            </div>
          )}

          {message.text &&
            message.text.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                {paragraph.split('\n').map((line, lIdx) => (
                  <React.Fragment key={lIdx}>
                    {lIdx > 0 && <br />}
                    {formatBoldText(line)}
                  </React.Fragment>
                ))}
              </p>
            ))}
        </div>

        {/* Timestamp & Read Receipt */}
        <div
          className={cn(
            'flex items-center gap-1.5 mt-1.5 px-1.5 text-[12px] sm:text-[12.5px] font-medium text-[#8e9cae] select-none',
            isAssistant ? 'justify-start' : 'justify-end'
          )}
        >
          <span>{message.timestamp}</span>
          {!isAssistant && (
            <span
              className="inline-flex items-center text-[#2552f4] ml-0.5"
              title="Delivered and read"
              aria-label="Read receipt"
            >
              {/* Custom SVG Double Checkmark matching reference */}
              <svg
                className="w-4 h-4 stroke-current fill-none stroke-[2.2]"
                viewBox="0 0 20 20"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 11l3 3L14 5" />
                <path d="M9 11l2.5 2.5L18 6" />
              </svg>
            </span>
          )}
        </div>

        {/* Suggested Follow-up Questions for Bot Replies */}
        {isAssistant && message.followupQuestions && message.followupQuestions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2 w-full animate-fade-in">
            {message.followupQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFollowup?.(q)}
                disabled={disabled}
                className={cn(
                  'group text-left text-[12.5px] sm:text-[13px] font-medium leading-[1.35]',
                  'text-[#2552f4] hover:text-[#1d3bbd]',
                  'bg-[#f0f4ff] hover:bg-[#e2ecff] active:bg-[#d5e4ff]',
                  'border border-[#d0e0ff] hover:border-[#b8d1ff]',
                  'rounded-full px-3.5 py-1.5 transition-all duration-150',
                  'shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0',
                  'flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'
                )}
              >
                <span>{q}</span>
                <ArrowRight className="w-3 h-3 text-[#315cfc] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to render bold text inside lines if markdown **bold** exists
function formatBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

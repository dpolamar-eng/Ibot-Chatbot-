import React from 'react';
import { AssistantAvatar } from './AssistantAvatar';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex w-full mb-4 justify-start items-start gap-3 animate-fade-in">
      <div className="pt-0.5 shrink-0">
        <AssistantAvatar size="md" />
      </div>
      <div className="flex flex-col items-start">
        <div className="px-5 py-3.5 bg-[#eff0fa] text-[#1e293b] rounded-[22px] rounded-tl-[8px] flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="w-2 h-2 rounded-full bg-[#315cfc]/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-[#315cfc]/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-[#315cfc]/60 animate-bounce" />
        </div>
        <div className="mt-1 px-1.5 text-[11.5px] font-medium text-[#8e9cae]">
          IBOT is typing...
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Paperclip, Send, X, FileText, Mic, MicOff, Sparkles } from 'lucide-react';

interface AttachedFileInfo {
  name: string;
  size: string;
}

interface MessageInputProps {
  onSendMessage: (text: string, file?: AttachedFileInfo) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  className,
  placeholder = 'Ask IBOT anything about your career...',
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFileInfo | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      setAttachedFile({
        name: file.name,
        size: sizeStr,
      });
      inputRef.current?.focus();
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const handleVoiceToggle = () => {
    if (disabled) return;
    if (!isRecording) {
      setIsRecording(true);
      // Simulate real-time voice speech-to-text typing
      const sampleQueries = [
        'How do I prepare for campus placements in 2026?',
        'Give me the best roadmap for AI & Machine Learning.',
        'Review my resume for Software Engineering roles.',
        'What are the most common coding interview questions?',
      ];
      const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx <= randomQuery.length) {
          setInputText(randomQuery.slice(0, currentIdx));
          currentIdx += 3;
        } else {
          clearInterval(interval);
          setIsRecording(false);
        }
      }, 50);
    } else {
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if ((!trimmed && !attachedFile) || disabled) return;

    onSendMessage(trimmed, attachedFile || undefined);
    setInputText('');
    setAttachedFile(null);
    setIsRecording(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = !disabled && (inputText.trim().length > 0 || attachedFile !== null);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('w-full pt-2 pb-4 px-5 bg-white select-none', className)}
    >
      {/* Hidden File Input for Native File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        aria-hidden="true"
      />

      {/* Attached File Preview Badge */}
      {attachedFile && (
        <div className="mb-2 flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 text-xs text-[#2552f4] animate-fade-in shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 shrink-0 text-[#315cfc]" />
            <span className="font-semibold truncate text-slate-800">{attachedFile.name}</span>
            <span className="text-slate-500 shrink-0 text-[11px]">({attachedFile.size})</span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1 rounded-full hover:bg-blue-100/80 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Remove attached file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Pill Input Container */}
      <div
        className={cn(
          'relative flex items-center w-full pl-3 pr-1.5 py-1.5 rounded-full',
          'bg-gradient-to-r from-slate-50 via-white to-slate-50',
          'border transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.03)]',
          isFocused
            ? 'border-[#315cfc] ring-3 ring-[#315cfc]/15 shadow-[0_4px_20px_rgba(49,92,252,0.12)]'
            : 'border-slate-200 hover:border-slate-300'
        )}
      >
        {/* Attachment Paperclip Button */}
        <button
          type="button"
          onClick={handleFileClick}
          disabled={disabled}
          className="text-slate-400 hover:text-[#315cfc] p-2 rounded-full transition-colors focus:outline-none cursor-pointer hover:bg-blue-50/70 active:scale-95 shrink-0"
          title="Attach resume or document (.pdf, .docx)"
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4 -rotate-45 stroke-[2.2]" />
        </button>

        {/* Input Text Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={attachedFile ? 'Add a message or press Send...' : placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent px-2.5 py-2 text-[14.5px] sm:text-[15px] text-slate-800 placeholder-slate-400 outline-none font-normal"
          aria-label="Ask about your career"
        />

        {/* Voice dictation simulation button */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          disabled={disabled}
          className={cn(
            'p-2 rounded-full transition-all focus:outline-none cursor-pointer shrink-0 mr-1',
            isRecording
              ? 'text-rose-600 bg-rose-50 animate-pulse'
              : 'text-slate-400 hover:text-[#315cfc] hover:bg-blue-50/70'
          )}
          title={isRecording ? 'Listening...' : 'Voice query (simulated)'}
          aria-label="Voice input"
        >
          {isRecording ? (
            <Mic className="w-4 h-4 text-rose-500 animate-bounce" />
          ) : (
            <Mic className="w-4 h-4 stroke-[2]" />
          )}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!canSend}
          className={cn(
            'w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer',
            canSend
              ? 'bg-gradient-to-tr from-[#2552f4] to-[#3b68fc] text-white shadow-[0_4px_14px_rgba(37,82,244,0.35)] hover:scale-105 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-80'
          )}
          title="Send message (Enter)"
          aria-label="Send message"
        >
          <Send className={cn('w-4 h-4 ml-0.5', canSend ? 'text-white' : 'text-slate-400')} />
        </button>
      </div>

      {/* Minimal helper line with shortcuts */}
      <div className="flex items-center justify-between px-3 mt-1.5 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Instant AI Career Mentorship
        </span>
        <span className="hidden sm:inline opacity-75">
          Press <kbd className="px-1 py-0.2 bg-slate-100 rounded text-[10px] text-slate-600 border border-slate-200 font-mono">Enter ↵</kbd> to send
        </span>
      </div>
    </form>
  );
};

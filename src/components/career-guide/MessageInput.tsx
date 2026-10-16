import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Paperclip, Send, X, FileText } from 'lucide-react';

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
  placeholder = 'Ask about your career...',
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFileInfo | null>(null);
  const [isFocused, setIsFocused] = useState(false);
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
      // focus input so user can optionally add notes or press enter
      inputRef.current?.focus();
    }
    // reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if ((!trimmed && !attachedFile) || disabled) return;

    onSendMessage(trimmed, attachedFile || undefined);
    setInputText('');
    setAttachedFile(null);
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
      className={cn('w-full pt-2 pb-5 px-5 bg-white', className)}
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

      {/* Attached File Preview Badge (if a file was selected) */}
      {attachedFile && (
        <div className="mb-2 flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#2552f4] animate-fade-in">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 shrink-0 text-[#315cfc]" />
            <span className="font-semibold truncate">{attachedFile.name}</span>
            <span className="text-slate-500 shrink-0">({attachedFile.size})</span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1 rounded-full hover:bg-blue-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Remove attached file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Pill Input Container matching reference screenshot */}
      <div
        className={cn(
          'relative flex items-center w-full pl-3.5 pr-1.5 py-1.5 rounded-full',
          'bg-[#fcfdfe] border transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]',
          isFocused
            ? 'border-[#315cfc] ring-2 ring-[#315cfc]/15 shadow-md'
            : 'border-[#dde4ed] hover:border-[#cbd5e1]'
        )}
      >
        {/* Attachment Paperclip Button */}
        <button
          type="button"
          onClick={handleFileClick}
          disabled={disabled}
          className="text-[#7d8c9e] hover:text-[#315cfc] p-2 rounded-full transition-colors focus:outline-none cursor-pointer hover:bg-slate-100/70 active:scale-95 shrink-0"
          title="Attach resume or document"
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5 -rotate-45 stroke-[2.2]" />
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
          className="flex-1 bg-transparent px-2.5 py-2 text-[15px] sm:text-[15.5px] text-[#1e293b] placeholder-[#8c9cae] outline-none font-normal"
          aria-label="Ask about your career"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!canSend}
          className={cn(
            'w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer',
            canSend
              ? 'bg-[#3b48fb] text-white shadow-[0_4px_14px_rgba(59,72,251,0.4)] hover:bg-[#2b38ec] hover:scale-105 active:scale-95'
              : 'bg-[#3b48fb] text-white opacity-85 shadow-[0_3px_10px_rgba(59,72,251,0.25)] hover:bg-[#313ee8] active:scale-95'
          )}
          title="Send message"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 text-white ml-0.5" />
        </button>
      </div>
    </form>
  );
};

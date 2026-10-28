import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Paperclip, Send, X, FileText, Mic, AlertCircle } from 'lucide-react';

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
  const [speechError, setSpeechError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up SpeechRecognition instance when unmounting
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

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
    setSpeechError(null);

    // Google Web Speech API (supported natively in Chrome, Edge, and Chromium browsers)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        'Google Speech Recognition is supported in Chrome, Edge, and Chromium browsers. Please use Chrome for voice typing.'
      );
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (fullTranscript) {
          setInputText(fullTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError(
            'Microphone access was blocked. Please click the camera/mic icon in your browser address bar to allow microphone access.'
          );
        } else if (event.error === 'no-speech') {
          setSpeechError('No voice detected. Please speak closer to your microphone.');
        } else if (event.error === 'network') {
          setSpeechError('Google Speech Recognition network issue. Please check your internet connection.');
        }
        setIsRecording(false);
        setTimeout(() => setSpeechError(null), 5000);
      };

      recognition.onend = () => {
        setIsRecording(false);
        inputRef.current?.focus();
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
      setSpeechError('Could not access microphone. Please check permissions.');
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
    }
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

      {/* Speech Recognition Error Notification */}
      {speechError && (
        <div className="mb-2 flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="font-medium">{speechError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            className="p-0.5 rounded hover:bg-amber-500/20 text-amber-700 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attached File Preview Badge */}
      {attachedFile && (
        <div className="mb-2 flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#032836] to-[#0c1a4e] border border-cyan-500/30 text-xs text-white animate-fade-in shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 shrink-0 text-cyan-300" />
            <span className="font-semibold truncate text-white">{attachedFile.name}</span>
            <span className="text-slate-300 shrink-0 text-[11px]">({attachedFile.size})</span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
          'bg-gradient-to-r from-[#032836] via-[#0c1a4e] to-[#380a54]',
          'border transition-all duration-300 shadow-[0_4px_16px_rgba(12,26,78,0.18)]',
          isFocused
            ? 'border-cyan-400 ring-2 ring-cyan-400/25 shadow-[0_4px_20px_rgba(34,211,238,0.25)]'
            : isRecording
            ? 'border-rose-400 ring-2 ring-rose-400/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
            : 'border-white/15 hover:border-white/25'
        )}
      >
        {/* Attachment Paperclip Button */}
        <button
          type="button"
          onClick={handleFileClick}
          disabled={disabled}
          className="text-cyan-300/80 hover:text-white p-2 rounded-full transition-colors focus:outline-none cursor-pointer hover:bg-white/10 active:scale-95 shrink-0"
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
          placeholder={
            isRecording
              ? 'Listening... speak into your microphone'
              : attachedFile
              ? 'Add a message or press Send...'
              : placeholder
          }
          disabled={disabled}
          className="flex-1 bg-transparent px-2.5 py-2 text-[14.5px] sm:text-[15px] text-white placeholder-slate-400 outline-none font-normal"
          aria-label="Ask about your career"
        />

        {/* Voice dictation button with Google Speech Recognition */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          disabled={disabled}
          className={cn(
            'p-2 rounded-full transition-all focus:outline-none cursor-pointer shrink-0 mr-1',
            isRecording
              ? 'text-rose-400 bg-rose-500/20 ring-2 ring-rose-400/50 animate-pulse'
              : 'text-cyan-300/80 hover:text-white hover:bg-white/10'
          )}
          title={
            isRecording
              ? 'Listening to your voice... (Click to stop)'
              : 'Voice typing (Google Speech Recognition)'
          }
          aria-label="Voice input"
        >
          {isRecording ? (
            <Mic className="w-4 h-4 text-rose-400 animate-bounce" />
          ) : (
            <Mic className="w-4 h-4 stroke-[2]" />
          )}
        </button>

        {/* Send Button - Brightly Illuminated Neon Gradient */}
        <button
          type="submit"
          disabled={disabled}
          onClick={(e) => {
            if (!canSend) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }}
          className={cn(
            'w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer',
            'bg-gradient-to-r from-[#00d2ff] via-[#2563eb] to-[#c026d3] text-white',
            canSend
              ? 'shadow-[0_0_16px_rgba(0,210,255,0.6)] hover:scale-110 active:scale-95'
              : 'shadow-[0_0_12px_rgba(0,210,255,0.4)] opacity-90 hover:opacity-100 hover:scale-105'
          )}
          title={canSend ? 'Send message (Enter)' : 'Type a message to send'}
          aria-label="Send message"
        >
          <Send className="w-4 h-4 ml-0.5 text-white stroke-[2.4]" />
        </button>
      </div>

      {/* Minimal helper line */}
      <div className="flex items-center px-3 mt-1.5 text-[11px] text-slate-400">
        <span>Instant AI Career Mentorship</span>
      </div>
    </form>
  );
};

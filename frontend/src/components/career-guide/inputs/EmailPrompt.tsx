import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface EmailPromptProps {
  onContinue: (email: string) => void;
  onSkip: () => void;
  disabled?: boolean;
}

export const EmailPrompt: React.FC<EmailPromptProps> = ({
  onContinue,
  onSkip,
  disabled = false,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleContinue = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter a valid email address to continue');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address to continue (e.g. name@example.com)');
      return;
    }
    setError(null);
    onContinue(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleContinue();
    }
  };

  return (
    <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
      {/* Input Field */}
      <div className="space-y-1.5">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none flex items-center">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. yourname@example.com"
            disabled={disabled}
            className={cn(
              'w-full pl-11 pr-4 py-3 bg-white text-slate-800 text-sm font-medium rounded-2xl border transition-all outline-none',
              error
                ? 'border-red-400 ring-2 ring-red-100'
                : 'border-blue-400 hover:border-blue-500 focus:border-[#2552f4] focus:ring-2 focus:ring-[#2552f4]/15 shadow-2xs'
            )}
            autoFocus
          />
        </div>
        {error && (
          <p className="text-red-500 text-[11px] pl-1 font-medium animate-in fade-in">
            {error}
          </p>
        )}
      </div>

      {/* Action Buttons: Continue vs Skip for now */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors px-1 py-1.5 cursor-pointer disabled:opacity-50"
        >
          Skip for now
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00b4d8] via-[#2552f4] to-[#a825eb] hover:from-[#0096c7] hover:to-[#9333ea] text-white text-xs font-bold rounded-full shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          <span>Continue</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

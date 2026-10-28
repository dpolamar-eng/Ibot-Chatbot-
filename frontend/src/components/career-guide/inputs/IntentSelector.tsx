import React from 'react';
import { cn } from '../../../lib/utils';
import { Target, Compass, Check, ArrowRight } from 'lucide-react';

export type CareerIntentType = 'career_decided' | 'career_exploring';

interface IntentSelectorProps {
  selectedIntent: CareerIntentType;
  onSelectIntent: (intent: CareerIntentType, label: string) => void;
  onContinue: () => void;
  disabled?: boolean;
}

const INTENT_OPTIONS: Array<{
  id: CareerIntentType;
  title: string;
  badge: string;
  description: string;
  icon: typeof Target;
}> = [
  {
    id: 'career_decided',
    title: 'I have a Goal Role in Mind',
    badge: 'Destination Known',
    description:
      'I know what I want to become (e.g., AI Engineer, Product Manager, Full Stack Dev). Analyze my capability gaps and build my step-by-step learning roadmap.',
    icon: Target,
  },
  {
    id: 'career_exploring',
    title: "I'm Exploring Careers",
    badge: 'Interest-Driven Explorer',
    description:
      "I'm unsure which career direction fits me best. Help me explore viable paths based on my interests, strengths, and background.",
    icon: Compass,
  },
];

export const IntentSelector: React.FC<IntentSelectorProps> = ({
  selectedIntent,
  onSelectIntent,
  onContinue,
  disabled = false,
}) => {
  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
          Choose How You Would Like to Begin
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INTENT_OPTIONS.map((option) => {
            const isSelected = selectedIntent === option.id;
            const IconComponent = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectIntent(option.id, option.title)}
                disabled={disabled}
                className={cn(
                  'relative flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none',
                  isSelected
                    ? 'border-[#2552f4] bg-gradient-to-b from-blue-50/70 to-indigo-50/40 shadow-sm ring-2 ring-[#2552f4]/20'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                )}
              >
                {/* Header Row: Icon + Badge + Selection Circle */}
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                        isSelected ? 'bg-[#2552f4] text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      <IconComponent className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                        isSelected
                          ? 'bg-blue-100 text-[#2552f4]'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {option.badge}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center border transition-colors shrink-0',
                      isSelected
                        ? 'border-[#2552f4] bg-[#2552f4] text-white'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-[13.5px] font-bold text-slate-900 tracking-tight leading-snug mb-1">
                  {option.title}
                </h4>

                {/* Description */}
                <p className="text-[12px] text-slate-600 leading-relaxed font-normal mb-1 flex-1">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue Action Button */}
      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none',
            'bg-gradient-to-r from-[#00b4d8] via-[#2552f4] to-[#a825eb]',
            'text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          <span>Continue Journey</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

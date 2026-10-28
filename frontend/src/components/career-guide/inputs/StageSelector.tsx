import React from 'react';
import { cn } from '../../../lib/utils';
import { Check } from 'lucide-react';

interface StageSelectorProps {
  selectedStage: string;
  selectedYear: string;
  onSelectStage: (stageId: string, stageLabel: string) => void;
  onSelectYear: (year: string) => void;
}

const STAGES = [
  {
    id: 'working_pro',
    title: 'Working Professional',
    description: 'Currently in the workforce; seeking career advancement, role elevation, or deeper impact.',
    badge: 'Growth & Advancement',
  },
  {
    id: 'career_switcher',
    title: 'Career Changer / Transition',
    description: 'Looking to pivot from your current role or industry into an exciting new discipline.',
    badge: 'Career Pivot',
  },
  {
    id: 'student',
    title: 'College / University Student',
    description: 'Currently enrolled in an undergraduate or master’s program; building foundations.',
    badge: 'Foundation & Entry',
  },
  {
    id: 'recent_grad',
    title: 'Recent Graduate / Job Seeker',
    description: 'Graduated or transitioning between roles; actively pursuing your next career destination.',
    badge: 'Immediate Search',
  },
];

const GRAD_YEARS = [
  'Immediate (1–2 mos)',
  'Next 3–6 months',
  '6–12 months',
  'Flexible / Exploring',
  '2026 Grad',
  '2027 Grad',
];

export const StageSelector: React.FC<StageSelectorProps> = ({
  selectedStage,
  selectedYear,
  onSelectStage,
  onSelectYear,
}) => {
  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* 1. Stage selection */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
          Select your current stage
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STAGES.map((s) => {
            const isSelected = selectedStage === s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStage(s.id, s.title)}
                className={cn(
                  'relative px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-center cursor-pointer',
                  isSelected
                    ? 'bg-blue-50/80 border-[#2552f4] ring-1 ring-[#2552f4]/20 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
                )}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="font-sans text-[13px] font-semibold text-slate-900 leading-snug tracking-normal">
                    {s.title}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[#2552f4] text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="font-sans text-[11.5px] text-slate-500 leading-snug mt-1">
                  {s.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Target Horizon / Timeline */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
          Target Horizon / Goal Timeline
        </label>
        <div className="flex flex-wrap gap-1.5">
          {GRAD_YEARS.map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => onSelectYear(yr)}
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer',
                  isSelected
                    ? 'bg-[#2552f4] text-white border-[#2552f4] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {yr}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

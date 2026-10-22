import React from 'react';
import { cn } from '../../../lib/utils';
import { GraduationCap, Rocket, BookOpen, Briefcase, Check } from 'lucide-react';

interface StageSelectorProps {
  selectedStage: string;
  selectedYear: string;
  onSelectStage: (stageId: string, stageLabel: string) => void;
  onSelectYear: (year: string) => void;
}

const STAGES = [
  {
    id: 'early_years',
    title: '1st or 2nd Year Student',
    description: 'Exploring foundational tracks, learning core languages, and building starter projects.',
    icon: BookOpen,
    badge: 'Foundation',
  },
  {
    id: 'pre_final',
    title: '3rd Year B.Tech / Pre-Final Year',
    description: 'Preparing for upcoming campus placement drives and summer tech internships.',
    icon: GraduationCap,
    badge: 'High Focus',
  },
  {
    id: 'final_year',
    title: 'Final Year Student (4th Year)',
    description: 'Actively preparing for full-time graduate roles, ATS resumes, and final interviews.',
    icon: Rocket,
    badge: 'Immediate',
  },
  {
    id: 'recent_grad',
    title: 'Recent Graduate / Early Career',
    description: 'Targeting a career transition or seeking entry-level engineering opportunities.',
    icon: Briefcase,
    badge: 'Career Transition',
  },
];

const GRAD_YEARS = ['2026', '2027', '2028', '2029', 'Already Graduated'];

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
            const Icon = s.icon;
            const isSelected = selectedStage === s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStage(s.id, s.title)}
                className={cn(
                  'relative px-3 py-2 sm:py-2.5 rounded-xl border text-left transition-all duration-150 flex items-center gap-2.5 cursor-pointer',
                  isSelected
                    ? 'bg-blue-50/80 border-[#2552f4] ring-1 ring-[#2552f4]/20 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                    isSelected ? 'bg-[#2552f4] text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-[12.5px] font-semibold text-slate-900 leading-snug">
                      {s.title}
                    </h4>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#2552f4] text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {s.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Target Horizon / Timeline */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
          Target Graduation / Placement Year
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

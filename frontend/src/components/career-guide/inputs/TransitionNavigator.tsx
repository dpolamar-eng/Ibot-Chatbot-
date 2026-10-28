import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Briefcase, ArrowRight, Clock, Compass, Check } from 'lucide-react';

export interface TransitionData {
  currentRole: string;
  yearsExperience: string;
  targetRole: string;
  weeklyHours: string;
  isExploringPivot: boolean;
}

interface TransitionNavigatorProps {
  onGeneratePathway: (data: TransitionData) => void;
  onSkipToQa?: () => void;
  disabled?: boolean;
}

const COMMON_CURRENT_ROLES = [
  'QA / SDET / Testing',
  'IT Support / SysAdmin',
  'Data Analyst / BI',
  'Frontend Developer',
  'Backend / Core Java/C++',
  'Business Analyst',
  'Non-Tech / Operations',
];

const EXPERIENCE_LEVELS = [
  { id: '1-2', label: '1–2 Years' },
  { id: '3-5', label: '3–5 Years' },
  { id: '5+', label: '5+ Years' },
];

const TARGET_ROLE_OPTIONS = [
  'AI / Machine Learning Engineer',
  'Full Stack Developer',
  'DevOps & Cloud Engineer',
  'Product Manager',
  'Data Engineer',
];

const STUDY_BANDWIDTH_OPTIONS = [
  { id: '5-10', label: '5–10 hrs/wk', desc: 'Working Professional' },
  { id: '10-15', label: '10–15 hrs/wk', desc: 'Evenings & Weekends' },
  { id: '15+', label: '15+ hrs/wk', desc: 'Accelerated Transition' },
];

export const TransitionNavigator: React.FC<TransitionNavigatorProps> = ({
  onGeneratePathway,
  onSkipToQa,
  disabled = false,
}) => {
  const [currentRole, setCurrentRole] = useState('QA / SDET / Testing');
  const [customCurrentRole, setCustomCurrentRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState('3–5 Years');
  const [targetRole, setTargetRole] = useState('AI / Machine Learning Engineer');
  const [customTargetRole, setCustomTargetRole] = useState('');
  const [isExploringPivot, setIsExploringPivot] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState('5–10 hrs/wk');

  const effectiveCurrentRole = customCurrentRole.trim() || currentRole;
  const effectiveTargetRole = isExploringPivot
    ? 'Recommend best pivot roles based on my background'
    : customTargetRole.trim() || targetRole;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGeneratePathway({
      currentRole: effectiveCurrentRole,
      yearsExperience,
      targetRole: effectiveTargetRole,
      weeklyHours,
      isExploringPivot,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border border-slate-200/90 shadow-xs space-y-3.5">
        
        {/* Section Header */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#2552f4] flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
              Career Transition Navigator
            </h4>
            <p className="text-[11px] text-slate-500">
              Personalized 4-pillar blueprint for working professionals moving into a new domain
            </p>
          </div>
        </div>

        {/* 1. Current Role & Experience */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            1. Your Current Role / Domain
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_CURRENT_ROLES.map((role) => {
              const isSelected = currentRole === role && !customCurrentRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setCurrentRole(role);
                    setCustomCurrentRole('');
                  }}
                  className={cn(
                    'text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer',
                    isSelected
                      ? 'border-[#2552f4] bg-blue-50 text-[#2552f4] font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  )}
                >
                  {role}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Or type your exact job role (e.g., Salesforce Admin, Mainframe Engineer)..."
            value={customCurrentRole}
            onChange={(e) => setCustomCurrentRole(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2552f4] focus:ring-1 focus:ring-[#2552f4]/30 bg-white"
          />

          {/* Years of Experience */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-slate-500">Experience:</span>
            <div className="flex gap-1.5">
              {EXPERIENCE_LEVELS.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => setYearsExperience(exp.label)}
                  className={cn(
                    'text-[10.5px] px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer',
                    yearsExperience === exp.label
                      ? 'border-[#2552f4] bg-[#2552f4] text-white font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Target Role / Direction */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              2. Target Role (Where You Want to Transition)
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TARGET_ROLE_OPTIONS.map((tRole) => {
              const isSelected = !isExploringPivot && targetRole === tRole && !customTargetRole;
              return (
                <button
                  key={tRole}
                  type="button"
                  onClick={() => {
                    setTargetRole(tRole);
                    setIsExploringPivot(false);
                    setCustomTargetRole('');
                  }}
                  className={cn(
                    'text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                  <span>{tRole}</span>
                </button>
              );
            })}

            {/* Option to recommend pivot paths */}
            <button
              type="button"
              onClick={() => {
                setIsExploringPivot(true);
                setCustomTargetRole('');
              }}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1',
                isExploringPivot
                  ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold shadow-xs'
                  : 'border-purple-200/80 bg-purple-50/40 text-purple-700 hover:bg-purple-50'
              )}
            >
              <Compass className="w-3 h-3 text-purple-600" />
              <span>🧭 Recommend best pivot roles for me</span>
            </button>
          </div>

          {!isExploringPivot && (
            <input
              type="text"
              placeholder="Or specify custom target role..."
              value={customTargetRole}
              onChange={(e) => setCustomTargetRole(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 bg-white"
            />
          )}
        </div>

        {/* 3. Learning Bandwidth */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>3. Available Study Bandwidth</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STUDY_BANDWIDTH_OPTIONS.map((opt) => {
              const isSelected = weeklyHours === opt.label;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWeeklyHours(opt.label)}
                  className={cn(
                    'p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col',
                    isSelected
                      ? 'border-[#2552f4] bg-blue-50/60 ring-1 ring-[#2552f4]/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <span className={cn('text-[11.5px] font-bold', isSelected ? 'text-[#2552f4]' : 'text-slate-800')}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
          {onSkipToQa ? (
            <button
              type="button"
              onClick={onSkipToQa}
              className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Ask an open-ended career question instead →
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={disabled}
            className={cn(
              'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none',
              'bg-gradient-to-r from-[#00b4d8] via-[#2552f4] to-[#a825eb]',
              'text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]'
            )}
          >
            <span>Generate Transition Blueprint</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </form>
  );
};

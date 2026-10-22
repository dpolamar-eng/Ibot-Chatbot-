import React from 'react';
import { cn } from '../../../lib/utils';
import { Target, Check } from 'lucide-react';
import { CareerGoals } from '../../../types/careerDiscovery';

interface GoalSelectorProps {
  value: CareerGoals;
  onChange: (value: CareerGoals) => void;
}

const TARGET_ROLES = [
  'Applied AI / ML Engineer',
  'Software Development Engineer',
  'Product Manager / Tech Lead',
  'Financial / Investment Analyst',
  'Data & Business Intelligence Analyst',
  'Marketing & Growth Specialist',
  'Operations & Supply Chain Lead',
  'Exploring Viable Roles (Career Exploring)',
];

const PRIORITIES = [
  {
    id: 'capability_gap',
    title: 'Bridging Capability Gaps',
    desc: 'Mastering the critical tools, technologies, and methodologies required for target role.',
  },
  {
    id: 'career_exploration',
    title: 'Exploring & Comparing Paths',
    desc: 'Analyzing high-growth industry directions that fit my background, strengths, and goals.',
  },
  {
    id: 'proof_of_work',
    title: 'Building Proof of Capability',
    desc: 'Creating tangible projects, portfolio evidence, or case studies to demonstrate readiness.',
  },
  {
    id: 'career_pivot',
    title: 'Navigating a Career Pivot',
    desc: 'Translating existing professional strengths into a successful transition to a new domain.',
  },
];

const TIMELINES = [
  'Immediate (Next 30–60 days)',
  'Near Term (3–6 months)',
  'Within 1 Year (6–12 months)',
  'Exploratory / Long-Term',
];

export const GoalSelector: React.FC<GoalSelectorProps> = ({
  value,
  onChange,
}) => {
  const handleToggleRole = (role: string) => {
    const exists = value.targetRoles.includes(role);
    const updated = exists
      ? value.targetRoles.filter((r) => r !== role)
      : [...value.targetRoles, role];
    onChange({ ...value, targetRoles: updated });
  };

  const handleSelectPriority = (pId: string) => {
    onChange({ ...value, topPriority: pId });
  };

  const handleSelectTimeline = (t: string) => {
    onChange({ ...value, timeline: t });
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* 1. Target Roles */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Desired Job Roles (Select 1 or more)
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            {value.targetRoles.length} selected
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {TARGET_ROLES.map((role) => {
            const isSelected = value.targetRoles.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleToggleRole(role)}
                className={cn(
                  'px-3 py-1.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer',
                  isSelected
                    ? 'bg-blue-50/70 border-[#2552f4] text-[#1e3bb3] font-semibold ring-1 ring-[#2552f4]/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span className="truncate">{role}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#2552f4] shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Primary Development Priority */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
          What is your #1 Development Priority Right Now?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRIORITIES.map((p) => {
            const isSelected = value.topPriority === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPriority(p.id)}
                className={cn(
                  'px-3 py-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-bold block truncate">{p.title}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5] shrink-0" />}
                </div>
                <p
                  className={cn(
                    'text-[10.5px] leading-tight truncate',
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  )}
                >
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Timeline */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
          Placement / Goal Timeline
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TIMELINES.map((t) => {
            const isSelected = value.timeline === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleSelectTimeline(t)}
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer',
                  isSelected
                    ? 'bg-[#2552f4] text-white border-[#2552f4] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

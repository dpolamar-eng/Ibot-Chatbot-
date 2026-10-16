import React from 'react';
import { cn } from '../../../lib/utils';
import { Target, Check } from 'lucide-react';
import { CareerGoals } from '../../../types/careerDiscovery';

interface GoalSelectorProps {
  value: CareerGoals;
  onChange: (value: CareerGoals) => void;
}

const TARGET_ROLES = [
  'Software Development Engineer (SDE-1)',
  'Full-Stack Developer',
  'Backend Engineer (Python / Go / Java)',
  'Frontend Engineer (React / TypeScript)',
  'Data Analyst / BI Specialist',
  'Associate AI / Machine Learning Engineer',
  'Cloud & DevOps Engineer',
  'Open to General Tech Roles',
];

const PRIORITIES = [
  {
    id: 'dsa_interviews',
    title: 'Mastering DSA & Coding Interviews',
    desc: 'LeetCode patterns, two-pointers, graphs, DP to pass technical OA rounds.',
  },
  {
    id: 'production_projects',
    title: 'Building 2 High-Yield Projects',
    desc: 'Deploying end-to-end full-stack or ML systems with Docker and live demos.',
  },
  {
    id: 'resume_ats',
    title: 'ATS Resume Review & Bullet Points',
    desc: 'Restructuring profile and metrics to pass corporate ATS scanner algorithms.',
  },
  {
    id: 'track_clarity',
    title: 'Clarifying Which Tech Track to Pick',
    desc: 'Understanding industry demand and matching with personal aptitude.',
  },
];

const TIMELINES = [
  'Immediate (Next 30–60 days)',
  'This Semester (3–6 months)',
  'Next Academic Year (6–12 months)',
  'Long-Term Horizon',
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
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Target Roles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Desired Job Roles (Select 1 or more)
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            {value.targetRoles.length} selected
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TARGET_ROLES.map((role) => {
            const isSelected = value.targetRoles.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleToggleRole(role)}
                className={cn(
                  'px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer',
                  isSelected
                    ? 'bg-blue-50/70 border-[#2552f4] text-[#1e3bb3] font-semibold ring-1 ring-[#2552f4]/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span>{role}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#2552f4]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Primary Development Priority */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          What is your #1 Development Priority Right Now?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PRIORITIES.map((p) => {
            const isSelected = value.topPriority === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPriority(p.id)}
                className={cn(
                  'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold block">{p.title}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />}
                </div>
                <p
                  className={cn(
                    'text-[11px] leading-snug',
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
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Placement / Goal Timeline
        </label>
        <div className="flex flex-wrap gap-2">
          {TIMELINES.map((t) => {
            const isSelected = value.timeline === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleSelectTimeline(t)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
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

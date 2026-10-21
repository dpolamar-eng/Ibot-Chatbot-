import React from 'react';
import { cn } from '../../../lib/utils';
import { Check } from 'lucide-react';
import { EducationInfo } from '../../../types/careerDiscovery';

interface EducationSelectorProps {
  value: EducationInfo;
  onChange: (value: EducationInfo) => void;
}

const MAJORS = [
  'Computer Science / Software',
  'Commerce, Finance & Accounting',
  'Business Administration & Management',
  'Data Science & Mathematics',
  'Engineering (Electronics / Mech / Civil)',
  'Humanities, Social Sciences & Arts',
  'Healthcare & Biological Sciences',
  'Self-Taught / Direct Experience',
];

const CORE_SUBJECTS = [
  'Data & Quantitative Analysis',
  'Software Architecture & Principles',
  'Financial Modeling & Economics',
  'Business Strategy & Marketing',
  'Project & Operations Management',
  'Database Management & SQL',
  'User Experience & Design Thinking',
  'Critical Problem Solving',
];

export const EducationSelector: React.FC<EducationSelectorProps> = ({
  value,
  onChange,
}) => {
  const handleSelectMajor = (major: string) => {
    onChange({ ...value, field: major });
  };

  const handleToggleSubject = (subject: string) => {
    const exists = value.academicFocus.includes(subject);
    const updated = exists
      ? value.academicFocus.filter((s) => s !== subject)
      : [...value.academicFocus, subject];
    onChange({ ...value, academicFocus: updated });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Field of Study / Major */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Primary Field of Study / Major
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MAJORS.map((m) => {
            const isSelected = value.field === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleSelectMajor(m)}
                className={cn(
                  'px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer',
                  isSelected
                    ? 'bg-blue-50/70 border-[#2552f4] text-[#1e3bb3] font-semibold ring-1 ring-[#2552f4]/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span>{m}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#2552f4]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Core Academic Foundations */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Key Academic Foundations Covered
          </label>
          <span className="text-[11px] text-slate-500">Select all that apply</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CORE_SUBJECTS.map((sub) => {
            const isSelected = value.academicFocus.includes(sub);
            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleToggleSubject(sub)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5',
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />}
                <span>{sub}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

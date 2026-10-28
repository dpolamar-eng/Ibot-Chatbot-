import React from 'react';
import { cn } from '../../../lib/utils';
import { Check } from 'lucide-react';
import { CareerInterests } from '../../../types/careerDiscovery';

interface InterestSelectorProps {
  value: CareerInterests;
  onChange: (value: CareerInterests) => void;
}

const PROBLEM_SPACES = [
  {
    id: 'ai_tech',
    title: 'Applied AI & Tech Systems',
    description: 'Software engineering, AI automation, cloud platforms & scalable digital products.',
  },
  {
    id: 'finance_analytics',
    title: 'Finance & Business Analytics',
    description: 'Financial analysis, quantitative modeling, metrics dashboards & market economics.',
  },
  {
    id: 'product_growth',
    title: 'Product Strategy & Growth',
    description: 'Roadmapping, customer discovery, market positioning & user adoption.',
  },
  {
    id: 'ops_systems',
    title: 'Operations & Process Scale',
    description: 'Workflow efficiency, supply chain, cross-functional execution & organizational scale.',
  },
  {
    id: 'creative_media',
    title: 'Design, UX & Creative Media',
    description: 'User experience research, interface design, brand storytelling & content strategy.',
  },
];

const ENVIRONMENTS = [
  { id: 'startups', label: 'High-Growth Startup', desc: 'Broad ownership, high speed, dynamic impact' },
  { id: 'enterprise', label: 'Established Enterprise', desc: 'Structured scale, strong mentorship, global reach' },
  { id: 'remote_flexible', label: 'Remote-First / Flexible', desc: 'High autonomy, outcome-focused environment' },
  { id: 'open', label: 'Open to All Environments', desc: 'Prioritizing team alignment and career growth' },
];

export const InterestSelector: React.FC<InterestSelectorProps> = ({
  value,
  onChange,
}) => {
  const handleToggleTrack = (trackId: string) => {
    const exists = value.primaryTracks.includes(trackId);
    const updated = exists
      ? value.primaryTracks.filter((t) => t !== trackId)
      : [...value.primaryTracks, trackId];
    onChange({ ...value, primaryTracks: updated });
  };

  const handleSelectEnv = (envId: string) => {
    onChange({ ...value, workEnvironment: envId });
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* 1. Problem Spaces */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Which problem spaces excite you? (Select 1 to 3)
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            {value.primaryTracks.length} selected
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROBLEM_SPACES.map((space) => {
            const isSelected = value.primaryTracks.includes(space.id);

            return (
              <button
                key={space.id}
                type="button"
                onClick={() => handleToggleTrack(space.id)}
                className={cn(
                  'px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-center cursor-pointer',
                  isSelected
                    ? 'bg-blue-50/80 border-[#2552f4] ring-1 ring-[#2552f4]/20 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
                )}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="font-sans text-xs font-bold text-slate-900 truncate">{space.title}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#2552f4] stroke-[2.5] shrink-0" />}
                </div>
                <p className="font-sans text-[10.5px] text-slate-500 leading-snug mt-1">
                  {space.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Work Environment */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
          Preferred Engineering Environment
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {ENVIRONMENTS.map((env) => {
            const isSelected = value.workEnvironment === env.id;
            return (
              <button
                key={env.id}
                type="button"
                onClick={() => handleSelectEnv(env.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between',
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div>
                  <span className="text-xs font-semibold block">{env.label}</span>
                  <span
                    className={cn(
                      'text-[10.5px] block',
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    )}
                  >
                    {env.desc}
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

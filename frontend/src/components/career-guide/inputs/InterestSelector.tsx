import React from 'react';
import { cn } from '../../../lib/utils';
import { Code, Cpu, Database, Cloud, Smartphone, Check } from 'lucide-react';
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
    icon: Cpu,
  },
  {
    id: 'finance_analytics',
    title: 'Finance & Business Analytics',
    description: 'Financial analysis, quantitative modeling, metrics dashboards & market economics.',
    icon: Database,
  },
  {
    id: 'product_growth',
    title: 'Product Strategy & Growth',
    description: 'Roadmapping, customer discovery, market positioning & user adoption.',
    icon: Code,
  },
  {
    id: 'ops_systems',
    title: 'Operations & Process Scale',
    description: 'Workflow efficiency, supply chain, cross-functional execution & organizational scale.',
    icon: Cloud,
  },
  {
    id: 'creative_media',
    title: 'Design, UX & Creative Media',
    description: 'User experience research, interface design, brand storytelling & content strategy.',
    icon: Smartphone,
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
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Problem Spaces */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Which problem spaces excite you? (Select 1 to 3)
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            {value.primaryTracks.length} selected
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROBLEM_SPACES.map((space) => {
            const Icon = space.icon;
            const isSelected = value.primaryTracks.includes(space.id);

            return (
              <button
                key={space.id}
                type="button"
                onClick={() => handleToggleTrack(space.id)}
                className={cn(
                  'p-3.5 rounded-xl border text-left transition-all duration-180 flex items-start gap-3 cursor-pointer',
                  isSelected
                    ? 'bg-blue-50/80 border-[#2552f4] ring-1 ring-[#2552f4]/20 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    isSelected ? 'bg-[#2552f4] text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{space.title}</h4>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2552f4] stroke-[2.5]" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {space.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Work Environment */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Preferred Engineering Environment
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ENVIRONMENTS.map((env) => {
            const isSelected = value.workEnvironment === env.id;
            return (
              <button
                key={env.id}
                type="button"
                onClick={() => handleSelectEnv(env.id)}
                className={cn(
                  'px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between',
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

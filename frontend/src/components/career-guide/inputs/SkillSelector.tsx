import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Search, Plus, X, Check, Sparkles } from 'lucide-react';
import { SkillItem, SkillProficiency } from '../../../types/careerDiscovery';
import { COMMON_SKILLS_CATALOG } from '../../../mock/careerDiscoveryDefaults';

interface SkillSelectorProps {
  selectedSkills: SkillItem[];
  onChange: (skills: SkillItem[]) => void;
}

type NonNullSkillProficiency = NonNullable<SkillProficiency>;

const PROFICIENCY_LABELS: Record<NonNullSkillProficiency, { label: string; color: string }> = {
  exploring: { label: 'Exploring', color: 'bg-slate-100 text-slate-700' },
  practicing: { label: 'Hands-on', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  proficient: { label: 'Proficient', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkills,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredCatalog = COMMON_SKILLS_CATALOG.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const isSelected = (name: string) => selectedSkills.some((s) => s.name.toLowerCase() === name.toLowerCase());

  const handleToggleSkill = (name: string, category: SkillItem['category']) => {
    const existing = selectedSkills.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      onChange(selectedSkills.filter((s) => s.name.toLowerCase() !== name.toLowerCase()));
    } else {
      onChange([
        ...selectedSkills,
        {
          id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          category,
          proficiency: 'practicing',
        },
      ]);
    }
  };

  const handleCycleProficiency = (skillName: string) => {
    const nextProf: Record<NonNullSkillProficiency, NonNullSkillProficiency> = {
      exploring: 'practicing',
      practicing: 'proficient',
      proficient: 'exploring',
    };

    onChange(
      selectedSkills.map((s) => {
        if (s.name.toLowerCase() === skillName.toLowerCase()) {
          const current = s.proficiency || 'exploring';
          return { ...s, proficiency: nextProf[current] };
        }
        return s;
      })
    );
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed || isSelected(trimmed)) return;

    onChange([
      ...selectedSkills,
      {
        id: `custom-${Date.now()}`,
        name: trimmed,
        category: 'other',
        proficiency: 'practicing',
      },
    ]);
    setCustomInput('');
  };

  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* Context note regarding self-reported data */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-slate-600">
        <Sparkles className="w-3.5 h-3.5 text-[#2552f4] shrink-0 mt-0.5" />
        <p className="leading-snug">
          Select skills, tools, domain competencies, or specialized capabilities you work with or know best. Click any selected skill badge to adjust your comfort level.
        </p>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills (e.g., Python, React, Docker)..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:border-[#2552f4] focus:ring-1 focus:ring-[#2552f4]/20 transition-all"
          />
        </div>

        {/* Custom skill adder */}
        <form onSubmit={handleAddCustomSkill} className="flex gap-1.5">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add other skill..."
            className="w-36 px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:border-[#2552f4] transition-all"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Selected Skills Chips with Proficiency badge */}
      {selectedSkills.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Selected Skills ({selectedSkills.length}) • Click badge to adjust level
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((s) => {
              const prof = s.proficiency
                ? PROFICIENCY_LABELS[s.proficiency]
                : { label: 'Unspecified', color: 'bg-slate-50 text-slate-600 border-slate-200' };
              return (
                <div
                  key={s.id}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-white border border-slate-200/90 text-xs text-slate-800 shadow-2xs group"
                >
                  <span className="font-medium">{s.name}</span>
                  <button
                    type="button"
                    onClick={() => handleCycleProficiency(s.name)}
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer transition-all hover:scale-105',
                      prof.color
                    )}
                    title="Click to cycle level: Exploring → Built Projects → Proficient"
                  >
                    {prof.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSkill(s.name, s.category)}
                    className="p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Remove skill"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Skills Cloud */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Suggestions from Tech Stack Catalog
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredCatalog.map((item) => {
            const active = isSelected(item.name);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggleSkill(item.name, item.category)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5',
                  active
                    ? 'bg-[#2552f4] text-white border-[#2552f4] shadow-2xs font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {active ? (
                  <Check className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <Plus className="w-3 h-3 text-slate-400" />
                )}
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

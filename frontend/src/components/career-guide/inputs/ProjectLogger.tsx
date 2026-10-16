import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Plus, Trash2, FolderGit2, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { ProjectEntry } from '../../../types/careerDiscovery';

interface ProjectLoggerProps {
  projects: ProjectEntry[];
  onChange: (projects: ProjectEntry[]) => void;
  onSkip?: () => void;
}

export const ProjectLogger: React.FC<ProjectLoggerProps> = ({
  projects,
  onChange,
  onSkip,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [outcome, setOutcome] = useState('');

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const stackList = techStackInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newProject: ProjectEntry = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      techStack: stackList.length > 0 ? stackList : ['Python', 'Web Dev'],
      outcome: outcome.trim() || undefined,
    };

    onChange([...projects, newProject]);
    setTitle('');
    setDescription('');
    setTechStackInput('');
    setOutcome('');
    setIsAdding(false);
  };

  const handleRemoveProject = (id: string) => {
    onChange(projects.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Context info banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <FolderGit2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p leading-normal>
          Projects, internships, or capstone deliverables help identify practical readiness.
          If you are still learning fundamentals and don&apos;t have projects yet, you can skip this section!
        </p>
      </div>

      {/* Logged Projects List */}
      {projects.length > 0 && (
        <div className="space-y-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                  {proj.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProject(proj.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Stack pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Stack:
                </span>
                {proj.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium"
                  >
                    {tech}
                  </span>
                ))}
                {proj.outcome && (
                  <span className="text-[11px] text-emerald-700 ml-auto font-medium">
                    ✓ {proj.outcome}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Form (Collapsible) */}
      {isAdding ? (
        <form
          onSubmit={handleAddProject}
          className="p-4 rounded-xl bg-white border border-[#2552f4] ring-2 ring-[#2552f4]/15 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Add Project / Practical Work
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., E-Commerce REST API with FastAPI & Redis"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-[#2552f4]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Brief Overview / What you built
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Built authentication, product search, and async background email tasks..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-[#2552f4] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Technologies (comma separated)
              </label>
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="Python, FastAPI, Docker, PostgreSQL"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-[#2552f4]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Measurable Impact / Outcome (optional)
              </label>
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g., Handled 500 requests/sec, Deployed live"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-[#2552f4]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 bg-[#2552f4] hover:bg-[#1e3bb3] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              Save Project
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-[#2552f4] hover:text-[#2552f4] text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#2552f4]" />
            <span>Add a Project or Internship</span>
          </button>

          {/* Explicit Skip option for optional questions */}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium underline-offset-4 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Skip for now (I don&apos;t have projects yet)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

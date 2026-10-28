import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { AssistantAvatar } from './AssistantAvatar';
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  ChevronRight,
  Mail,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { type ChatMessage } from './mockCareerChatData';
import { type SectionAnalysis } from '../../types/careerDiscovery';
import { EmailPrompt } from './inputs/EmailPrompt';
import { IntentSelector, type CareerIntentType } from './inputs/IntentSelector';
import { TransitionNavigator } from './inputs/TransitionNavigator';
import { StageSelector } from './inputs/StageSelector';
import { EducationSelector } from './inputs/EducationSelector';
import { SkillSelector } from './inputs/SkillSelector';
import { ProjectLogger } from './inputs/ProjectLogger';
import { InterestSelector } from './inputs/InterestSelector';
import { GoalSelector } from './inputs/GoalSelector';
import { DEMO_RECOMMENDATIONS } from '../../mock/careerDiscoveryDefaults';

interface MessageBubbleProps {
  message: ChatMessage;
  className?: string;
  isIntroWaving?: boolean;
  onSelectFollowup?: (question: string) => void;
  onSubmitInteractiveAnswer?: (stepIndex: number, formattedAnswerText: string, stepData: any) => void;
  onReopenStep?: (stepIndex: number) => void;
  onPreviousStep?: () => void;
  onConfirmProfile?: () => void;
  canGoBack?: boolean;
  disabled?: boolean;
  profile?: any;
  onEditUserMessage?: (messageId: string, newText: string, stepIndex?: number) => void;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  parentFollowupQuestions?: string[];
  isOptionsDisabled?: boolean;
  selectedOption?: string;
  isResponseBeingEdited?: boolean;
  sectionAnalyses?: Record<string, SectionAnalysis>;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  className,
  isIntroWaving = false,
  onSelectFollowup,
  onSubmitInteractiveAnswer,
  onReopenStep,
  onPreviousStep,
  onConfirmProfile,
  onEditUserMessage,
  isEditing: isEditingProp,
  onStartEdit,
  onCancelEdit,
  parentFollowupQuestions,
  isOptionsDisabled = false,
  selectedOption,
  isResponseBeingEdited = false,
  canGoBack = false,
  disabled = false,
  profile,
  sectionAnalyses = {},
}) => {
  const isAssistant = message.sender === 'assistant';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [internalEditing, setInternalEditing] = useState(false);
  const isEditing = isEditingProp !== undefined ? isEditingProp : internalEditing;
  const [editText, setEditText] = useState(message.text || '');

  useEffect(() => {
    setEditText(message.text || '');
  }, [message.text]);

  useEffect(() => {
    return () => {
      if (isSpeaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !message.text) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown formatting for clear voice pronunciation
    const cleanText = message.text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/•/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    // Prioritize natural Google US English voice if available
    const voices = window.speechSynthesis.getVoices();
    const googleVoice =
      voices.find((v) => v.name.includes('Google') && (v.lang === 'en-US' || v.lang.startsWith('en'))) ||
      voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en'));

    if (googleVoice) {
      utterance.voice = googleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Local state for interactive step input before confirming
  const [selectedIntent, setSelectedIntent] = useState<CareerIntentType>('career_decided');
  const [stageId, setStageId] = useState('working_pro');
  const [stageLabel, setStageLabel] = useState('Working Professional');
  const [gradYear, setGradYear] = useState('Immediate (1–2 mos)');

  const [education, setEducation] = useState({
    degree: 'B.Tech',
    field: 'Computer Science & Engineering',
    academicFocus: ['Data Structures & Algorithms', 'Database Management (DBMS / SQL)'],
    graduationYear: '2026',
  });

  const [skills, setSkills] = useState<any[]>([
    { id: 'sk-1', name: 'Python', category: 'core', proficiency: 'practicing' },
    { id: 'sk-2', name: 'React', category: 'frontend', proficiency: 'practicing' },
    { id: 'sk-3', name: 'SQL', category: 'core', proficiency: 'practicing' },
  ]);

  const [projects, setProjects] = useState<any[]>([]);

  const [interests, setInterests] = useState<{
    primaryTracks: string[];
    workEnvironment: string;
    preferredDomains: string[];
  }>({
    primaryTracks: ['web_systems'],
    workEnvironment: 'startups',
    preferredDomains: [],
  });

  const [goals, setGoals] = useState({
    targetRoles: ['Software Development Engineer (SDE-1)'],
    topPriority: 'dsa_interviews',
    timeline: 'Immediate (Next 30–60 days)',
  });

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmStep = () => {
    if (!message.stepIndex || !onSubmitInteractiveAnswer) return;

    if (message.inputType === 'intent_select') {
      const label =
        selectedIntent === 'career_decided'
          ? 'I have a Goal Role in Mind (Target Destination Known)'
          : "I'm Exploring Careers (Interest-Driven Exploration)";
      onSubmitInteractiveAnswer(message.stepIndex, `Selected Track: ${label}`, { careerIntent: selectedIntent });
    } else if (message.inputType === 'stage_select') {
      const summary = `I am currently in ${stageLabel}, targeting timeline of ${gradYear}.`;
      onSubmitInteractiveAnswer(message.stepIndex, summary, { stageId, stageLabel, gradYear });
    } else if (message.inputType === 'education_select') {
      const focusText = education.academicFocus.length > 0 ? ` with focus in ${education.academicFocus.join(', ')}` : '';
      const summary = `My educational background is ${education.degree ? `${education.degree} in ` : ''}${education.field}${focusText}.`;
      onSubmitInteractiveAnswer(message.stepIndex, summary, { education });
    } else if (message.inputType === 'skills_select') {
      const skillNames = skills.map((s) => s.name).join(', ');
      const summary = `My capabilities and skills include: ${skillNames || 'Python, SQL'}.`;
      onSubmitInteractiveAnswer(message.stepIndex, summary, { skills });
    } else if (message.inputType === 'projects_entry') {
      const projTitles = projects.map((p) => p.title).join(', ');
      const summary = projects.length > 0
        ? `My practical accomplishments and projects include: ${projTitles}.`
        : `I don't have practical projects yet; focusing on building core capabilities.`;
      onSubmitInteractiveAnswer(message.stepIndex, summary, { projects });
    } else if (message.inputType === 'interests_select') {
      const summary = `I am interested in ${interests.primaryTracks.join(', ')} in a ${interests.workEnvironment} work environment.`;
      onSubmitInteractiveAnswer(message.stepIndex, summary, { interests });
    } else if (message.inputType === 'goals_select') {
      const summary = `My target role is ${goals.targetRoles.join(', ')} with priority on ${goals.topPriority}.`;
      onSubmitInteractiveAnswer(message.stepIndex, summary, { goals });
    }
  };

  const handleSkipStep = () => {
    if (!message.stepIndex || !onSubmitInteractiveAnswer) return;
    const summary = `Skipped project details for now; focusing on core capabilities.`;
    onSubmitInteractiveAnswer(message.stepIndex, summary, { skipped: true });
  };

  return (
    <div
      id={`msg-${message.id}`}
      data-message-id={message.id}
      className={cn(
        'group flex w-full mb-4 animate-in fade-in duration-200',
        isAssistant ? 'justify-start items-start gap-3' : 'justify-end items-end',
        className
      )}
    >
      {/* Bot avatar only for assistant messages */}
      {isAssistant && (
        <div className="pt-0.5 shrink-0">
          <AssistantAvatar size="md" isIntroWaving={isIntroWaving} />
        </div>
      )}

      {/* Bubble Column */}
      <div
        className={cn(
          'flex flex-col',
          isAssistant ? 'items-start w-full max-w-[96%] sm:max-w-[94%]' : 'items-end max-w-[82%]'
        )}
      >
        <div
          className={cn(
            'relative px-5 py-3.5 text-[14px] sm:text-[14.5px] leading-[1.45] tracking-[-0.005em] transition-all w-full',
            isAssistant
              ? 'bg-gradient-to-b from-white via-white to-slate-50/90 text-slate-800 rounded-[22px] rounded-tl-[8px] border border-slate-200/90 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]'
              : 'bg-gradient-to-r from-[#032836] via-[#0c1a4e] to-[#380a54] text-white rounded-[22px] rounded-br-[8px] font-normal shadow-[0_4px_16px_rgba(12,26,78,0.35)] border border-white/10'
          )}
        >
          {/* Step header pill if part of guided walkthrough */}
          {isAssistant && message.stepTitle && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px] font-semibold text-[#2552f4]">
              <span className="uppercase tracking-wider">
                {message.stepTitle}
              </span>
              {message.isCompletedStep && (
                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  Completed
                </span>
              )}
            </div>
          )}

          {/* Attached File Preview inside Message Bubble */}
          {message.attachedFile && (
            <div
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl mb-2 text-xs font-medium',
                isAssistant
                  ? 'bg-blue-50/60 border border-blue-200/60 text-slate-800'
                  : 'bg-white/15 border border-white/25 text-white'
              )}
            >
              <FileText className="w-4 h-4 shrink-0 text-current" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold truncate">{message.attachedFile.name}</span>
                <span className="opacity-80 text-[10.5px]">{message.attachedFile.size}</span>
              </div>
            </div>
          )}

          {/* If user is editing their response */}
          {!isAssistant && isEditing ? (
            <div className="w-full space-y-2.5 my-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (editText.trim().length > 0) {
                      onEditUserMessage?.(message.id, editText.trim(), message.stepIndex);
                      onCancelEdit?.();
                      setInternalEditing(false);
                    }
                  } else if (e.key === 'Escape') {
                    setEditText(message.text || '');
                    onCancelEdit?.();
                    setInternalEditing(false);
                  }
                }}
                className="w-full min-w-[220px] sm:min-w-[280px] bg-black/40 text-white text-[14px] p-2.5 rounded-xl border border-cyan-400/60 outline-none focus:ring-2 focus:ring-cyan-400/30 resize-none font-normal leading-relaxed placeholder-slate-400"
                rows={Math.max(2, Math.min(6, editText.split('\n').length))}
                autoFocus
                placeholder="Edit your response..."
              />

              {/* Quick option switcher if user answered an option from the prompt */}
              {parentFollowupQuestions && parentFollowupQuestions.length > 0 && (
                <div className="pt-2 border-t border-white/15 space-y-1.5">
                  <div className="text-[11px] text-cyan-200 font-semibold flex items-center gap-1.5">
                    <span>Or switch to an option from this prompt:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parentFollowupQuestions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setEditText(opt);
                          onEditUserMessage?.(message.id, opt, message.stepIndex);
                          onCancelEdit?.();
                          setInternalEditing(false);
                        }}
                        className={cn(
                          'text-[11.5px] px-2.5 py-1 rounded-full border transition-all cursor-pointer text-left flex items-center gap-1.5',
                          opt === editText || opt === message.text
                            ? 'bg-cyan-400 text-slate-900 border-cyan-300 font-bold shadow-xs'
                            : 'bg-white/15 text-white border-white/20 hover:bg-white/25 hover:border-white/40'
                        )}
                      >
                        {(opt === editText || opt === message.text) && (
                          <Check className="w-3 h-3 stroke-[3]" />
                        )}
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                {message.stepIndex !== undefined && onReopenStep && (
                  <button
                    type="button"
                    onClick={() => {
                      onCancelEdit?.();
                      setInternalEditing(false);
                      onReopenStep(message.stepIndex!);
                    }}
                    className="text-[11.5px] text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
                  >
                    Reopen option selector
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditText(message.text || '');
                      onCancelEdit?.();
                      setInternalEditing(false);
                    }}
                    className="px-2.5 py-1 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editText.trim().length === 0) return;
                      onEditUserMessage?.(message.id, editText.trim(), message.stepIndex);
                      onCancelEdit?.();
                      setInternalEditing(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Update</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Formatted Message Text Content */
            message.text && (
              <div className="space-y-2">
                {message.text.split('\n\n').map((paragraph, idx) => {
                  const trimmedParagraph = paragraph.trim();
                  if (!trimmedParagraph) return null;

                  // 1. Check if the paragraph is a Markdown Table
                  const tableLines = trimmedParagraph.split('\n').map((l) => l.trim()).filter(Boolean);
                  const isTable =
                    tableLines.length >= 2 &&
                    tableLines.every((l) => l.startsWith('|') && l.endsWith('|')) &&
                    tableLines.some((l) => /^\|(\s*:?-+:?\s*\|)+$/.test(l));

                  if (isTable) {
                    const headerLine = tableLines[0];
                    const rowLines = tableLines.slice(1).filter((l) => !/^\|(\s*:?-+:?\s*\|)+$/.test(l));
                    const parseCells = (line: string) =>
                      line
                        .slice(1, -1)
                        .split('|')
                        .map((c) => c.trim());
                    const headers = parseCells(headerLine);
                    const rows = rowLines.map(parseCells);

                    return (
                      <div
                        key={idx}
                        className={cn(
                          'my-2.5 overflow-x-auto rounded-xl border shadow-xs',
                          isAssistant
                            ? 'border-slate-200/90 bg-white'
                            : 'border-white/20 bg-white/10'
                        )}
                      >
                        <table className="min-w-full text-[12.5px] text-left border-collapse">
                          <thead>
                            <tr
                              className={cn(
                                'border-b font-semibold',
                                isAssistant
                                  ? 'bg-slate-50/90 border-slate-200 text-slate-900'
                                  : 'bg-white/15 border-white/20 text-white'
                              )}
                            >
                              {headers.map((h, i) => (
                                <th
                                  key={i}
                                  className="px-3 py-2 border-r border-slate-200/70 last:border-r-0 whitespace-nowrap"
                                >
                                  {formatTextWithCodeAndBold(h, isAssistant)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody
                            className={cn(
                              'divide-y',
                              isAssistant
                                ? 'divide-slate-100 text-slate-700'
                                : 'divide-white/10 text-white/95'
                            )}
                          >
                            {rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className={
                                  isAssistant
                                    ? rIdx % 2 === 1
                                      ? 'bg-slate-50/40'
                                      : 'bg-white'
                                    : rIdx % 2 === 1
                                    ? 'bg-white/5'
                                    : 'transparent'
                                }
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="px-3 py-2 border-r border-slate-100 last:border-r-0 align-top leading-relaxed"
                                  >
                                    {formatTextWithCodeAndBold(cell, isAssistant)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  // 2. Regular paragraph with lines
                  return (
                    <div key={idx} className={idx > 0 ? 'mt-2' : ''}>
                      {paragraph.split('\n').map((line, lIdx) => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return null;

                        // Horizontal divider
                        if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
                          return (
                            <hr
                              key={lIdx}
                              className={cn(
                                'my-2.5 border-t',
                                isAssistant ? 'border-slate-200/80' : 'border-white/20'
                              )}
                            />
                          );
                        }

                        // Heading detection (###, ##, #) -> strip hashtags and render cleanly
                        const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
                        if (headingMatch) {
                          const level = headingMatch[1].length;
                          const headingContent = headingMatch[2];
                          return (
                            <div
                              key={lIdx}
                              className={cn(
                                'font-bold tracking-tight',
                                isAssistant ? 'text-slate-900' : 'text-white',
                                level <= 2
                                  ? 'text-[15.5px] mt-3.5 mb-1.5'
                                  : level === 3
                                  ? 'text-[14.5px] mt-2.5 mb-1'
                                  : 'text-[13.5px] mt-2 mb-0.5'
                              )}
                            >
                              {formatTextWithCodeAndBold(headingContent, isAssistant)}
                            </div>
                          );
                        }

                        // Blockquote detection (> Quote) -> strip > and render callout
                        const quoteMatch = trimmedLine.match(/^>\s*(.*)$/);
                        if (quoteMatch) {
                          return (
                            <blockquote
                              key={lIdx}
                              className={cn(
                                'border-l-3 rounded-r-lg px-3 py-2 my-2 text-[13px] leading-relaxed',
                                isAssistant
                                  ? 'border-[#2552f4] bg-blue-50/60 text-slate-700'
                                  : 'border-cyan-400 bg-white/10 text-white/95'
                              )}
                            >
                              {formatTextWithCodeAndBold(quoteMatch[1], isAssistant)}
                            </blockquote>
                          );
                        }

                        // Ordered list item (e.g. 1. or 1) or (1))
                        const orderedMatch = trimmedLine.match(/^(\(?[0-9]+[\.\)]\s*)(.*)$/);
                        // Bullet list item (e.g. • or - or * or +)
                        const bulletMatch = trimmedLine.match(/^[•\-*+]\s+(.*)$/);
                        const isOrdered = !!orderedMatch;
                        const isBullet = !!bulletMatch || trimmedLine.startsWith('•');

                        return (
                          <div
                            key={lIdx}
                            className={cn(
                              lIdx > 0 ? 'mt-1' : '',
                              (isOrdered || isBullet) ? 'flex items-start gap-2 pl-0.5' : ''
                            )}
                          >
                            {isOrdered && (
                              <span
                                className={cn(
                                  'inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold shrink-0 mt-0.5',
                                  isAssistant
                                    ? 'bg-blue-100/70 text-[#2552f4]'
                                    : 'bg-white/20 text-white'
                                )}
                              >
                                {trimmedLine.match(/[0-9]+/)?.[0]}
                              </span>
                            )}
                            {isBullet && (
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full shrink-0 mt-2',
                                  isAssistant ? 'bg-[#3b59f8]' : 'bg-cyan-300'
                                )}
                              />
                            )}
                            <span className="flex-1">
                              {formatTextWithCodeAndBold(
                                isOrdered
                                  ? orderedMatch![2]
                                  : isBullet
                                  ? bulletMatch ? bulletMatch[1] : trimmedLine.replace(/^•\s*/, '')
                                  : line,
                                isAssistant
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* =========================================================================
              INTERACTIVE ANSWER OPTIONS (Rendered inline inside the conversation stream)
             ========================================================================= */}
          {isAssistant && message.inputType && !message.isCompletedStep && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-200">
              {/* Step 0: Welcome & Optional Email for Job Alerts/Updates */}
              {message.inputType === 'email_prompt' && (
                <EmailPrompt
                  disabled={disabled}
                  onContinue={(email) => {
                    const stepIdx = message.stepIndex !== undefined ? message.stepIndex : 0;
                    onSubmitInteractiveAnswer?.(
                      stepIdx,
                      `📧 Shared email: ${email}`,
                      { email }
                    );
                  }}
                  onSkip={() => {
                    const stepIdx = message.stepIndex !== undefined ? message.stepIndex : 0;
                    onSubmitInteractiveAnswer?.(
                      stepIdx,
                      `Skipped email for now`,
                      { email: null, skipped: true }
                    );
                  }}
                />
              )}

              {/* Step 1: Journey Track Intent Selection */}
              {message.inputType === 'intent_select' && (
                <IntentSelector
                  selectedIntent={selectedIntent}
                  onSelectIntent={(intent) => setSelectedIntent(intent)}
                  onContinue={() => {
                    const stepIdx = message.stepIndex !== undefined ? message.stepIndex : 1;
                    const label =
                      selectedIntent === 'career_decided'
                        ? 'I have a Goal Role in Mind (Target Destination Known)'
                        : "I'm Exploring Careers (Interest-Driven Exploration)";
                    onSubmitInteractiveAnswer?.(
                      stepIdx,
                      `Selected Track: ${label}`,
                      { careerIntent: selectedIntent }
                    );
                  }}
                  disabled={disabled}
                />
              )}

              {/* Career Q&A: Career Transition Navigator */}
              {message.inputType === 'transition_navigator' && (
                <TransitionNavigator
                  onGeneratePathway={(data) => {
                    const targetLabel = data.isExploringPivot
                      ? 'Best Pivot Recommendations'
                      : data.targetRole;
                    const formattedAnswer = `🚀 Career Transition: Moving from ${data.currentRole} (${data.yearsExperience}) → ${targetLabel} (${data.weeklyHours})`;
                    onSubmitInteractiveAnswer?.(
                      message.stepIndex !== undefined ? message.stepIndex : 1,
                      formattedAnswer,
                      {
                        transitionData: data,
                        aboutYou: {
                          currentRole: data.currentRole,
                          yearsOfExperience: data.yearsExperience,
                        },
                        goals: {
                          targetRoles: [targetLabel],
                        },
                      }
                    );
                  }}
                  onSkipToQa={() => {
                    onSubmitInteractiveAnswer?.(
                      message.stepIndex !== undefined ? message.stepIndex : 1,
                      'Continuing with open-ended Career Q&A',
                      { openEndedQa: true }
                    );
                  }}
                  disabled={disabled}
                />
              )}

              {/* Step 3 (or Step 1 in legacy): Stage & Graduation Year */}
              {message.inputType === 'stage_select' && (
                <StageSelector
                  selectedStage={stageId}
                  selectedYear={gradYear}
                  onSelectStage={(sId, sLabel) => {
                    setStageId(sId);
                    setStageLabel(sLabel);
                  }}
                  onSelectYear={(yr) => setGradYear(yr)}
                />
              )}

              {/* Step 2: Education & Academic Fundamentals */}
              {message.inputType === 'education_select' && (
                <EducationSelector
                  value={education}
                  onChange={(val) => setEducation(val)}
                />
              )}

              {/* Step 3: Skills & Capability Toggles */}
              {message.inputType === 'skills_select' && (
                <SkillSelector
                  selectedSkills={skills}
                  onChange={(val) => setSkills(val)}
                />
              )}

              {/* Step 4: Practical Projects (with Skip option) */}
              {message.inputType === 'projects_entry' && (
                <ProjectLogger
                  projects={projects}
                  onChange={(val) => setProjects(val)}
                  onSkip={handleSkipStep}
                />
              )}

              {/* Step 5: Problem Spaces & Work Environment */}
              {message.inputType === 'interests_select' && (
                <InterestSelector
                  value={interests}
                  onChange={(val) => setInterests(val)}
                />
              )}

              {/* Step 6: Target Roles & Priorities */}
              {message.inputType === 'goals_select' && (
                <GoalSelector
                  value={goals}
                  onChange={(val) => setGoals(val)}
                />
              )}

              {/* Step Action Buttons (Previous, Skip, Continue) - Only for regular steps */}
              {message.inputType !== 'email_prompt' && message.inputType !== 'intent_select' && message.inputType !== 'transition_navigator' && (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    {canGoBack && onPreviousStep && (
                      <button
                        type="button"
                        onClick={onPreviousStep}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {message.inputType === 'projects_entry' && (
                      <button
                        type="button"
                        onClick={handleSkipStep}
                        className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        Skip this question
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleConfirmStep}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#00b4d8] via-[#2552f4] to-[#a825eb] hover:from-[#0096c7] hover:to-[#9333ea] text-white text-xs font-bold shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>
                        {message.stepIndex === 6 ? 'Finish Discovery' : 'Continue'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If the step is already completed, show a neat compact summary pill with edit shortcut */}
          {isAssistant && message.inputType && message.isCompletedStep && message.inputType !== 'summary_card' && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Response logged
              </span>
              {onReopenStep && message.stepIndex && (
                <button
                  type="button"
                  onClick={() => onReopenStep(message.stepIndex!)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit answer</span>
                </button>
              )}
            </div>
          )}

          {/* =========================================================================
              STEP 7: FACTUAL SELF-REPORTED PROFILE SUMMARY CARD
             ========================================================================= */}
          {isAssistant && message.inputType === 'summary_card' && (() => {
            const currentProfile = profile || message.stepData || {};
            const careerIntent = currentProfile.careerIntent;
            const aboutYou = currentProfile.aboutYou || {};
            const edu = currentProfile.education || {};
            const skillsList = currentProfile.skills || [];
            const skillsAbsent = currentProfile.skillsExplicitlyAbsent;
            const skillsSkipped = currentProfile.skillsSkipped;
            const pe = currentProfile.practicalExperience || {};
            const projectsList = pe.projects || currentProfile.projects || [];
            const interests = currentProfile.interests || {};
            const goals = currentProfile.goals || {};
            const aiSuggestions = currentProfile.aiSuggestions || {};
            const isConfirmed = currentProfile.status === 'confirmed';

            const getSectionState = (key: string) => {
              return sectionAnalyses?.[key]?.state;
            };

            const renderBadge = (state?: string) => {
              switch (state) {
                case 'complete':
                  return (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Complete
                    </span>
                  );
                case 'partial':
                  return (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      ⚠ Incomplete
                    </span>
                  );
                case 'explicitly_absent':
                  return (
                    <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      ✓ None Reported
                    </span>
                  );
                case 'skipped':
                  return (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Skipped
                    </span>
                  );
                default:
                  return null;
              }
            };

            return (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200 shadow-xs space-y-4">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-[#2552f4]">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm font-bold text-slate-900 leading-tight block">
                            Verified Career Profile
                          </span>
                          {careerIntent === 'career_decided' && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              🎯 Career Decided
                            </span>
                          )}
                          {careerIntent === 'career_exploring' && (
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              🧭 Career Exploring
                            </span>
                          )}
                          {careerIntent === 'uncertain' && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              🔄 Transitioning / Uncertain
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Declared self-report • Point A to Point B career mapping
                        </span>
                      </div>
                    </div>
                    {isConfirmed ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmed</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-200">
                        Ready for Review
                      </span>
                    )}
                  </div>

                  {/* 1. Point A: Current Position & Stage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200/90">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                          Point A: Current Position
                        </span>
                        {renderBadge(getSectionState('about_you'))}
                      </div>
                      <p className="font-semibold text-slate-800">
                        {aboutYou.currentRole ? (
                          <>
                            {aboutYou.currentRole}
                            {aboutYou.yearsOfExperience ? ` • ${aboutYou.yearsOfExperience}` : ''}
                          </>
                        ) : (
                          aboutYou.stageLabel || aboutYou.currentStage || 'Not specified'
                        )}
                      </p>
                      {aboutYou.industry && (
                        <p className="text-[11.5px] text-slate-600 mt-0.5">
                          Industry: {aboutYou.industry}
                        </p>
                      )}
                      {(aboutYou.stageLabel || aboutYou.currentStage) && aboutYou.currentRole && (
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                          Stage: {aboutYou.stageLabel || aboutYou.currentStage}
                        </p>
                      )}
                      {(edu.graduationYear || aboutYou.graduationYear) && (
                        <p className="text-[11.5px] text-slate-500 mt-0.5">
                          Target Timeline: {edu.graduationYear || aboutYou.graduationYear}
                        </p>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200/90">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                          Education & Qualifications
                        </span>
                        {renderBadge(getSectionState('education'))}
                      </div>
                      <p className="font-semibold text-slate-800">
                        {edu.degree || (edu.field ? '' : <span className="text-amber-600 font-normal italic">Education unspecified</span>)}
                        {edu.degree && edu.field ? ' in ' : ''}
                        {edu.field || ''}
                      </p>
                      {edu.academicFocus && edu.academicFocus.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {edu.academicFocus.map((f: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10.5px]">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                      {edu.certifications && edu.certifications.length > 0 && (
                        <p className="text-[11px] text-slate-600 mt-1">
                          <span className="font-medium text-slate-700">Certifications: </span>
                          {edu.certifications.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. Self-Reported Capabilities & Skills */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/90 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                          Self-Reported Capabilities & Skills
                        </span>
                        {renderBadge(getSectionState('skills'))}
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                        Declared • Verified Facts Only
                      </span>
                    </div>
                    {skillsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {skillsList.map((s: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200 text-[#2552f4] font-medium text-[11.5px]"
                          >
                            <span>{s.name}</span>
                            {s.category && (
                              <span className="text-[9.5px] text-slate-400 capitalize">
                                [{s.category}]
                              </span>
                            )}
                            {s.proficiency ? (
                              <span className="text-[9.5px] opacity-75 capitalize font-normal">
                                ({s.proficiency})
                              </span>
                            ) : (
                              <span className="text-[9.5px] text-slate-500 font-normal">
                                (Level Unspecified)
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : skillsAbsent ? (
                      <div className="p-2 rounded-lg bg-slate-100/70 text-slate-600 text-[11.5px]">
                        ✓ Confirmed: Starting out with no specific capabilities listed yet.
                      </div>
                    ) : skillsSkipped ? (
                      <div className="p-2 rounded-lg bg-slate-100/70 text-slate-600 text-[11.5px]">
                        Skills section skipped by user.
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No capabilities reported yet</span>
                    )}
                  </div>

                  {/* 3. Practical Accomplishments & Experience */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/90 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                        Practical Accomplishments & Experience
                      </span>
                      {renderBadge(getSectionState('projects'))}
                    </div>
                    {projectsList.length > 0 ? (
                      <div className="space-y-2">
                        {projectsList.map((pr: any, i: number) => (
                          <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                            <span className="font-semibold text-slate-800">{pr.title}</span>
                            {pr.description && <p className="text-[11px] text-slate-600 mt-0.5">{pr.description}</p>}
                            {pr.techStack && pr.techStack.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {pr.techStack.map((t: string, ti: number) => (
                                  <span key={ti} className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : pe.hasProjects === false ? (
                      <div className="p-2 rounded-lg bg-slate-100/70 text-slate-600 text-[11.5px]">
                        ✓ Confirmed: No practical projects yet (focusing on core domain fundamentals).
                      </div>
                    ) : pe.skipped ? (
                      <div className="p-2 rounded-lg bg-slate-100/70 text-slate-600 text-[11.5px]">
                        Practical experience section skipped by user.
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not shared yet</span>
                    )}
                  </div>

                  {/* 4. Interests & Point B Destination */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200/90">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                          Interests & Work Preferences
                        </span>
                        {renderBadge(getSectionState('interests'))}
                      </div>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Domains / Tracks: </span>
                        {interests.primaryTracks?.join(', ') || 'Not specified'}
                      </p>
                      {interests.workEnvironment && (
                        <p className="text-slate-700 mt-1">
                          <span className="font-medium text-slate-900">Work Style: </span>
                          {interests.workEnvironment}
                        </p>
                      )}
                      {interests.motivations && interests.motivations.length > 0 && (
                        <p className="text-slate-700 mt-1">
                          <span className="font-medium text-slate-900">Motivations: </span>
                          {interests.motivations.join(', ')}
                        </p>
                      )}
                      {interests.constraints && interests.constraints.length > 0 && (
                        <p className="text-slate-700 mt-1">
                          <span className="font-medium text-slate-900">Constraints: </span>
                          {interests.constraints.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200/90">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                          Point B: Career Destination
                        </span>
                        {renderBadge(getSectionState('goals'))}
                      </div>
                      {careerIntent === 'career_exploring' ? (
                        <div>
                          <p className="text-purple-700 font-semibold mb-1">
                            🧭 Exploring Potential Pathways
                          </p>
                          <p className="text-slate-700">
                            <span className="font-medium text-slate-900">Directions Considered: </span>
                            {goals.targetRoles?.length ? goals.targetRoles.join(', ') : 'Open to exploration'}
                          </p>
                          {goals.destinationSummary && (
                            <p className="text-[11.5px] text-slate-600 mt-1">
                              {goals.destinationSummary}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-700">
                            <span className="font-medium text-slate-900">Target Role(s): </span>
                            {goals.targetRoles?.join(', ') || goals.destinationSummary || 'Not specified'}
                          </p>
                          {goals.transitionMotivations && goals.transitionMotivations.length > 0 && (
                            <p className="text-slate-700 mt-1">
                              <span className="font-medium text-slate-900">Why Transition: </span>
                              {goals.transitionMotivations.join(', ')}
                            </p>
                          )}
                          {goals.capabilityGapsOrUncertainties && goals.capabilityGapsOrUncertainties.length > 0 && (
                            <p className="text-slate-700 mt-1">
                              <span className="font-medium text-slate-900">Gaps/Uncertainties: </span>
                              {goals.capabilityGapsOrUncertainties.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                      {goals.topPriority && (
                        <p className="text-slate-700 mt-1">
                          <span className="font-medium text-slate-900">Top Priority: </span>
                          {goals.topPriority}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Separate AI Inferred Hypotheses Box */}
                  {aiSuggestions && (aiSuggestions.suggestedSkillsToExplore?.length > 0 || aiSuggestions.suggestedRoles?.length > 0 || aiSuggestions.clarificationNeeded) && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border border-indigo-200/80 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100">
                        <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>AI Career Hypotheses & Exploration</span>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full border border-indigo-200">
                          Inferred Data • Not Part of Factual Profile
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        These are potential exploration avenues and capability hypotheses inferred by AI based on your background and conversation. They are strictly separate from your declared facts.
                      </p>

                      {aiSuggestions.clarificationNeeded && (
                        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>Clarification requested:</strong> {aiSuggestions.clarificationNeeded}</span>
                        </div>
                      )}

                      {aiSuggestions.suggestedSkillsToExplore && aiSuggestions.suggestedSkillsToExplore.length > 0 && (
                        <div className="text-xs">
                          <span className="text-[10.5px] font-bold text-indigo-950 uppercase tracking-wider block mb-1">
                            Capabilities to Consider Exploring:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {aiSuggestions.suggestedSkillsToExplore.map((sk: string, i: number) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => onSelectFollowup?.(`Add ${sk} to my skills`)}
                                disabled={disabled}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-medium text-[11px] hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer"
                                title="Click to ask assistant to add this to your skills"
                              >
                                <span>+ {sk}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiSuggestions.suggestedRoles && aiSuggestions.suggestedRoles.length > 0 && (
                        <div className="text-xs">
                          <span className="text-[10.5px] font-bold text-indigo-950 uppercase tracking-wider block mb-1">
                            Potential Career Destinations to Consider:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {aiSuggestions.suggestedRoles.map((role: string, i: number) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => onSelectFollowup?.(`Target ${role} as my career goal`)}
                                disabled={disabled}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-medium text-[11px] hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer"
                                title="Click to set this as your target goal"
                              >
                                <span>🎯 {role}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[10.5px] text-slate-500 italic pt-1 border-t border-indigo-100/60">
                        Note: Career Ladder does not generate unverified readiness scores or artificial match percentages.
                      </div>
                    </div>
                  )}

                  {/* Card Confirmation Footer */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {isConfirmed ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 w-full">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Profile verified and confirmed. Ready for personalized career guidance.</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={onConfirmProfile}
                            disabled={disabled}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2552f4] hover:bg-[#1e3bb3] active:bg-[#1a349e] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Confirm Profile</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectFollowup?.('I want to make a correction to my profile')}
                            disabled={disabled}
                            className="text-xs font-semibold text-[#2552f4] hover:text-[#1e3bb3] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Make a Correction</span>
                          </button>
                        </>
                      )}
                    </div>

                    {!isConfirmed && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10.5px] text-slate-500 self-center">Quick corrections:</span>
                        <button
                          type="button"
                          onClick={() => onSelectFollowup?.('Remove a skill from my profile')}
                          className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] transition-colors cursor-pointer"
                        >
                          Remove a skill
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectFollowup?.('Update my degree or major')}
                          className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] transition-colors cursor-pointer"
                        >
                          Clarify major/degree
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectFollowup?.('I want to change my target roles')}
                          className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] transition-colors cursor-pointer"
                        >
                          Change target roles
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer actions: Timestamp, Copy, Reactions */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1.5 px-1.5 text-[11.5px] font-medium text-slate-500 select-none w-full',
            isAssistant ? 'justify-between' : 'justify-end'
          )}
        >
          {isAssistant ? (
            <>
              <div className="flex items-center gap-2 text-slate-400">
                <span>{message.timestamp}</span>
              </div>

              {/* Bot action tools: Speak (Google TTS), Copy & Thumbs Feedback */}
              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={handleSpeak}
                  className={cn(
                    'p-1 rounded-md transition-colors cursor-pointer',
                    isSpeaking
                      ? 'text-cyan-600 bg-cyan-50 animate-pulse'
                      : 'hover:bg-slate-100 hover:text-slate-800 text-slate-400'
                  )}
                  title={isSpeaking ? 'Stop listening' : 'Listen with Google Text-to-Speech'}
                  aria-label="Listen with Google Text-to-Speech"
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5 text-cyan-600" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <div className="w-[1px] h-3 bg-slate-200" />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-800 text-slate-400 transition-colors cursor-pointer"
                  title={copied ? 'Copied to clipboard!' : 'Copy response'}
                >
                  {copied ? (
                    <span className="flex items-center gap-1 text-[#16a34a] font-semibold text-[11px]">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Copied</span>
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <div className="w-[1px] h-3 bg-slate-200" />
                <button
                  type="button"
                  onClick={() => setFeedback((prev) => (prev === 'up' ? null : 'up'))}
                  className={cn(
                    'p-1 rounded-md transition-colors cursor-pointer',
                    feedback === 'up'
                      ? 'text-blue-600 bg-blue-50'
                      : 'hover:bg-slate-100 hover:text-slate-800 text-slate-400'
                  )}
                  title="Helpful reply"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback((prev) => (prev === 'down' ? null : 'down'))}
                  className={cn(
                    'p-1 rounded-md transition-colors cursor-pointer',
                    feedback === 'down'
                      ? 'text-rose-600 bg-rose-50'
                      : 'hover:bg-slate-100 hover:text-slate-800 text-slate-400'
                  )}
                  title="Needs improvement"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              {/* Edit Response Action */}
              <button
                type="button"
                onClick={() => {
                  setEditText(message.text || '');
                  onStartEdit?.();
                  setInternalEditing(true);
                }}
                disabled={disabled}
                className="flex items-center gap-1 text-[11.5px] font-semibold text-[#2552f4] hover:text-[#1d3bbd] hover:underline px-1 py-0.5 rounded transition-colors cursor-pointer"
                title="Edit this response"
                aria-label="Edit response"
              >
                <Edit3 className="w-3 h-3 stroke-[2.2]" />
                <span>Edit response</span>
              </button>

              <div className="w-[1px] h-2.5 bg-slate-200" />

              <span>{message.timestamp}</span>

              {message.isEdited && (
                <span className="text-[10px] text-slate-400 italic">(edited)</span>
              )}

              <span className="inline-flex items-center text-cyan-600" title="Delivered and read">
                <svg className="w-4 h-4 stroke-current fill-none stroke-[2.2]" viewBox="0 0 20 20">
                  <path d="M4 11l3 3L14 5" />
                  <path d="M9 11l2.5 2.5L18 6" />
                </svg>
              </span>
            </div>
          )}
        </div>

        {/* Suggested Follow-up Questions for Bot Replies */}
        {isAssistant && !message.inputType && message.followupQuestions && message.followupQuestions.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-1.5 w-full animate-fade-in">
            {/* Context note when options are disabled because a response was selected */}
            {isOptionsDisabled && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pl-1 select-none">
                <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                <span>Option selected. Click &apos;Edit response&apos; below to modify.</span>
              </div>
            )}

            {/* Context note when the response is currently being edited */}
            {isResponseBeingEdited && (
              <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold pl-1 animate-pulse select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Editing response — click any option to change your choice:</span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 w-full">
              {message.followupQuestions.map((q, idx) => {
                const isChosen = q === selectedOption;

                // When options are disabled:
                if (isOptionsDisabled) {
                  if (isChosen) {
                    // Selected option: highlighted with checkmark
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'text-left text-[12px] font-semibold leading-[1.35]',
                          'bg-blue-50 text-[#1d3bbd]',
                          'border border-[#2552f4]/40',
                          'rounded-full px-3 py-1',
                          'shadow-2xs flex items-center gap-1.5 select-none opacity-95'
                        )}
                        title="Selected option (click Edit response below to modify)"
                      >
                        <Check className="w-3 h-3 text-[#2552f4] stroke-[2.5] shrink-0" />
                        <span>{q}</span>
                      </div>
                    );
                  }

                  // Non-selected options: disabled & muted
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'text-left text-[12px] font-normal leading-[1.35]',
                        'text-slate-400 bg-slate-50/60',
                        'border border-slate-200/80',
                        'rounded-full px-3 py-1',
                        'flex items-center gap-1.5 opacity-40 cursor-not-allowed select-none'
                      )}
                      title="Option disabled. Click 'Edit response' on your answer below to modify."
                    >
                      <span>{q}</span>
                    </div>
                  );
                }

                // When NOT disabled (either unanswered active message, or currently being edited):
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectFollowup?.(q)}
                    disabled={disabled}
                    className={cn(
                      'group text-left text-[12px] font-medium leading-[1.35]',
                      isResponseBeingEdited && isChosen
                        ? 'bg-blue-100 text-[#1d3bbd] border-[#2552f4] ring-1 ring-[#2552f4]/30'
                        : isResponseBeingEdited
                        ? 'text-[#2552f4] hover:text-[#1d3bbd] bg-white hover:bg-blue-50 border border-blue-300 hover:border-[#2552f4] ring-1 ring-blue-400/20 shadow-xs'
                        : 'text-[#2552f4] hover:text-[#1d3bbd] bg-white hover:bg-blue-50/80 active:bg-blue-100 border border-[#d0e0ff] hover:border-[#3b59f8]/40 shadow-2xs hover:shadow-xs',
                      'rounded-full px-3 py-1 transition-all duration-150',
                      'hover:-translate-y-0.5 active:translate-y-0',
                      'flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'
                    )}
                  >
                    {isResponseBeingEdited && isChosen && (
                      <Check className="w-3 h-3 text-[#2552f4] stroke-[2.5] shrink-0" />
                    )}
                    <span>{q}</span>
                    <ArrowRight className="w-3 h-3 text-[#315cfc] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to format bold **text**, *italic*, `code`, and clean up raw markdown marks
function formatTextWithCodeAndBold(text: string, isAssistant: boolean = true): React.ReactNode {
  if (!text) return null;

  // 1. Split on inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, ci) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={`c-${ci}`}
          className={cn(
            'px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[11.5px] font-medium border',
            isAssistant
              ? 'bg-blue-50/70 border-blue-200/70 text-[#1d4ed8]'
              : 'bg-black/40 border-white/20 text-cyan-200'
          )}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 2. Split on bold-italic: ***text*** or ___text___
    const boldItalicParts = part.split(/(\*\*\*[^*]+\*\*\*|___[^_]+___)/g);

    return boldItalicParts.map((biPart, biIdx) => {
      if (
        (biPart.startsWith('***') && biPart.endsWith('***') && biPart.length > 6) ||
        (biPart.startsWith('___') && biPart.endsWith('___') && biPart.length > 6)
      ) {
        return (
          <strong
            key={`bi-${ci}-${biIdx}`}
            className={cn(
              'font-bold italic',
              isAssistant ? 'text-slate-900' : 'text-white'
            )}
          >
            {biPart.slice(3, -3)}
          </strong>
        );
      }

      // 3. Split on bold: **text** or __text__
      const boldParts = biPart.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);

      return boldParts.map((bPart, bIdx) => {
        if (
          (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) ||
          (bPart.startsWith('__') && bPart.endsWith('__') && bPart.length > 4)
        ) {
          return (
            <strong
              key={`b-${ci}-${biIdx}-${bIdx}`}
              className={cn(
                'font-bold',
                isAssistant ? 'text-slate-900' : 'text-white'
              )}
            >
              {bPart.slice(2, -2)}
            </strong>
          );
        }

        // 4. Split on italic or label: *text* or _text_
        const italicParts = bPart.split(/(\*[^*]+\*|_[^_]+_)/g);

        return italicParts.map((iPart, iIdx) => {
          if (
            (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) ||
            (iPart.startsWith('_') && iPart.endsWith('_') && iPart.length > 2)
          ) {
            const inner = iPart.slice(1, -1).trim();
            // If it's a short label ending in a colon like "What to learn:", render as bold label
            const isLabel = inner.endsWith(':') && inner.length < 35;
            if (isLabel) {
              return (
                <strong
                  key={`lbl-${ci}-${biIdx}-${bIdx}-${iIdx}`}
                  className={cn(
                    'font-bold mr-1',
                    isAssistant ? 'text-slate-900' : 'text-white'
                  )}
                >
                  {inner}
                </strong>
              );
            }
            return (
              <em
                key={`i-${ci}-${biIdx}-${bIdx}-${iIdx}`}
                className={cn(
                  'italic font-normal',
                  isAssistant ? 'text-slate-700' : 'text-white/95'
                )}
              >
                {inner}
              </em>
            );
          }

          // 5. Clean up any leftover stray marks (like rogue leading/trailing # or *)
          const cleanedText = iPart
            .replace(/^#{1,6}\s*/g, '')
            .replace(/(^|\s)\*(\s|$)/g, '$1$2')
            .replace(/(^|\s)#+(\s|$)/g, '$1$2');

          return cleanedText;
        });
      });
    });
  });
}

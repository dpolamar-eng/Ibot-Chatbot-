import React, { useState, useEffect } from 'react';
import { IBOTCareerGuide } from './components/career-guide/IBOTCareerGuide';

/**
 * Career Ladder Chatbot — Standalone Development Environment
 * Displays exclusively the centered Career Ladder chatbot without surrounding
 * demonstration dashboard, fake host headers, or JSON inspection panels.
 */
export default function App() {
  const [resetKey, setResetKey] = useState<number>(0);

  useEffect(() => {
    // Prevent the browser from restoring previous scroll positions on reload
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#0a0f1d] text-slate-800 font-sans selection:bg-[#2552f4] selection:text-white flex flex-col items-center justify-center p-0 sm:p-3 md:p-4 relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Centered Chatbot Container */}
      <div className="relative z-10 w-full max-w-5xl h-full sm:h-[min(94vh,calc(100vh-2rem))] max-h-[960px] flex flex-col rounded-none sm:rounded-2xl md:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_40px_rgba(37,82,244,0.12)] overflow-hidden border-0 sm:border border-slate-700/60 bg-white ring-1 ring-white/10">
        <IBOTCareerGuide
          key={resetKey}
          mode="panel"
          subtitle="Discover where you are, explore where you want to go, and understand how to get there."
          onRefresh={() => {
            setResetKey((k) => k + 1);
            window.scrollTo(0, 0);
          }}
          className="h-full w-full border-0 rounded-none shadow-none"
        />
      </div>
    </div>
  );
}

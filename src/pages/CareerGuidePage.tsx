import React from 'react';
import { IBOTCareerGuide } from '../components/career-guide/IBOTCareerGuide';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CareerGuidePage() {
  return (
    <div className="min-h-screen bg-[#f3f5fa] text-slate-800 font-sans selection:bg-[#315cfc] selection:text-white flex flex-col justify-between relative overflow-x-hidden">
      {/* Background radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(49, 92, 252, 0.08) 0%, rgba(243, 245, 250, 0) 70%), radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.05) 0%, rgba(243, 245, 250, 0) 50%)',
        }}
        aria-hidden="true"
      />

      {/* Simplified Top Navigation */}
      <header className="w-full z-20 py-4 px-6 border-b border-slate-200/60 bg-white/70 backdrop-blur-md flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[#315cfc] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Platform
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-[#315cfc] border border-blue-100">
          <Sparkles className="w-3.5 h-3.5" />
          IBOT AI Career Guide Demo
        </div>
      </header>

      {/* Main Centered Chatbot Experience */}
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-8 z-10 my-4">
        <div className="w-full max-w-[460px] flex justify-center">
          <IBOTCareerGuide />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 z-10 border-t border-slate-200/50 bg-white/40">
        Ottobon IBOT • AI-Era Talent Capability Platform
      </footer>
    </div>
  );
}

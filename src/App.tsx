import React, { useState } from 'react';
import { IBOTCareerGuide } from './components/career-guide/IBOTCareerGuide';
import { RefreshCw, Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [chatKey, setChatKey] = useState<number>(0);

  const handleReset = () => {
    try {
      sessionStorage.removeItem('ibot_chat_intro_played');
    } catch {}
    setChatKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#f3f5fa] flex flex-col items-center justify-between font-sans selection:bg-[#315cfc] selection:text-white relative overflow-x-hidden">
      {/* Background radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(49, 92, 252, 0.08) 0%, rgba(243, 245, 250, 0) 70%), radial-gradient(circle at 80% 80%, rgba(79, 70, 229, 0.06) 0%, rgba(243, 245, 250, 0) 50%)',
        }}
        aria-hidden="true"
      />

      {/* Top Demo Bar */}
      <header className="w-full z-20 py-3.5 px-6 border-b border-slate-200/70 bg-white/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#253bd3] to-[#3b59f8] flex items-center justify-center text-white shadow-sm font-bold text-sm">
            iB
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              IBOT Career Guide
            </h2>
            <p className="text-xs text-slate-500">
              Reference Interface Demo • Starts with greeting alone
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Device switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs text-slate-600">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-lg transition-all ${
                previewDevice === 'desktop'
                  ? 'bg-white text-[#2552f4] shadow-xs'
                  : 'hover:text-slate-900'
              }`}
              title="Desktop View (450px)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-lg transition-all ${
                previewDevice === 'mobile'
                  ? 'bg-white text-[#2552f4] shadow-xs'
                  : 'hover:text-slate-900'
              }`}
              title="Mobile View (380px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Reset button to clear conversation back to greeting alone */}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Reset conversation back to greeting alone"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </header>

      {/* Main Centered Reference Chatbot */}
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-8 z-10">
        <div
          className={`w-full flex justify-center transition-all duration-300 ${
            previewDevice === 'mobile' ? 'max-w-[385px]' : 'max-w-[450px]'
          }`}
        >
          <IBOTCareerGuide key={chatKey} />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 px-6 text-center text-xs text-slate-500 z-10 border-t border-slate-200/50 bg-white/40">
        IBOT Career Guide • Reference Interface Demo
      </footer>
    </div>
  );
}

import React from 'react';
import { PhoneCall, ArrowUp, Shield, Globe, Heart, Sparkles } from 'lucide-react';

interface ZapierFooterProps {
  onStartCall: () => void;
}

export const ZapierFooter: React.FC<ZapierFooterProps> = ({ onStartCall }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-[#050814] text-slate-300 border-t border-[#18264D] pt-16 pb-12 relative">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* High-Contrast Final Call To Action Box */}
        <div className="bg-gradient-to-r from-[#0C1838] via-[#0E204A] to-[#0A1430] border-2 border-[#233872] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3 text-center md:text-left z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Start Calling in Seconds
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to talk with interesting strangers?
            </h3>
            <p className="text-sm sm:text-base text-slate-300">
              No registration, no cameras, no passwords. Free unlimited voice & text chat.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 z-10 w-full md:w-auto">
            <button
              onClick={onStartCall}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-base rounded-2xl transition-all shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Start Voice Call Now</span>
            </button>

            <button
              onClick={scrollToTop}
              className="p-4 bg-[#121E42] hover:bg-[#1A2C5C] text-slate-300 hover:text-white border border-[#233872] rounded-2xl transition-all flex items-center justify-center cursor-pointer"
              title="Scroll back to top dialer"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Column Link Lists */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-[#152347]">
          
          {/* Col 1: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Platform Features</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><button onClick={scrollToTop} className="hover:text-cyan-300 transition-colors">Anonymous Voice Chat</button></li>
              <li><button onClick={scrollToTop} className="hover:text-cyan-300 transition-colors">Global Country Filters</button></li>
              <li><button onClick={scrollToTop} className="hover:text-cyan-300 transition-colors">Text Stranger Chat</button></li>
              <li><button onClick={scrollToTop} className="hover:text-cyan-300 transition-colors">Auto Call Re-matching</button></li>
              <li><button onClick={scrollToTop} className="hover:text-cyan-300 transition-colors">Ultra-HD Audio</button></li>
            </ul>
          </div>

          {/* Col 2: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Use Cases</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#seo-section" className="hover:text-indigo-300 transition-colors">English Spoken Practice</a></li>
              <li><a href="#seo-section" className="hover:text-indigo-300 transition-colors">Language Exchange</a></li>
              <li><a href="#seo-section" className="hover:text-indigo-300 transition-colors">Omegle Voice Alternative</a></li>
              <li><a href="#seo-section" className="hover:text-indigo-300 transition-colors">Airtalk Live Alternative</a></li>
              <li><a href="#seo-section" className="hover:text-indigo-300 transition-colors">Casual Global Venting</a></li>
            </ul>
          </div>

          {/* Col 3: Resources & Safety */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Safety & Trust</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#seo-section" className="hover:text-emerald-300 transition-colors">Community Guidelines</a></li>
              <li><a href="#seo-section" className="hover:text-emerald-300 transition-colors">AI Moderation Policy</a></li>
              <li><a href="#seo-section" className="hover:text-emerald-300 transition-colors">Privacy & Data Handling</a></li>
              <li><a href="#seo-section" className="hover:text-emerald-300 transition-colors">Report Abuse Form</a></li>
              <li><a href="#seo-section" className="hover:text-emerald-300 transition-colors">Help & FAQ</a></li>
            </ul>
          </div>

          {/* Col 4: Network Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">Network Health</h4>
            <div className="bg-[#0A1228] border border-[#1E305C] p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Voice Network Active</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Signal Servers: 100% Operational
              </p>
            </div>
          </div>

        </div>

        {/* Footer Bottom Legal Bar */}
        <div className="pt-8 border-t border-[#152347] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} QuickTalks Inc. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Made for spontaneous, safe human connections.</span>
          </div>
        </div>

      </div>

    </footer>
  );
};

import React, { useState } from 'react';
import { PhoneCall, Search, Sparkles, Shield, Globe, Mic, CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onStartCall: () => void;
  onSelectCountry?: (countryCode: string) => void;
}

const TOPIC_SUGGESTIONS = [
  { label: '🗣️ English Practice', code: 'US', tag: 'Language' },
  { label: '🇯🇵 Japanese Exchange', code: 'JP', tag: 'Culture' },
  { label: '🇬🇧 Casual Chat', code: 'GB', tag: 'Social' },
  { label: '🇩🇪 German Conversation', code: 'DE', tag: 'Language' },
  { label: '☕ Friendly Venting', code: 'ANY', tag: 'Support' },
  { label: '🎵 Music & Tech', code: 'ANY', tag: 'Interests' },
];

export const ZapierHeroSection: React.FC<HeroSectionProps> = ({ onStartCall, onSelectCountry }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>('Language');

  const filteredSuggestions = TOPIC_SUGGESTIONS.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 relative overflow-hidden">
      {/* Background Radial Ambiance */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Left Column: Headlines, Interactive Search & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 sm:space-y-8">
          
          {/* Badge Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide shadow-lg shadow-cyan-950/40">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Automate Authentic Voice Connections • 0% Registration</span>
          </div>

          {/* Main Hero Headline (H1 scale: 3.5rem to 4.5rem) */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.75rem] font-extrabold text-white tracking-tight leading-[1.1] font-sans">
            Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Instantly</span> with People Worldwide.
          </h1>

          {/* Subtext Paragraph */}
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl">
            Experience spontaneous 1-on-1 stranger voice conversations in under 3 seconds. No camera, no sign-up, no hidden fees—just crystal-clear HD audio.
          </p>

          {/* Zapier-Style Interactive App / Topic Search Box Component */}
          <div className="w-full max-w-xl bg-[#0B132A] border border-[#22356B] rounded-2xl p-3 sm:p-4 shadow-2xl space-y-3 transition-all hover:border-cyan-500/50">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics or countries (e.g., Japan, English Practice)..."
                className="w-full pl-11 pr-4 py-3 bg-[#060B18] border border-[#1B2B58] rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Dynamic Auto-Suggest Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">Popular:</span>
              {filteredSuggestions.slice(0, 5).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.code !== 'ANY' && onSelectCountry) {
                      onSelectCountry(item.code);
                    }
                    onStartCall();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#121E42] hover:bg-cyan-600/30 text-slate-200 hover:text-cyan-200 border border-[#233772] text-xs font-medium transition-all flex items-center gap-1 active:scale-95"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button & Micro-CTAs */}
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={onStartCall}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-lg rounded-2xl transition-all shadow-xl shadow-emerald-950/50 hover:shadow-cyan-500/25 flex items-center justify-center gap-3 active:scale-95 group cursor-pointer"
            >
              <PhoneCall className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span>Start Free Voice Call</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-400 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                No Sign-Up
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                100% Free
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Audio-First
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: High-Fidelity UI Interactive Mockup Card */}
        <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-gradient-to-b from-[#0F1A3A] via-[#0B1229] to-[#070B18] border border-[#22356B] rounded-3xl p-6 shadow-2xl shadow-cyan-950/30 relative space-y-6">
            
            {/* Window Bar header */}
            <div className="flex items-center justify-between border-b border-[#1E2E5B] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>HD Voice Stream Ready</span>
              </div>
            </div>

            {/* Live Audio Visualizer Stage */}
            <div className="bg-[#050914] border border-[#1A2952] rounded-2xl p-6 text-center space-y-4 relative overflow-hidden">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 p-1 shadow-xl shadow-cyan-500/20 flex items-center justify-center relative">
                <div className="w-full h-full rounded-full bg-[#0B1229] flex items-center justify-center text-white">
                  <Mic className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">Ready to Connect</h4>
                <p className="text-xs text-slate-400 mt-1">Matched in &lt;2.8s • 190+ Countries Online</p>
              </div>

              {/* Soundwaves Simulation */}
              <div className="flex items-center justify-center gap-1 h-8 pt-2">
                {[40, 70, 30, 90, 50, 100, 60, 80, 40, 70, 30, 90, 50].map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}%` }}
                    className="w-1.5 bg-gradient-to-t from-cyan-500 to-emerald-400 rounded-full animate-soundwave"
                  />
                ))}
              </div>
            </div>

            {/* Security Spec Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="bg-[#080E21] border border-[#1C2C5A] p-3 rounded-xl flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>P2P Encrypted</span>
              </div>
              <div className="bg-[#080E21] border border-[#1C2C5A] p-3 rounded-xl flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>190+ Regions</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

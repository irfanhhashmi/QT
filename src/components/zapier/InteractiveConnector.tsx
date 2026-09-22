import React, { useState } from 'react';
import { Sparkles, ArrowRight, PhoneCall, Zap, Globe, MessageSquare, CheckCircle2 } from 'lucide-react';

interface InteractiveConnectorProps {
  onStartCallWithPref?: (countryCode: string, mode: string) => void;
}

const COUNTRIES = [
  { code: 'ANY', name: '🌍 Worldwide (Any Country)', flag: '🌍' },
  { code: 'US', name: '🇺🇸 United States', flag: '🇺🇸' },
  { code: 'JP', name: '🇯🇵 Japan', flag: '🇯🇵' },
  { code: 'GB', name: '🇬🇧 United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: '🇩🇪 Germany', flag: '🇩🇪' },
  { code: 'PK', name: '🇵🇰 Pakistan / S. Asia', flag: '🇵🇰' },
];

const TOPICS = [
  '🗣️ Practice Spoken English',
  '☕ Friendly Casual Chat',
  '🎮 Gaming & Anime Talk',
  '🎵 Music & Creative Hobbies',
  '💼 Career & Tech Advice',
];

export const ZapierInteractiveConnector: React.FC<InteractiveConnectorProps> = ({ onStartCallWithPref }) => {
  const [selectedCountry, setSelectedCountry] = useState('ANY');
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');

  const selectedCountryObj = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];

  const handleRunConnection = () => {
    if (onStartCallWithPref) {
      onStartCallWithPref(selectedCountry, mode);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>Interactive Match Flow Connector</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Automate Your Perfect Stranger Connection
        </h2>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Configure your trigger conditions below to see how QuickTalks instantly routes your voice stream in real time.
        </p>
      </div>

      {/* Interactive Zapier Connection Flow Node Box */}
      <div className="bg-gradient-to-b from-[#0E1730] via-[#0A1128] to-[#070B18] border border-[#23356E] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Connection Node Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Node 1: Trigger Input 1 (Country) */}
          <div className="lg:col-span-4 bg-[#070C1B] border border-[#1E2F5E] p-5 sm:p-6 rounded-2xl space-y-3 relative hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase text-cyan-400 tracking-wider bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                Trigger 1: Location
              </span>
              <Globe className="w-4 h-4 text-slate-400" />
            </div>

            <label className="block text-sm font-bold text-white">When I select Country:</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full p-3 bg-[#0E1730] border border-[#23356E] rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Node Arrow Connector 1 */}
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-cyan-500/40 relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping absolute" />
              <ArrowRight className="w-5 h-5 text-cyan-400 bg-[#0E1730] p-0.5 rounded-full relative z-10" />
            </div>
          </div>

          {/* Node 2: Trigger Input 2 (Topic & Mode) */}
          <div className="lg:col-span-3 bg-[#070C1B] border border-[#1E2F5E] p-5 sm:p-6 rounded-2xl space-y-3 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase text-indigo-400 tracking-wider bg-indigo-950/80 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                Trigger 2: Preference
              </span>
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </div>

            <label className="block text-sm font-bold text-white">And Topic / Mode:</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full p-3 bg-[#0E1730] border border-[#23356E] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              {TOPICS.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>

            {/* Mode Switcher Chips */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMode('voice')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  mode === 'voice' 
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-md' 
                    : 'bg-[#0E1730] border-[#23356E] text-slate-400'
                }`}
              >
                🎙️ Voice Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  mode === 'text' 
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                    : 'bg-[#0E1730] border-[#23356E] text-slate-400'
                }`}
              >
                💬 Text Mode
              </button>
            </div>
          </div>

          {/* Node Arrow Connector 2 */}
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-emerald-500/40 relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
              <ArrowRight className="w-5 h-5 text-emerald-400 bg-[#0E1730] p-0.5 rounded-full relative z-10" />
            </div>
          </div>

          {/* Node 3: Output Result Box */}
          <div className="lg:col-span-3 bg-gradient-to-br from-[#09152A] to-[#0D1D3A] border-2 border-emerald-500/50 p-5 sm:p-6 rounded-2xl space-y-3 text-left relative shadow-xl shadow-emerald-950/30">
            <span className="text-[11px] font-mono font-bold uppercase text-emerald-300 tracking-wider bg-emerald-950/90 border border-emerald-500/40 px-2.5 py-0.5 rounded-full inline-block">
              Output: Match Ready
            </span>

            <div>
              <p className="text-xs text-slate-300 leading-snug">
                Connects <strong className="text-white">{selectedCountryObj.flag} {selectedCountryObj.name}</strong> on <strong className="text-white">{selectedTopic}</strong> via HD Voice in <span className="text-emerald-400 font-bold">&lt;2.4s</span>.
              </p>
            </div>

            <button
              onClick={handleRunConnection}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Run This Match Connection</span>
            </button>
          </div>

        </div>

      </div>

    </section>
  );
};

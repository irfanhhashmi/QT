import React from 'react';
import { Mic, Shield, Globe, Zap, Volume2, Sparkles, RefreshCw, Cpu, Activity } from 'lucide-react';

export const ZapierBentoGrid: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Bento Box Modular Architecture</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Built for High-Performance, Zero-Camera Human Connections
        </h2>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          Engineered with modern peer-to-peer audio protocols and automated AI moderation for safe, instant conversations.
        </p>
      </div>

      {/* Asymmetric Bento Box CSS Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Span 2 cols - Audio Engine */}
        <div className="md:col-span-2 bg-[#0E1730] border border-[#23356E] rounded-2xl p-6 sm:p-8 shadow-xl hover:border-cyan-500/50 hover:shadow-cyan-500/10 transition-all flex flex-col justify-between space-y-6 group">
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 w-fit group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Crystal-Clear HD Audio Engine
            </h3>
            <p className="text-slate-300 text-base leading-relaxed max-w-xl">
              Experience zero-latency voice streams powered by automated noise suppression, echo cancellation, and Opus dynamic bitrate adjustments. No app downloads required.
            </p>
          </div>

          {/* Micro Visualizer Mockup */}
          <div className="bg-[#060B18] border border-[#1B2B58] p-4 rounded-xl flex items-center justify-between gap-4 font-mono text-xs text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>High-Fidelity Audio Stream</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Latency: 28ms</span>
            </div>
          </div>
        </div>

        {/* Card 2: Span 1 col - Camera Free Privacy */}
        <div className="bg-[#0E1730] border border-[#23356E] rounded-2xl p-6 sm:p-8 shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all flex flex-col justify-between space-y-6 group">
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 w-fit group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              100% Camera-Free & Anonymous
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Eliminate camera anxiety. Enjoy authentic conversations without video pressure or personal profile registration.
            </p>
          </div>

          <div className="p-3 bg-[#060B18] border border-[#1B2B58] rounded-xl text-xs font-mono text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Zero personal profile data stored</span>
          </div>
        </div>

        {/* Card 3: Span 1 col - Global Country Routing */}
        <div className="bg-[#0E1730] border border-[#23356E] rounded-2xl p-6 sm:p-8 shadow-xl hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all flex flex-col justify-between space-y-6 group">
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 w-fit group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              190+ Global Country Filters
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Target native speakers or specific geographic regions for targeted language practice and cultural exchange.
            </p>
          </div>

          <div className="p-3 bg-[#060B18] border border-[#1B2B58] rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2">
            <span>🌍 Direct regional server routing</span>
          </div>
        </div>

        {/* Card 4: Span 2 cols - Automated AI Safety & Moderation */}
        <div className="md:col-span-2 bg-[#0E1730] border border-[#23356E] rounded-2xl p-6 sm:p-8 shadow-xl hover:border-cyan-500/50 hover:shadow-cyan-500/10 transition-all flex flex-col justify-between space-y-6 group">
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 w-fit group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Automated AI Safety & Community Moderation
            </h3>
            <p className="text-slate-300 text-base leading-relaxed max-w-xl">
              Our automated reporting workflow and community rules ensure a safe, respectful environment for every caller. Instant block and skip controls keep you in full command.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="bg-[#060B18] border border-[#1B2B58] p-3 rounded-xl">
              <strong className="text-cyan-300 block font-mono">1-Click Block</strong>
              <span>Instant partner skip</span>
            </div>
            <div className="bg-[#060B18] border border-[#1B2B58] p-3 rounded-xl">
              <strong className="text-cyan-300 block font-mono">Safety Shield</strong>
              <span>Automated reporting</span>
            </div>
            <div className="bg-[#060B18] border border-[#1B2B58] p-3 rounded-xl col-span-2 sm:col-span-1">
              <strong className="text-cyan-300 block font-mono">Encrypted</strong>
              <span>Peer-to-Peer signals</span>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
};

import React from 'react';
import { Shield, Radio, Cpu, Lock, Globe, Zap, Volume2, Sparkles } from 'lucide-react';

const PROOF_ITEMS = [
  { icon: Shield, label: 'Peer-to-Peer Encryption', detail: 'End-to-End Encrypted' },
  { icon: Volume2, label: 'Ultra-HD Audio Codec', detail: 'Automated Noise Suppression' },
  { icon: Lock, label: 'Zero Logs Kept', detail: '100% Anonymous Sign-up Free' },
  { icon: Globe, label: '190+ Country Nodes', detail: 'Global Latency &lt; 50ms' },
  { icon: Cpu, label: 'AI Safety Engine', detail: 'Real-time Automated Moderation' },
  { icon: Radio, label: 'Instant Matching', detail: 'Average Queue Time &lt; 3s' },
  { icon: Zap, label: 'Cross-Platform PWA', detail: 'Mobile Safari & Chrome Optimized' },
  { icon: Sparkles, label: 'No Camera Required', detail: '100% Audio-First Comfort' },
];

export const SocialProofMarquee: React.FC = () => {
  return (
    <section className="w-full py-10 sm:py-14 bg-[#050814] border-y border-[#18264D] relative overflow-hidden">
      
      {/* Title Header */}
      <div className="w-full max-w-7xl mx-auto px-4 text-center mb-6">
        <p className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
          Powered by Enterprise-Grade Audio & Real-Time Security Standards
        </p>
      </div>

      {/* Infinite Scrolling Marquee Container with Gradient Mask Edges */}
      <div className="w-full overflow-hidden marquee-mask relative">
        <div className="flex items-center gap-6 w-max animate-marquee py-2">
          
          {/* Double items array for seamless looping */}
          {[...PROOF_ITEMS, ...PROOF_ITEMS].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#0B1228] border border-[#1E2F5E] shadow-lg hover:border-cyan-500/50 transition-all shrink-0 group cursor-default"
              >
                <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{item.label}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{item.detail}</p>
                </div>
              </div>
            );
          })}

        </div>
      </div>

    </section>
  );
};

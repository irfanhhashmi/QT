import React from 'react';

interface SoundwaveVisualizerProps {
  localVolume: number;   // 0 to 100
  remoteVolume: number;  // 0 to 100
  isMuted: boolean;
  peerCallsign?: string;
  isConnecting?: boolean;
}

export const SoundwaveVisualizer: React.FC<SoundwaveVisualizerProps> = ({
  localVolume,
  remoteVolume,
  isMuted,
  peerCallsign = 'Stranger',
  isConnecting = false,
}) => {
  // Generate dynamic bar heights based on volume and index
  const getBarHeight = (baseVolume: number, index: number, total: number) => {
    if (baseVolume <= 2) return 6;
    const factor = Math.sin((index / (total - 1)) * Math.PI);
    const variance = ((index * 17) % 30) / 100;
    const height = Math.max(6, Math.min(100, baseVolume * (factor + variance) * 1.2));
    return height;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 px-2 select-none">
      {/* Visualizer Frame */}
      <div className="relative w-full max-w-lg bg-[#0A0F1D]/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden">
        
        {/* Glow backlight behind radio dial */}
        <div 
          className="absolute -inset-10 opacity-20 pointer-events-none transition-opacity duration-300 blur-3xl"
          style={{
            background: remoteVolume > 15 
              ? 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' 
              : localVolume > 15 
              ? 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' 
              : 'radial-gradient(circle, #38BDF8 0%, transparent 70%)'
          }}
        />

        {/* Top Voice Call Status Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnecting ? 'bg-amber-400' : 'bg-cyan-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnecting ? 'bg-amber-500' : 'bg-cyan-500'}`}></span>
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-slate-300 font-semibold">
              {isConnecting ? 'ESTABLISHING VOICE LINE...' : 'HD VOICE CALL ACTIVE'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>P2P Encrypted</span>
          </div>
        </div>

        {/* Main Concentric Waveform Circle */}
        <div className="relative flex items-center justify-center my-4">
          
          {/* Animated concentric radio pulses */}
          <div 
            className="absolute rounded-full border border-cyan-500/20 transition-all duration-150"
            style={{
              width: `${140 + (remoteVolume * 1.2)}px`,
              height: `${140 + (remoteVolume * 1.2)}px`,
              opacity: remoteVolume > 5 ? 0.8 : 0.1,
            }}
          />
          <div 
            className="absolute rounded-full border border-amber-500/20 transition-all duration-150"
            style={{
              width: `${120 + (localVolume * 0.9)}px`,
              height: `${120 + (localVolume * 0.9)}px`,
              opacity: localVolume > 5 && !isMuted ? 0.8 : 0.1,
            }}
          />

          {/* Central Radio Capsule */}
          <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-b from-[#162036] to-[#0D1424] border-2 border-slate-700/80 flex flex-col items-center justify-center shadow-inner group">
            
            {/* Audio Icon with glow */}
            <div className="text-cyan-400 mb-1">
              <svg className={`w-8 h-8 transition-transform duration-150 ${remoteVolume > 10 ? 'scale-110 text-cyan-300' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>

            <div className="text-xs font-semibold text-slate-200 tracking-wide truncate max-w-[100px] text-center px-1">
              {peerCallsign}
            </div>

            <div className="text-[10px] font-mono text-cyan-400/80 mt-0.5">
              {remoteVolume > 8 ? 'Speaking...' : 'Listening'}
            </div>
          </div>
        </div>

        {/* Remote Voice Spectrum Bars */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Stranger Voice Level
            </span>
            <span className="text-slate-400">{remoteVolume}%</span>
          </div>

          <div className="flex items-center justify-between gap-1 h-12 bg-slate-950/60 rounded-xl px-3 py-2 border border-slate-800">
            {Array.from({ length: 24 }).map((_, idx) => {
              const h = getBarHeight(remoteVolume, idx, 24);
              return (
                <div 
                  key={idx}
                  className="flex-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${h}%`,
                    backgroundColor: h > 60 ? '#06B6D4' : h > 20 ? '#38BDF8' : '#334155',
                    opacity: remoteVolume > 2 ? 0.9 : 0.3
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Your Mic Spectrum Bars */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-red-400' : 'bg-amber-400'}`} />
              Your Microphone {isMuted ? '(MUTED)' : ''}
            </span>
            <span className="text-slate-400">{isMuted ? '0%' : `${localVolume}%`}</span>
          </div>

          <div className="flex items-center justify-between gap-1 h-8 bg-slate-950/60 rounded-xl px-3 py-1.5 border border-slate-800">
            {Array.from({ length: 24 }).map((_, idx) => {
              const h = isMuted ? 4 : getBarHeight(localVolume, idx, 24);
              return (
                <div 
                  key={idx}
                  className="flex-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${h}%`,
                    backgroundColor: isMuted ? '#64748B' : h > 60 ? '#F59E0B' : h > 20 ? '#FBBF24' : '#334155',
                    opacity: isMuted ? 0.2 : localVolume > 2 ? 0.9 : 0.3
                  }}
                />
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

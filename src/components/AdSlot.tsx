import React, { useEffect, useRef } from 'react';
import { MONETIZATION_CONFIG } from '../config/monetization';

export type AdSlotType = 
  | 'header-leaderboard'   // 728x90 desktop / 320x50 mobile
  | 'call-top-banner'      // Compact high-CPM Call Screen top banner
  | 'waiting-medium-rect'  // 300x250 (Monetag Medium Rectangle)
  | 'waiting-large-rect'   // 336x280 or 300x250
  | 'postcall-medium-rect' // 300x250 (Monetag Post-Call Conversion)
  | 'sidebar-skyscraper'   // 300x600 or 160x600
  | 'mobile-sticky-footer' // 320x50 (Monetag Mobile Sticky)
  | 'footer-leaderboard'   // 728x90 (Monetag Bottom Banner)
  | 'in-content'           // 300x250 / Native
  | 'native-sponsored'     // Premium Native Sponsored Bar
  | 'in-page-push';        // Monetag In-Page Push format

interface AdSlotProps {
  type: AdSlotType;
  className?: string;
  slotId?: string;
  zoneId?: string; // Monetag Zone ID
  label?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ 
  type, 
  className = '', 
  slotId = 'monetag-slot-1',
  zoneId,
  label
}) => {
  // Early return when monetization is toggled off
  if (!MONETIZATION_CONFIG.enabled) {
    return null;
  }

  const containerRef = useRef<HTMLDivElement>(null);

  // Monetag Container Dimensions
  const getContainerStyles = () => {
    switch (type) {
      case 'header-leaderboard':
        return 'w-full max-w-[728px] min-h-[60px] sm:min-h-[90px]';
      case 'call-top-banner':
        return 'w-full max-w-[460px] min-h-[50px] sm:min-h-[58px]';
      case 'native-sponsored':
        return 'w-full max-w-[460px] min-h-[64px]';
      case 'waiting-medium-rect':
      case 'postcall-medium-rect':
        return 'w-full max-w-[320px] min-h-[140px] sm:min-h-[180px]';
      case 'waiting-large-rect':
      case 'in-content':
        return 'w-full max-w-[380px] min-h-[150px] sm:min-h-[190px]';
      case 'sidebar-skyscraper':
        return 'w-[300px] min-h-[250px] lg:min-h-[600px]';
      case 'mobile-sticky-footer':
        return 'w-full max-w-[320px] h-[50px] flex sm:hidden';
      case 'footer-leaderboard':
        return 'w-full max-w-[728px] min-h-[90px]';
      case 'in-page-push':
        return 'w-full max-w-[420px] min-h-[72px]';
      default:
        return 'w-full max-w-[320px] min-h-[140px]';
    }
  };

  const getFormatLabel = () => {
    if (label) return label;
    switch (type) {
      case 'header-leaderboard':
        return 'Monetag Top Leaderboard (728x90 / 320x50)';
      case 'call-top-banner':
        return 'Monetag Live Call Premium Banner';
      case 'native-sponsored':
        return 'Monetag Sponsored Partner Zone';
      case 'waiting-medium-rect':
        return 'Monetag Medium Rectangle (300x250)';
      case 'waiting-large-rect':
        return 'Monetag High-CPM Rectangle (336x280)';
      case 'postcall-medium-rect':
        return 'Monetag Post-Call Conversion Unit';
      case 'sidebar-skyscraper':
        return 'Monetag Skyscraper (300x600)';
      case 'mobile-sticky-footer':
        return 'Monetag Mobile Sticky Footer (320x50)';
      case 'footer-leaderboard':
        return 'Monetag Bottom Leaderboard';
      case 'in-page-push':
        return 'Monetag In-Page Push Banner';
      default:
        return 'Monetag Revenue Unit';
    }
  };

  // Optional: If user provides real Monetag Zone ID script loader
  useEffect(() => {
    if (zoneId && containerRef.current) {
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.setAttribute('data-zone', zoneId);
        script.src = `https://alwingulla.com/tag.min.js`; // Standard Monetag tag CDN
        script.async = true;
        containerRef.current.appendChild(script);
      } catch (e) {
        console.warn('Monetag tag load:', e);
      }
    }
  }, [zoneId]);

  return (
    <div 
      id={`monetag-ad-${slotId}`}
      ref={containerRef}
      className={`mx-auto flex flex-col items-center justify-center relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[#0F172A]/95 via-[#0D1322] to-[#070B14] backdrop-blur-md overflow-hidden p-2.5 transition-all shadow-xl hover:border-amber-500/40 ${getContainerStyles()} ${className}`}
    >
      {/* Top Tag */}
      <div className="absolute top-1.5 right-2.5 text-[8.5px] uppercase tracking-wider font-mono text-amber-400/80 select-none flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        <span>Ad / Sponsored</span>
      </div>

      {/* Monetag Unit Placeholder & Container */}
      <div 
        className="monetag-ad-zone w-full h-full flex flex-col items-center justify-center text-center px-2 py-1.5"
        data-monetag-slot={slotId}
        data-monetag-type={type}
      >
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-[11px] sm:text-xs font-bold text-slate-100 font-sans tracking-wide leading-tight">
              {getFormatLabel()}
            </div>
            <div className="text-[9.5px] text-slate-400 font-mono">
              Placement: <span className="text-amber-300 font-semibold">{slotId}</span> • Active Revenue Stream
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



import React from 'react';
import { MatchPreferences, ChatMode } from '../types';
import { getCountryFlag, getCountryName } from '../data/countries';
import { QuikTalksIcon } from './Logo';

interface WaitingScreenProps {
  mode: ChatMode;
  preferences: MatchPreferences;
  waitTimeSeconds: number;
  fallbackActive: boolean;
  onCancel: () => void;
  onToggleStrict: () => void;
  onToggleAutoCall: () => void;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  preferences,
  waitTimeSeconds,
  fallbackActive,
  onCancel,
  onToggleAutoCall,
}) => {
  const preferredCount = preferences.preferredCountries?.length || 0;
  const isGlobal = preferredCount === 0;

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-between px-4 py-6 bg-gradient-to-b from-[#0B132B] via-[#091024] to-[#060B18] text-white select-none relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center z-10 flex-1 justify-center">
        
        {/* Pulsing AirTalk Radar Sphere */}
        <div className="relative my-2 flex items-center justify-center">
          
          {/* Animated radar wave rings */}
          <div className="absolute w-72 h-72 rounded-full border border-cyan-500/20 animate-ping opacity-40" />
          <div className="absolute w-64 h-64 rounded-full border border-indigo-500/30 animate-pulse" />

          {/* Central Sphere */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-b from-[#26184E]/90 via-[#191038]/95 to-[#0A0618] border-4 border-[#3D2878] flex flex-col items-center justify-center shadow-2xl shadow-purple-950/70">
            
            {/* QuikTalks Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1 animate-pulse">
              <QuikTalksIcon className="w-full h-full drop-shadow-lg" />
            </div>

            <div className="text-base sm:text-lg font-bold tracking-widest text-white font-sans">
              FINDING STRANGER
            </div>

            <div className="text-[10px] text-amber-300 font-semibold tracking-normal mt-0.5">
              No camera, no sign-up - just talk!
            </div>

            {/* Waiting seconds counter */}
            <div className="mt-1 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>00:{waitTimeSeconds.toString().padStart(2, '0')}</span>
            </div>

          </div>
        </div>

        {/* Searching Status & Country Filters */}
        <div className="my-3 space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Connecting You Across Airwaves...
          </h2>
          
          {waitTimeSeconds >= 10 ? (
            <div className="my-2 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-sm animate-in fade-in duration-200 flex items-start gap-2.5 text-left max-w-md mx-auto">
              <span className="text-base sm:text-lg shrink-0 mt-0.5">📞</span>
              <div className="flex-1">
                <p className="font-semibold text-amber-300 leading-snug">
                  All the users are currently connected on a call. Please wait while we try connect you with any available user.
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-200/80">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Active queue searching... (waiting 00:{waitTimeSeconds.toString().padStart(2, '0')})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400">Target Region:</span>
              {isGlobal ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#182650] border border-[#2B3F7D] text-cyan-300 font-medium">
                  🌍 Worldwide
                </span>
              ) : (
                preferences.preferredCountries?.slice(0, 3).map((code) => (
                  <span key={code} className="px-2.5 py-0.5 rounded-full bg-[#182650] border border-[#2B3F7D] text-indigo-200 font-medium flex items-center gap-1">
                    <span>{getCountryFlag(code)}</span>
                    <span>{getCountryName(code)}</span>
                  </span>
                ))
              )}
            </div>
          )}
        </div>

        {/* Auto Call Checkbox on Waiting Screen */}
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer bg-[#111C3A] px-3 py-1.5 rounded-full border border-[#21356A]">
            <input
              type="checkbox"
              checked={preferences.autoCall}
              onChange={onToggleAutoCall}
              className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span className="font-semibold text-slate-200">Auto Call Next Person</span>
          </label>
        </div>

        {/* Waiting Actions: Direct Hang Up / Cancel */}
        <div className="mt-4 mb-2 flex items-center justify-center gap-4">
          <button
            id="waiting-screen-hangup-btn"
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-all shadow-lg shadow-red-950/60 hover:scale-105 active:scale-95"
            title="Hang up and stop dialing"
          >
            <svg className="w-4 h-4 transform rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Cancel & Stop</span>
          </button>

          <button
            id="cancel-queue-btn"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full bg-[#16203D] hover:bg-[#1E2E5E] border border-[#293B70] text-slate-300 hover:text-white text-xs font-bold transition-all shadow-md"
          >
            Return Home
          </button>
        </div>

      </div>

    </div>
  );
};

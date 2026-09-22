import React, { useState } from 'react';
import { ChatMode, MatchPreferences } from '../types';
import { getCountryFlag, getCountryName, DetectedCountryResult } from '../data/countries';
import { QuikTalksIcon } from './Logo';
import { HomepageSeoSection } from './HomepageSeoSection';

interface HomeScreenProps {
  preferences: MatchPreferences;
  onUpdatePreferences: (updated: Partial<MatchPreferences>) => void;
  onStartMatching: (mode: ChatMode) => void;
  onTestMicrophone: () => Promise<void>;
  isMicTesting: boolean;
  micTestVolume: number;
  micPermissionError: string | null;
  onlineCount: number;
  callLogsCount?: number;
  onOpenCallLogs?: () => void;
  detectedCountry?: DetectedCountryResult;
  onRefreshCountryDetection?: () => void;
  isDetectingCountry?: boolean;
  onOpenFilters?: () => void;
  onOpenFriends?: () => void;
  onOpenSafety?: () => void;
  onOpenShare?: () => void;
  onOpenAnalytics?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  preferences,
  onUpdatePreferences,
  onStartMatching,
  onTestMicrophone,
  isMicTesting,
  micTestVolume,
  micPermissionError,
  onlineCount,
  callLogsCount = 0,
  onOpenCallLogs,
  detectedCountry,
  onRefreshCountryDetection,
  isDetectingCountry = false,
  onOpenFilters,
  onOpenFriends,
  onOpenSafety,
  onOpenShare,
  onOpenAnalytics,
}) => {
  const userCountryCode = preferences.userCountry && preferences.userCountry !== 'auto' 
    ? preferences.userCountry 
    : (detectedCountry?.code || 'PK');

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between px-3 sm:px-4 py-2 sm:py-4 bg-gradient-to-b from-[#0B132B] via-[#091024] to-[#060B18] text-white select-none relative overflow-y-auto overflow-x-hidden min-h-[calc(100dvh-3.5rem)] max-w-full">
      
      {/* Background Subtle Organic Glow Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* Main Dialer Screen */}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center z-10 flex-1 justify-center animate-in fade-in duration-300">
        
        {/* Top Header Row on Dialer: Floating Text Chat Shortcut & Share */}
        <div className="w-full flex justify-between items-center mb-1 shrink-0">
          <button
            id="dialer-text-chat-shortcut"
            onClick={() => onStartMatching('text')}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[#142145] border border-[#273B78] text-white hover:bg-[#1D2E60] transition-colors shadow-lg group text-xs font-semibold"
            title="Start Text Chat Instead"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300 group-hover:text-cyan-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-indigo-200">Text Chat</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {onOpenShare && (
              <button
                id="dialer-share-btn"
                onClick={onOpenShare}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 hover:text-white hover:bg-cyan-500/25 transition-colors text-xs font-semibold shadow-lg shadow-cyan-950/30"
                title="Share & Invite Friends with Deep Link"
              >
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden min-[360px]:inline">Share</span>
              </button>
            )}

            {/* Quick Filters Pill */}
            <button
              onClick={onOpenFilters}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[#142145] border border-[#273B78] text-slate-300 hover:text-white hover:bg-[#1D2E60] transition-colors text-xs font-semibold shadow-lg"
            >
              <span>🌍</span>
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Central QuikTalks Mega Circular Emblem */}
        <div className="relative my-1.5 sm:my-3 flex items-center justify-center shrink-0">
          
          {/* Outer Glow Ring with Official QuikTalks Branding */}
          <div className="w-40 h-40 min-[400px]:w-48 min-[400px]:h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-full bg-gradient-to-b from-[#281A54]/80 to-[#120D29]/90 border-4 border-[#3D2878] flex flex-col items-center justify-center shadow-2xl shadow-purple-950/70 relative p-2 sm:p-3">
            
            {/* Official Circular Icon */}
            <div className="w-12 h-12 min-[400px]:w-14 min-[400px]:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-0.5 sm:mb-1 drop-shadow-xl hover:scale-105 transition-transform">
              <QuikTalksIcon className="w-full h-full" />
            </div>

            <div className="text-lg min-[400px]:text-xl sm:text-2xl font-black tracking-wider text-white font-sans flex items-center">
              <span>Quik</span>
              <span className="text-cyan-400">Talks</span>
            </div>
            
            <div className="text-[9px] min-[400px]:text-[10px] sm:text-xs text-amber-300 font-semibold tracking-normal mt-0.5 sm:mt-1 px-2 text-center max-w-[160px] min-[400px]:max-w-[190px] sm:max-w-[200px] leading-tight">
              No camera, no sign-up - just talk!
            </div>
          </div>
        </div>

        {/* 4 Circular Action Buttons (Matching AirTalk Layout) */}
        <div className="grid grid-cols-4 gap-2.5 min-[400px]:gap-3.5 sm:gap-5 md:gap-6 my-1.5 sm:my-3 shrink-0">
          
          {/* 1. Green Call Button (Directly Dials / Starts Voice Chat) */}
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              id="dialer-call-btn"
              onClick={() => onStartMatching('voice')}
              className="w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95 transition-all"
              title="Start Voice Chat (Dial Stranger)"
            >
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <span className="text-[11px] sm:text-xs font-bold text-slate-100">Call</span>
          </div>

          {/* 2. Mute / Mic Check Button */}
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={onTestMicrophone}
              className={`w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border flex items-center justify-center shadow-md transition-all ${
                isMicTesting
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-[#152247] border-[#253974] hover:bg-[#1E2E5E] text-white'
              }`}
              title="Microphone Check"
            >
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <span className="text-[11px] sm:text-xs font-medium text-slate-300">
              {isMicTesting ? 'Testing...' : 'Mute'}
            </span>
          </div>

          {/* 3. Add Friend Button */}
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={onOpenFriends}
              className="w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#152247] hover:bg-[#1E2E5E] border border-[#253974] text-white flex items-center justify-center shadow-md transition-all"
              title="Friends List"
            >
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
            <span className="text-[11px] sm:text-xs font-medium text-slate-300">Add Friend</span>
          </div>

          {/* 4. Report Button */}
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={onOpenSafety}
              className="w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#152247] hover:bg-[#1E2E5E] border border-[#253974] text-white flex items-center justify-center shadow-md transition-all"
              title="Report & Safety"
            >
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </button>
            <span className="text-[11px] sm:text-xs font-medium text-slate-300">Report</span>
          </div>

        </div>

        {/* Checkbox & Call History Subrow */}
        <div className="flex items-center justify-center gap-3 text-[11px] sm:text-xs text-slate-300 mb-2 sm:mb-3 shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.autoCall || false}
              onChange={(e) => onUpdatePreferences({ autoCall: e.target.checked })}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>Enable Auto Call</span>
          </label>

          <span className="text-slate-600">|</span>

          <button
            onClick={onOpenCallLogs}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
          >
            <span className="text-emerald-400">📞</span>
            <span className="underline">Call History</span>
          </button>
        </div>

        {/* Instruction / Country Status Banner */}
        <div className="text-[11px] sm:text-xs md:text-sm text-slate-300 font-medium mb-2 sm:mb-3 shrink-0">
          Tap the <span className="text-emerald-400 font-bold">Call</span> button to call a new stranger
        </div>

        {/* Location identity badge & discrete owner access */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#121B38] border border-[#1E2C58] text-[11px] sm:text-xs text-slate-300 mb-2 shrink-0">
          <span>Your Identity:</span>
          <span className="text-sm sm:text-base">{getCountryFlag(userCountryCode)}</span>
          <span className="font-bold text-white">{getCountryName(userCountryCode)}</span>

          {onOpenAnalytics && (
            <button
              onClick={onOpenAnalytics}
              className="ml-2 text-slate-500 hover:text-cyan-400 transition-colors p-0.5 rounded"
              title="Owner Analytics Portal (Requires Passcode or Ctrl+Shift+A)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
          )}
        </div>

      </div>

      {/* DYNAMIC EDITABLE HOMEPAGE SEO CONTENT SECTION (Managed via Admin Console) */}
      <HomepageSeoSection />

    </div>
  );
};

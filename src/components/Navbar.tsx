import React, { useState } from 'react';
import { ChatMode } from '../types';
import { QuikTalksLogo } from './Logo';

interface NavbarProps {
  mode: ChatMode;
  onSelectMode: (mode: ChatMode) => void;
  onlineCount: number;
  onOpenFriends: () => void;
  onOpenCallLogs: () => void;
  onOpenSafety: () => void;
  onOpenFilters: () => void;
  onOpenGames: () => void;
  onOpenBlogs: () => void;
  onOpenShare?: () => void;
  onOpenAnalytics?: () => void;
  friendsCount: number;
  callLogsCount: number;
  isInCall: boolean;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onSelectMode,
  onlineCount,
  onOpenFriends,
  onOpenCallLogs,
  onOpenSafety,
  onOpenFilters,
  onOpenGames,
  onOpenBlogs,
  onOpenShare,
  onOpenAnalytics,
  friendsCount,
  callLogsCount,
  isInCall,
  onGoHome,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-[#1E294A] bg-[#0A1128] sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Left Side: Online Counter & Live Pulse */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          
          {/* Logo Glyph */}
          <div 
            onClick={onGoHome}
            className="flex items-center cursor-pointer group"
            title="QuikTalks — No camera, no sign-up - just talk!"
          >
            <QuikTalksLogo 
              iconSize="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform" 
              titleClassName="font-extrabold tracking-wider text-sm sm:text-base text-white font-sans ml-1 sm:ml-1.5"
            />
          </div>

          {/* Green Live Indicator + Counter */}
          <div className="hidden min-[360px]:flex items-center gap-1.5 bg-[#121B38] border border-[#1E2C58] rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs text-white">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 text-xs">👥</span>
            <span className="font-bold font-mono tracking-tight text-slate-100">
              {onlineCount.toLocaleString()}
            </span>
          </div>

        </div>

        {/* Center / Action Buttons (FILTERS, FRIENDS, GAMES, BLOGS) */}
        <div className="flex items-center gap-0.5 sm:gap-2">
          
          {/* Filters Button */}
          <button
            id="nav-filters-btn"
            onClick={onOpenFilters}
            className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-[#142042] transition-colors"
            title="Choose Country Flags & Gender Filters"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider">Filters</span>
          </button>

          {/* Friends Button */}
          <button
            id="nav-friends-btn"
            onClick={onOpenFriends}
            className="relative flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-[#142042] transition-colors"
            title="Mutual Friends & Callsign"
          >
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider">Friends</span>
            {friendsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white font-mono text-[9px] font-bold">
                {friendsCount}
              </span>
            )}
          </button>

          {/* Games & Icebreakers */}
          <button
            id="nav-games-btn"
            onClick={onOpenGames}
            className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-[#142042] transition-colors"
            title="Icebreaker Games & Questions"
          >
            <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider">Games</span>
          </button>

          {/* Blogs Button */}
          <button
            id="nav-blogs-btn"
            onClick={onOpenBlogs}
            className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-[#142042] transition-colors"
            title="Visit Blogs"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider">Blogs</span>
          </button>

          {/* Share & Invite Deep Link Button */}
          {onOpenShare && (
            <button
              id="nav-share-btn"
              onClick={onOpenShare}
              className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-xl text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all shadow-sm shadow-cyan-950/40"
              title="Share / Invite Friends to Session"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider">Share</span>
            </button>
          )}

          {/* Right Hamburger Menu */}
          <div className="relative">
            <button
              id="nav-menu-hamburger"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#142042] hover:bg-[#1B2A58] border border-[#23356E] flex items-center justify-center text-white transition-colors"
              title="Menu"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-[#0E1733] border border-[#24366A] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in select-none text-xs"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[#1C2A52]">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Quik</span><span className="text-cyan-400">Talks</span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-medium">
                    No camera, no sign-up - just talk!
                  </div>
                </div>

                <button
                  onClick={onOpenBlogs}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-amber-300 hover:bg-[#17244D] transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <span>Read Blogs</span>
                </button>

                {onOpenShare && (
                  <button
                    onClick={onOpenShare}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-cyan-300 hover:bg-[#17244D] transition-colors text-left font-medium"
                  >
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share & Invite Friends</span>
                  </button>
                )}

                <button
                  onClick={onOpenCallLogs}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-[#17244D] transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Call History ({callLogsCount})</span>
                </button>

                <button
                  onClick={onOpenSafety}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-[#17244D] transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>18+ Safety & Privacy Policy</span>
                </button>

                {onOpenAnalytics && (
                  <button
                    onClick={onOpenAnalytics}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-[#17244D] hover:text-cyan-300 transition-colors text-left"
                    title="Owner Analytics Portal (Requires Passcode)"
                  >
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Owner Analytics</span>
                  </button>
                )}

                <div className="my-1 border-t border-[#1C2A52]" />

                <button
                  onClick={() => onSelectMode(mode === 'voice' ? 'text' : 'voice')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-[#17244D] transition-colors text-left font-medium"
                >
                  <span>{mode === 'voice' ? '💬 Switch to Text Chat' : '📞 Switch to Voice Call'}</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

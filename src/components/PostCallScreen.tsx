import React, { useState } from 'react';
import { PeerInfo } from '../types';
import confetti from 'canvas-confetti';
import { getCountryFlag, getCountryName } from '../data/countries';
import { QuikTalksLogo } from './Logo';

interface PostCallScreenProps {
  durationSeconds: number;
  peerInfo: PeerInfo;
  commonTags: string[];
  onStartNewCall: () => void;
  onSendFriendRequest: (peerCallsign: string) => void;
  onReport: () => void;
  onBackHome: () => void;
  isFriendAdded: boolean;
  onOpenCallLogs?: () => void;
  callLogsCount?: number;
  onOpenShare?: () => void;
}

export const PostCallScreen: React.FC<PostCallScreenProps> = ({
  durationSeconds,
  peerInfo,
  commonTags,
  onStartNewCall,
  onSendFriendRequest,
  onReport,
  onBackHome,
  isFriendAdded,
  onOpenCallLogs,
  callLogsCount = 0,
  onOpenShare,
}) => {
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const handleAddFriend = () => {
    setFriendRequestSent(true);
    onSendFriendRequest(peerInfo.callsign || 'Stranger');
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#06B6D4', '#10B981'],
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-6 px-4">
      
      <div className="w-full max-w-xl mx-auto">
        
        {/* Left Column: Call Summary & Actions */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full bg-[#0A0F1D]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          
          <div className="w-full flex items-center justify-between mb-4">
            <QuikTalksLogo 
              iconSize="w-8 h-8"
              showTagline={true}
              taglineClassName="text-[11px] text-amber-300 font-medium"
              titleClassName="font-extrabold text-base text-white tracking-wide font-sans"
            />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Call Ended Safely
            </div>
          </div>

          <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-slate-100 mb-2">
            Airwaves Disconnected
          </h2>

          <p className="text-sm text-slate-400 mb-4">
            You just spoke with <strong className="text-slate-200">{peerInfo.callsign || 'Anonymous Stranger'}</strong> for <span className="font-mono text-amber-400 font-bold">{formatDuration(durationSeconds)}</span>.
          </p>

          {/* Caller Country Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-6">
            <span className="text-base">{getCountryFlag(peerInfo.country || 'US')}</span>
            <span className="font-medium text-slate-200">{getCountryName(peerInfo.country || 'US')}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              ✓ Verified Origin
            </span>
          </div>

          {/* Shared Tags Recap */}
          {commonTags.length > 0 && (
            <div className="mb-6 w-full">
              <span className="text-xs font-mono text-slate-400 block mb-2">Shared Topics:</span>
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {commonTags.map((t) => (
                  <span key={t} className="text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mutual Friend & Share Callout Option */}
          <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>Mutual Connect & Friend</span>
                <span className="text-[10px] text-cyan-400 font-mono">Optional</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Add each other to reconnect later on private frequencies.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onOpenShare && (
                <button
                  id="post-call-share-btn"
                  onClick={onOpenShare}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 hover:bg-cyan-500/25 transition-all flex items-center gap-1.5 shadow-sm"
                  title="Tell friends about QuikTalks"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share App</span>
                </button>
              )}

              <button
                id="add-mutual-friend-btn"
                onClick={handleAddFriend}
                disabled={friendRequestSent || isFriendAdded}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  friendRequestSent || isFriendAdded
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95'
                }`}
              >
                {isFriendAdded ? '✓ Already Friends' : friendRequestSent ? '✓ Friend Request Sent' : '+ Add as Friend'}
              </button>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center gap-3">
            <button
              id="start-next-call-btn"
              onClick={onStartNewCall}
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Talk to Next Stranger</span>
            </button>

            {onOpenCallLogs && (
              <button
                id="post-call-logs-btn"
                type="button"
                onClick={onOpenCallLogs}
                className="w-full sm:w-auto py-4 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 font-semibold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors"
                title="View Last 19 Call Logs"
              >
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Call Logs ({callLogsCount}/19)</span>
              </button>
            )}

            <button
              id="back-home-btn"
              onClick={onBackHome}
              className="w-full sm:w-auto py-4 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              Return Home
            </button>
          </div>

          {/* Report Link */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex justify-between items-center text-[11px] text-slate-400">
            <span>Encountered an issue during this call?</span>
            <button
              id="post-call-report-btn"
              onClick={onReport}
              className="text-red-400/80 hover:text-red-400 font-semibold"
            >
              Report Stranger
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

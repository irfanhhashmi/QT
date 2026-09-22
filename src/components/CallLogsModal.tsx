import React from 'react';
import { CallLog } from '../types';
import { getCountryFlag, getCountryName } from '../data/countries';

interface CallLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  callLogs: CallLog[];
  onClearLogs: () => void;
  onAddFriendFromLog?: (log: CallLog) => void;
}

export const CallLogsModal: React.FC<CallLogsModalProps> = ({
  isOpen,
  onClose,
  callLogs,
  onClearLogs,
  onAddFriendFromLog,
}) => {
  if (!isOpen) return null;

  // Compute Statistics
  const totalCalls = callLogs.length;
  const totalDurationSeconds = callLogs.reduce((acc, log) => acc + log.duration, 0);
  const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0;
  const voiceCallsCount = callLogs.filter((l) => l.mode === 'voice').length;
  const textChatsCount = callLogs.filter((l) => l.mode === 'text').length;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const formatTimestamp = (ms: number) => {
    const date = new Date(ms);
    const now = Date.now();
    const diffMins = Math.floor((now - ms) / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEndedReasonBadge = (reason: CallLog['endedReason']) => {
    switch (reason) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-medium">
            ✓ Finished
          </span>
        );
      case 'skipped':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-medium">
            ⏭ Next Stranger
          </span>
        );
      case 'peer_left':
        return (
          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-medium">
            📡 Stranger Left
          </span>
        );
      case 'hung_up':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-medium">
            ⏹ Hung Up
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0A0F1D] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-display text-2xl font-bold">Call History & Logs</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono text-xs border border-amber-500/30 font-semibold">
                  Last {totalCalls} / 19 Calls
                </span>
              </div>
              <p className="text-xs text-slate-400">Chronological logs and talk time of your latest conversations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 transition-all hover:scale-105"
          >
            ✕ Close
          </button>
        </div>

        {/* Top Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 shrink-0">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Total Call Time
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-amber-400">
              {formatDuration(totalDurationSeconds)}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Logged Calls
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-100">
              {totalCalls} <span className="text-xs text-slate-400 font-normal">/ 19</span>
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Avg Call Time
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-cyan-400">
              {formatDuration(avgDurationSeconds)}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Voice / Text
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-200">
              {voiceCallsCount}🎙 / {textChatsCount}💬
            </span>
          </div>

        </div>

        {/* Call Logs List Scroll Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
          {callLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-300">No Call Logs Yet</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Start talking with strangers on QuikTalks. Your recent calls and conversation durations will be recorded right here.
              </p>
            </div>
          ) : (
            callLogs.map((log, index) => {
              const callIndex = totalCalls - index;
              return (
                <div
                  key={log.id || `${log.timestamp}-${index}`}
                  className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                >
                  {/* Left: Call metadata & Caller info */}
                  <div className="flex items-center gap-3">
                    
                    {/* Index & Mode Icon */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-cyan-500/10 border border-slate-700 flex items-center justify-center text-lg">
                        {log.mode === 'voice' ? '🎙️' : '💬'}
                      </div>
                      <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-mono text-amber-400 flex items-center justify-center font-bold">
                        #{callIndex}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-100">
                          {log.callsign || 'Anonymous Stranger'}
                        </span>
                        {getEndedReasonBadge(log.endedReason)}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                        {log.country && (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                            <span>{getCountryFlag(log.country)}</span>
                            <span>{getCountryName(log.country)}</span>
                          </span>
                        )}
                        <span className="font-mono text-slate-400">{formatTimestamp(log.timestamp)}</span>
                        {log.tags && log.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {log.tags.slice(0, 2).map((t, idx) => (
                                <span key={idx} className="text-[10px] text-amber-300/80 font-mono bg-amber-500/10 px-1.5 py-0.2 rounded">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right: Call Time & Duration Badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Call Duration
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm sm:text-base font-bold text-amber-400">
                          {formatDuration(log.duration)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({log.duration}s)
                        </span>
                      </div>
                    </div>

                    {onAddFriendFromLog && (
                      <button
                        onClick={() => onAddFriendFromLog(log)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950/40 text-cyan-300 text-xs border border-slate-700 hover:border-cyan-500/30 transition-colors"
                        title="Add to Mutual Friends"
                      >
                        + Friend
                      </button>
                    )}

                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Automatically retains the last <strong className="text-slate-200">19 calls</strong> locally.
          </div>

          <div className="flex items-center gap-2">
            {callLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-300 text-xs border border-slate-800 transition-colors"
              >
                Clear Logs
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

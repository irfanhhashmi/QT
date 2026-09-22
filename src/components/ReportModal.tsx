import React, { useState } from 'react';
import { ReportPayload } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (payload: ReportPayload) => void;
  peerId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  peerId,
}) => {
  const [reason, setReason] = useState<ReportPayload['reason']>('harassment');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport({
      reason,
      details: details.trim(),
      reportedPeerId: peerId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0A0F1D] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif-display text-2xl font-bold text-slate-100">Report & Block Caller</h3>
            <p className="text-xs text-slate-400">Submitting will immediately skip and disconnect this user</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Reason for report:</label>
            <div className="space-y-2 text-xs">
              {[
                { id: 'harassment', label: 'Abuse, Harassment, Hate Speech or Bullying' },
                { id: 'inappropriate', label: 'Inappropriate or Explicit Audio / Sounds' },
                { id: 'spam', label: 'Spam, Automated Bot, or Advertising' },
                { id: 'underage', label: 'Suspected Underage User (< 18)' },
                { id: 'other', label: 'Other Safety Concern' },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    reason === item.id
                      ? 'bg-red-500/15 border-red-500/40 text-red-200 font-medium'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={item.id}
                    checked={reason === item.id}
                    onChange={() => setReason(item.id as ReportPayload['reason'])}
                    className="accent-red-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Additional details (optional):</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide context if needed..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-red-400 h-20 resize-none"
              maxLength={200}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-red-600/30 transition-transform active:scale-95"
            >
              Report & Disconnect
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

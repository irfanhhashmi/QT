import React, { useState } from 'react';

interface SafetyAndPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyAndPrivacyModal: React.FC<SafetyAndPrivacyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'safety' | 'privacy' | 'faq'>('safety');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0A0F1D] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-200 my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif-display text-2xl font-bold text-slate-100">Safety, Guidelines & Privacy</h3>
              <p className="text-[11px] text-slate-400 font-mono">QuikTalks Community Trust & 18+ Rules</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 shrink-0 border-b border-slate-800/80 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'safety'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ 18+ Safety Tips & Rules
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'privacy'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔒 Privacy & AdSense Policy
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'faq'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ❓ FAQ
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-slate-300">
          
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <strong className="block text-sm font-bold text-amber-300 mb-1">🔞 18+ Adult Platform Notice</strong>
                QuikTalks is strictly intended for individuals 18 years of age and older. Minor accounts or attempts by underage individuals to use QuikTalks are strictly prohibited and immediately banned.
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1.5">1. Keep Personal Information Secret</h4>
                <p className="text-slate-400">
                  Never disclose your real full name, home address, phone number, financial details, school, workplace, or social media handles to strangers on the airwaves.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1.5">2. Zero Tolerance for Harassment & Hate</h4>
                <p className="text-slate-400">
                  Hate speech, racism, misogyny, bullying, threats, sexual solicitation, and non-consensual behavior will result in an immediate IP and hardware ban.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1.5">3. One-Tap Skip and Report</h4>
                <p className="text-slate-400">
                  If anyone makes you feel uncomfortable, immediately hit the <strong>Next Stranger</strong> or <strong>Report</strong> button. You will be instantly disconnected and rematched with someone new.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1.5">Audio Streams & Peer-to-Peer Privacy</h4>
                <p className="text-slate-400">
                  QuikTalks connects callers using direct browser-to-browser WebRTC encryption. <strong>We do not record, tap, transcribe, or store your voice audio on our servers.</strong> Once your call ends, the audio stream ceases immediately and completely.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1.5">Zero Data Selling</h4>
                <p className="text-slate-400">
                  QuikTalks requires no email, no phone number, and no password. We never sell personal identity profiles because we do not collect them.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">Is QuikTalks really 100% free?</h4>
                <p className="text-slate-400">
                  Yes! All features (language filters, topic tags, and region preferences) are 100% free and open for everyone with zero subscriptions or signups.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">Why is there no camera or video?</h4>
                <p className="text-slate-400">
                  "No camera, no sign-up - just talk!" Video chat often comes with unwanted visual exposure and pressure. Voice-only conversations restore genuine intimacy, spontaneity, and comfort without camera anxiety.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">How does the 15-second gender fallback work?</h4>
                <p className="text-slate-400">
                  If you pick a preferred gender, the matchmaking system will prioritize searching for that match for 15 seconds. If no one with that self-reported gender is in queue, it automatically expands the pool to connect you with any available stranger so you don't wait forever. You can enable "Strict Mode" if you wish to disable this fallback.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Close */}
        <div className="mt-4 pt-3 border-t border-slate-800 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            I Understand & Accept
          </button>
        </div>

      </div>
    </div>
  );
};

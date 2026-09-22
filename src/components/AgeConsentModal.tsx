import React from 'react';

interface AgeConsentModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AgeConsentModal: React.FC<AgeConsentModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-[#16203D] border border-[#23315B] rounded-3xl p-6 shadow-2xl relative text-slate-100 flex flex-col">
        
        {/* Shield Icon Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#28396D] flex items-center justify-center text-indigo-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-bold text-lg text-white">Before You Join a Call</h3>
        </div>

        {/* 18+ Terms Notice */}
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          You must be <strong className="text-white font-bold">18+</strong> to use this service. By continuing, you agree to our{' '}
          <span className="text-indigo-300 underline cursor-pointer">Terms of Service</span> and{' '}
          <span className="text-indigo-300 underline cursor-pointer">Privacy Policy</span>.
        </p>

        {/* AI & Safety Points */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2.5 text-xs text-slate-300">
            <span className="text-base shrink-0">🤖</span>
            <p>
              We use AI to keep calls safe in real time — no data is stored.{' '}
              <span className="text-indigo-300 underline cursor-pointer">Read more.</span>
            </p>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-300">
            <span className="text-base shrink-0">🎤</span>
            <p>
              We use AI voice analysis to make your premium matching experience better.{' '}
              <span className="text-indigo-300 underline cursor-pointer">Read more.</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-900/40"
          >
            I Agree
          </button>
        </div>

      </div>
    </div>
  );
};

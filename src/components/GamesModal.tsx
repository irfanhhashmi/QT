import React, { useState } from 'react';

interface GamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareToChat?: (text: string) => void;
}

const WOULD_YOU_RATHER = [
  'Would you rather be able to fly at 20 mph or teleport once every 24 hours?',
  'Would you rather know the history of every object you touch or be able to talk to animals?',
  'Would you rather always speak your mind with zero filter or never be able to speak again?',
  'Would you rather explore deep ocean trenches or uncharted outer space?',
  'Would you rather have infinite money but only live in 1 city forever, or travel anywhere anytime on $20/day?',
  'Would you rather have a pause button or a rewind button for your life?',
];

const TWO_TRUTHS_IDEAS = [
  'Share 2 real crazy things that happened to you and 1 lie. See if your partner can guess!',
  'Share your favorite food, a food you hate, and a food you pretend to love.',
  'Tell 3 places you claimed to have traveled to (1 is fake).',
];

const DEEP_PROMPTS = [
  'What is the best piece of advice anyone has ever given you?',
  'If you could master one skill instantly by snapping your fingers, what would it be?',
  'What is something you believed strongly 5 years ago that you changed your mind on?',
  'What is your favorite late-night comfort song or album?',
  'What is something simple that made you smile today?',
];

const TRIVIA_QUESTIONS = [
  { q: 'What is the only mammal capable of true sustained flight?', a: 'The Bat 🦇' },
  { q: 'Which country has the most natural lakes in the world?', a: 'Canada 🇨🇦 (over 60% of all lakes on Earth)' },
  { q: 'What year did the first voice call take place?', a: '1876 (Alexander Graham Bell)' },
  { q: 'What color is a sunset on Mars?', a: 'Blue 🪐' },
];

export const GamesModal: React.FC<GamesModalProps> = ({ isOpen, onClose, onShareToChat }) => {
  const [activeTab, setActiveTab] = useState<'wyr' | 'truths' | 'deep' | 'trivia'>('wyr');
  const [wyrIndex, setWyrIndex] = useState(0);
  const [deepIndex, setDeepIndex] = useState(0);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [showTriviaAnswer, setShowTriviaAnswer] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0C152B] border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center text-lg">
              🎮
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Icebreakers & Call Games</h3>
              <p className="text-[11px] text-slate-400">Fun conversation starters to play with strangers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Pills */}
        <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 mb-4 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('wyr')}
            className={`py-1.5 px-1 text-center rounded-xl transition-all ${
              activeTab === 'wyr'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Would You
          </button>
          <button
            onClick={() => setActiveTab('truths')}
            className={`py-1.5 px-1 text-center rounded-xl transition-all ${
              activeTab === 'truths'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2 Truths 1 Lie
          </button>
          <button
            onClick={() => setActiveTab('deep')}
            className={`py-1.5 px-1 text-center rounded-xl transition-all ${
              activeTab === 'deep'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deep Talk
          </button>
          <button
            onClick={() => setActiveTab('trivia')}
            className={`py-1.5 px-1 text-center rounded-xl transition-all ${
              activeTab === 'trivia'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trivia
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'wyr' && (
            <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-2">🤔 Would You Rather</span>
              <p className="text-base font-semibold text-slate-100 my-3 leading-relaxed">
                "{WOULD_YOU_RATHER[wyrIndex]}"
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setWyrIndex((prev) => (prev + 1) % WOULD_YOU_RATHER.length)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Next Question 🎲
                </button>
                {onShareToChat && (
                  <button
                    onClick={() => onShareToChat(WOULD_YOU_RATHER[wyrIndex])}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                  >
                    Send to Chat 💬
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'truths' && (
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider block mb-1">🎭 2 Truths & 1 Lie Game</span>
              <p className="text-xs text-slate-300">
                Take turns telling each other 3 statements about your life: 2 are true, and 1 is a lie. See if your voice partner can guess which one is the lie!
              </p>
              <div className="space-y-2 pt-2">
                {TWO_TRUTHS_IDEAS.map((idea, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200">
                    💡 {idea}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deep' && (
            <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-2">✨ Deep Question</span>
              <p className="text-base font-semibold text-slate-100 my-3 leading-relaxed">
                "{DEEP_PROMPTS[deepIndex]}"
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setDeepIndex((prev) => (prev + 1) % DEEP_PROMPTS.length)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Next Prompt 💫
                </button>
                {onShareToChat && (
                  <button
                    onClick={() => onShareToChat(DEEP_PROMPTS[deepIndex])}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                  >
                    Send to Chat 💬
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'trivia' && (
            <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-2">🧠 Trivia Challenge</span>
              <p className="text-sm font-semibold text-slate-100 my-2">
                "{TRIVIA_QUESTIONS[triviaIndex].q}"
              </p>
              {showTriviaAnswer ? (
                <div className="my-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  Answer: {TRIVIA_QUESTIONS[triviaIndex].a}
                </div>
              ) : (
                <button
                  onClick={() => setShowTriviaAnswer(true)}
                  className="my-2 text-xs text-indigo-400 underline hover:text-indigo-300"
                >
                  Reveal Answer 👁️
                </button>
              )}
              <button
                onClick={() => {
                  setShowTriviaAnswer(false);
                  setTriviaIndex((prev) => (prev + 1) % TRIVIA_QUESTIONS.length);
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
              >
                Next Trivia 🎯
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

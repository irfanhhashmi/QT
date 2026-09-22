import React, { useState } from 'react';
import { MutualFriend, UserProfile } from '../types';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  friends: MutualFriend[];
  onRemoveFriend: (id: string) => void;
  onCallFriend: (frequencyCode: string) => void;
  onOpenShare?: () => void;
}

const AVATAR_SEEDS = ['📻', '🎙️', '🌌', '⚡', '🌙', '🎧', '🕊️', '🪐', '🌊', '🔥'];

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  friends,
  onRemoveFriend,
  onCallFriend,
  onOpenShare,
}) => {
  const [isEditingCallsign, setIsEditingCallsign] = useState(false);
  const [callsignDraft, setCallsignDraft] = useState(profile.callsign);
  const [bioDraft, setBioDraft] = useState(profile.bio);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      callsign: callsignDraft.trim() || `Caller #${Math.floor(100 + Math.random() * 900)}`,
      bio: bioDraft.trim(),
    });
    setIsEditingCallsign(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0A0F1D] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95">
        
        {/* Header with Prominent Return Link */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl">
              {profile.avatarSeed || '🎙️'}
            </div>
            <div>
              <h3 className="font-serif-display text-2xl font-bold">Mutual Connections</h3>
              <p className="text-xs text-slate-400">Private frequencies with people you've talked to</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            ← Skip, take me back to talking
          </button>
        </div>

        {/* Lightweight Optional Callsign / Profile Badge */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Your Radio Callsign</span>
            <button
              onClick={() => setIsEditingCallsign(!isEditingCallsign)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              {isEditingCallsign ? 'Cancel' : 'Edit Callsign'}
            </button>
          </div>

          {isEditingCallsign ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 mt-2">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Callsign / Nickname</label>
                <input
                  type="text"
                  value={callsignDraft}
                  onChange={(e) => setCallsignDraft(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  maxLength={24}
                  placeholder="e.g. MidnightVoyager"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Pick Avatar Emblem</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_SEEDS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onUpdateProfile({ avatarSeed: emoji })}
                      className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border transition-all ${
                        profile.avatarSeed === emoji
                          ? 'bg-amber-500/20 border-amber-400 scale-110'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Short Bio (Optional)</label>
                <input
                  type="text"
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  maxLength={60}
                  placeholder="e.g. Loves jazz, indie games, and 3am philosophy"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Save Callsign
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                  <span>{profile.callsign}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Active
                  </span>
                </div>
                {profile.bio && <p className="text-xs text-slate-400 mt-0.5">{profile.bio}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Mutual Friends List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Mutual Voice Friends ({friends.length})
            </h4>
            <span className="text-[11px] text-slate-400">Mutual adds only</span>
          </div>

          {friends.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <div className="text-3xl mb-2">📻</div>
              <h5 className="text-sm font-semibold text-slate-300">No mutual connections yet</h5>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed mb-4">
                Talk to people to add mutual friends, or generate a private invite link and send it directly to your real-life friends!
              </p>
              {onOpenShare && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenShare();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-950/40 inline-flex items-center gap-1.5 transition-all"
                >
                  <span>🔗</span>
                  <span>Invite Friends via Deep Link</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-serif-display font-bold">
                      {friend.callsign[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{friend.callsign}</div>
                      <div className="text-[10px] font-mono text-amber-400">Freq: {friend.frequencyCode}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onCallFriend(friend.frequencyCode)}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-transform active:scale-95"
                    >
                      Call
                    </button>
                    <button
                      onClick={() => onRemoveFriend(friend.id)}
                      className="text-slate-400 hover:text-red-400 text-xs p-1.5"
                      title="Remove Friend"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Close & Return to Chat
          </button>
        </div>

      </div>
    </div>
  );
};

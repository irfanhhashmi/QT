import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  MessageCircle,
  Send,
  Mail,
  Smartphone,
  Radio,
  LogIn,
  RefreshCw,
  X,
  Volume2,
  MessageSquare,
  ShieldCheck,
  Zap,
  Globe,
  Heart,
  Share,
  Download,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { ChatMode } from '../types';
import { QuikTalksIcon } from './Logo';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId?: string | null;
  isInCall: boolean;
  currentMode: ChatMode;
  userCallsign?: string;
  onJoinPrivateRoom: (roomCode: string, mode: ChatMode) => void;
}

type ShareTab = 'site' | 'room' | 'join';
type MessagePresetKey = 'friendly' | 'discovery' | 'latenight' | 'punchy' | 'custom';

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  currentRoomId,
  isInCall,
  currentMode,
  userCallsign = 'Anonymous',
  onJoinPrivateRoom,
}) => {
  // Default to 'room' if actively in a call, otherwise 'site' (tell a friend about this great site)
  const [activeTab, setActiveTab] = useState<ShareTab>(isInCall ? 'room' : 'site');
  const [selectedPreset, setSelectedPreset] = useState<MessagePresetKey>('friendly');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinMode, setJoinMode] = useState<ChatMode>(currentMode || 'voice');
  const [isCopied, setIsCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<'all' | 'link' | 'discord' | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQrExpanded, setShowQrExpanded] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [roomStatus, setRoomStatus] = useState<{ hasWaitingPeer?: boolean; waitingCallsign?: string | null; isOccupied?: boolean } | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Generate random readable room code
  const generateNewRoomCode = () => {
    const prefixes = ['TALK', 'VOX', 'WAVE', 'CHAT', 'PULSE', 'LINK', 'CALL', 'ECHO'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const newCode = `${prefix}-${num}`;
    setRoomCode(newCode);
    return newCode;
  };

  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
      setCopiedType(null);
      setJoinError(null);
      if (isInCall && currentRoomId) {
        const clean = currentRoomId.replace(/^room_priv_|^room_/, '').toUpperCase();
        setRoomCode(clean);
        setActiveTab('room');
      } else {
        if (!roomCode) generateNewRoomCode();
        if (!isInCall) setActiveTab('site');
      }
    }
  }, [isOpen, isInCall, currentRoomId]);

  // Official production URL for sharing
  const BASE_SITE_URL = 'https://quiktalks.com';

  // Clean Site URL (quiktalks.com)
  const getSiteUrl = () => {
    return BASE_SITE_URL;
  };

  const siteUrl = getSiteUrl();

  // Private Room Deep Link URL (https://quiktalks.com/?room=ROOM_CODE)
  const getRoomShareUrl = (codeToUse?: string) => {
    const code = (codeToUse || roomCode || '').trim();
    return `${BASE_SITE_URL}/?room=${encodeURIComponent(code)}`;
  };

  const roomShareUrl = getRoomShareUrl();

  // Preset Recommendation Messages (person telling others about this great site)
  const PRESET_MESSAGES: Record<Exclude<MessagePresetKey, 'custom'>, { title: string; desc: string; text: string; icon: string }> = {
    friendly: {
      title: 'Friendly & Casual',
      desc: 'Great for messaging best friends & groups',
      icon: '💬',
      text: `Hey! You've gotta check out QuikTalks — "No camera, no sign-up - just talk!" Instant 1-on-1 anonymous voice & text chat with cool people worldwide. 100% free with zero downloads! 🚀`,
    },
    discovery: {
      title: 'Cool Discovery',
      desc: 'Share a neat web app you found',
      icon: '🎙️',
      text: `Found this awesome website called QuikTalks. "No camera, no sign-up - just talk!" Hop into instant 1-on-1 random voice calls with crystal-clear audio and zero logins.`,
    },
    latenight: {
      title: 'Late Night Chat',
      desc: 'When you are bored or looking for real talk',
      icon: '🌌',
      text: `Looking for genuine conversations? Try QuikTalks — "No camera, no sign-up - just talk!" Instant 1-on-1 voice & text chat with people from all over the world without making an account.`,
    },
    punchy: {
      title: 'Short & Punchy',
      desc: 'Quick link with key highlights',
      icon: '⚡',
      text: `Check out QuikTalks — No camera, no sign-up - just talk! 100% free anonymous voice chat:`,
    },
  };

  // Resolve current active text to share
  const activeRecommendationText =
    selectedPreset === 'custom'
      ? customMessage || PRESET_MESSAGES.friendly.text
      : PRESET_MESSAGES[selectedPreset].text;

  const fullSiteShareText = `${activeRecommendationText}\n\n👉 Try it here: ${siteUrl}`;
  const fullRoomShareText = `Hey! Hop on a private ${currentMode === 'voice' ? 'voice call' : 'chat'} with me on QuikTalks! Frequency room: ${roomCode}\n\n👉 Join instantly: ${roomShareUrl}`;

  const currentShareUrl = activeTab === 'room' ? roomShareUrl : siteUrl;
  const currentFullText = activeTab === 'room' ? fullRoomShareText : fullSiteShareText;

  // Generate QR Code data URL whenever active URL changes
  useEffect(() => {
    if (!currentShareUrl) return;
    QRCode.toDataURL(currentShareUrl, {
      width: 340,
      margin: 2,
      color: {
        dark: '#030712',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR Code error:', err));
  }, [currentShareUrl]);

  // Copy helper with visual toast and confetti
  const triggerCopyFeedback = (type: 'all' | 'link' | 'discord' = 'all') => {
    setIsCopied(true);
    setCopiedType(type);
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06B6D4', '#3B82F6', '#10B981', '#F59E0B'],
      });
    } catch {}
    setTimeout(() => {
      setIsCopied(false);
      setCopiedType(null);
    }, 2800);
  };

  const handleCopy = async (textToCopy: string, type: 'all' | 'link' | 'discord' = 'all') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      triggerCopyFeedback(type);
    } catch (err) {
      console.warn('Failed to copy text:', err);
    }
  };

  // Native Web Share Sheet
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeTab === 'room' ? `Join my QuikTalks ${currentMode} session` : 'QuikTalks — Anonymous Voice & Text Chat',
          text: activeTab === 'room' ? `Talk with me on QuikTalks! Room: ${roomCode}` : activeRecommendationText,
          url: currentShareUrl,
        });
        triggerCopyFeedback('all');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy(currentFullText, 'all');
        }
      }
    } else {
      handleCopy(currentFullText, 'all');
    }
  };

  // 1-Click Social Channel URL Generators
  const encodedText = encodeURIComponent(currentFullText);
  const encodedUrl = encodeURIComponent(currentShareUrl);
  const encodedTitle = encodeURIComponent('QuikTalks — Instant Anonymous Voice & Text Chat with Strangers');

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(activeTab === 'room' ? `Join my voice room on QuikTalks (Room: ${roomCode})` : activeRecommendationText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(activeTab === 'room' ? `Hop on a private ${currentMode} call with me on QuikTalks! Room: ${roomCode}` : `${activeRecommendationText} #QuikTalks #TalkToStrangers #RandomVoiceChat`)}&url=${encodedUrl}`;
  const redditUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const smsUrl = `sms:?&body=${encodedText}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(activeTab === 'room' ? 'Join my QuikTalks session' : 'Check out this awesome site: QuikTalks')}&body=${encodedText}`;

  // Download QR Code
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = activeTab === 'room' ? `quicktalks-room-${roomCode}.png` : 'quicktalks-site-qr.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Start waiting in generated private room
  const handleStartHostRoom = () => {
    onClose();
    onJoinPrivateRoom(roomCode, currentMode);
  };

  // Join Room by code or link
  const handleJoinByCode = () => {
    setJoinError(null);
    let code = joinCodeInput.trim();
    if (!code) {
      setJoinError('Please enter a room code or invite link');
      return;
    }

    if (code.includes('?room=') || code.includes('&room=')) {
      try {
        const urlObj = new URL(code.startsWith('http') ? code : `http://${code}`);
        const parsed = urlObj.searchParams.get('room') || urlObj.searchParams.get('join') || urlObj.searchParams.get('code');
        if (parsed) code = parsed;
      } catch {}
    }

    code = code.replace(/[^a-zA-Z0-9-_]/g, '').toUpperCase();
    if (code.length < 3) {
      setJoinError('Room codes must be at least 3 characters');
      return;
    }

    onClose();
    onJoinPrivateRoom(code, joinMode);
  };

  // Real-time room status checker
  const handleCheckCodeStatus = async (inputVal: string) => {
    setJoinCodeInput(inputVal);
    let clean = inputVal.trim();
    if (clean.includes('room=')) {
      try {
        const u = new URL(clean.startsWith('http') ? clean : `http://${clean}`);
        clean = u.searchParams.get('room') || clean;
      } catch {}
    }
    clean = clean.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();

    if (clean.length >= 3) {
      setCheckingStatus(true);
      try {
        const res = await fetch(`/api/room/${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          setRoomStatus(data);
          if (data.mode) setJoinMode(data.mode);
        } else {
          setRoomStatus(null);
        }
      } catch {
        setRoomStatus(null);
      } finally {
        setCheckingStatus(false);
      }
    } else {
      setRoomStatus(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in select-none">
      <div className="w-full max-w-xl bg-[#0D152D] border border-[#23356E] rounded-3xl p-4 sm:p-6 shadow-2xl relative text-slate-100 animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Close Button */}
        <button
          id="share-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-[#16234D] hover:bg-[#1F316B] border border-[#273B7B] flex items-center justify-center text-slate-300 hover:text-white transition-colors z-20"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 border-b border-[#1E2E60] pb-3.5 shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden shadow-lg shadow-purple-950/50 shrink-0 border border-[#3D2878]">
            <QuikTalksIcon className="w-full h-full" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl text-white tracking-tight flex items-center gap-2 font-sans">
              <span>Tell Others About QuikTalks</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase">
                Spread the Word
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              "No camera, no sign-up - just talk!" Share with friends or start a private room.
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Site vs Room vs Join) */}
        <div className="flex items-center p-1 bg-[#090E20] border border-[#1C2A55] rounded-2xl mb-4 shrink-0">
          <button
            id="share-tab-site"
            onClick={() => setActiveTab('site')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'site'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tell a Friend (Site)</span>
          </button>

          <button
            id="share-tab-room"
            onClick={() => setActiveTab('room')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'room'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isInCall ? 'Current Call Link' : 'Private 1-on-1 Call'}</span>
          </button>

          {!isInCall && (
            <button
              id="share-tab-join"
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Join with Code</span>
            </button>
          )}
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-200 custom-scrollbar">

          {/* ========================================================= */}
          {/* TAB 1: TELL A FRIEND / RECOMMEND SITE                     */}
          {/* ========================================================= */}
          {activeTab === 'site' && (
            <div className="space-y-4">
              
              {/* Message Persona / Vibe Presets Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Choose Recommendation Style</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Personalized templates</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(PRESET_MESSAGES) as Array<Exclude<MessagePresetKey, 'custom'>>).map((key) => {
                    const preset = PRESET_MESSAGES[key];
                    const isSelected = selectedPreset === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedPreset(key)}
                        className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400/40'
                            : 'bg-[#090F24] border-[#1C2C5E] text-slate-400 hover:bg-[#121B3D] hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{preset.icon}</span>
                          <span className="text-[11px] font-bold truncate text-slate-100">{preset.title}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 line-clamp-1">{preset.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 bg-gradient-to-b from-[#0B1330] to-[#070B1A] border border-[#1F316B] rounded-2xl relative shadow-inner">
                <div className="flex items-center justify-between border-b border-[#1A2958] pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 shadow-sm">
                      <QuikTalksIcon className="w-full h-full" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white tracking-wide font-sans block leading-none">
                        Quik<span className="text-cyan-400">Talks</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium leading-none">
                        No camera, no sign-up - just talk!
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live Preview
                  </span>
                </div>

                {/* Card Text Content */}
                {selectedPreset === 'custom' ? (
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Write your custom recommendation message here..."
                    className="w-full bg-[#050814] border border-[#23356E] focus:border-cyan-400 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
                  />
                ) : (
                  <p className="text-xs text-slate-200 leading-relaxed font-sans select-text bg-[#070C1E]/70 p-2.5 rounded-xl border border-[#16244F]">
                    "{activeRecommendationText}"
                  </p>
                )}

                {/* Feature Chips Badge Bar */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#132048] text-cyan-300 border border-[#233774]">
                    🎙️ Anonymous Voice
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#132048] text-blue-300 border border-[#233774]">
                    💬 Text Chat
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#132048] text-emerald-300 border border-[#233774]">
                    🔒 Zero Sign-up
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#132048] text-amber-300 border border-[#233774]">
                    ⚡ Instant 1-Click
                  </span>
                </div>

                {/* Clean URL Footer on Card */}
                <div className="mt-2.5 pt-2 border-t border-[#16234D] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="truncate text-cyan-300">{siteUrl}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPreset(selectedPreset === 'custom' ? 'friendly' : 'custom')}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 ml-2 shrink-0"
                  >
                    {selectedPreset === 'custom' ? 'Use Preset' : 'Custom Note ✏️'}
                  </button>
                </div>
              </div>

              {/* Primary 1-Click Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  id="share-copy-full-msg-btn"
                  onClick={() => handleCopy(fullSiteShareText, 'all')}
                  className={`py-3 px-4 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isCopied && copiedType === 'all'
                      ? 'bg-emerald-600 text-white shadow-emerald-950/50 scale-[0.99]'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-950/50 active:scale-98'
                  }`}
                >
                  {isCopied && copiedType === 'all' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied Message & Link! 🎉</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full Message & Link</span>
                    </>
                  )}
                </button>

                <button
                  id="share-copy-link-only-btn"
                  onClick={() => handleCopy(siteUrl, 'link')}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                    isCopied && copiedType === 'link'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-[#121E42] hover:bg-[#1A2C60] border-[#223670] text-slate-200'
                  }`}
                >
                  {isCopied && copiedType === 'link' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span>Copy Site Link Only</span>
                    </>
                  )}
                </button>
              </div>

              {/* Social Channels Grid */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-300 mb-2">
                  Share Instantly to Socials & Messaging
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  
                  {/* System Native Share Drawer */}
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      id="share-site-native"
                      onClick={handleNativeShare}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                      title="Share via device menu"
                    >
                      <Smartphone className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-[10px] text-slate-300">Device</span>
                    </button>
                  )}

                  {/* WhatsApp */}
                  <a
                    id="share-site-whatsapp"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-[10px] text-slate-300">WhatsApp</span>
                  </a>

                  {/* Telegram */}
                  <a
                    id="share-site-telegram"
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                    title="Share on Telegram"
                  >
                    <Send className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-[10px] text-slate-300">Telegram</span>
                  </a>

                  {/* Twitter / X */}
                  <a
                    id="share-site-twitter"
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                    title="Post on X (Twitter)"
                  >
                    <span className="font-bold text-xs text-white group-hover:scale-110 transition-transform mb-1">𝕏</span>
                    <span className="text-[10px] text-slate-300">Post</span>
                  </a>

                  {/* Reddit */}
                  <a
                    id="share-site-reddit"
                    href={redditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                    title="Submit to Reddit"
                  >
                    <span className="text-orange-400 text-xs font-bold group-hover:scale-110 transition-transform mb-1">r/</span>
                    <span className="text-[10px] text-slate-300">Reddit</span>
                  </a>

                  {/* Facebook */}
                  <a
                    id="share-site-facebook"
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                    title="Share on Facebook"
                  >
                    <span className="text-blue-400 text-xs font-bold group-hover:scale-110 transition-transform mb-1">fb</span>
                    <span className="text-[10px] text-slate-300">Facebook</span>
                  </a>

                  {/* SMS / iMessage */}
                  <a
                    id="share-site-sms"
                    href={smsUrl}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                    title="Send via SMS / iMessage"
                  >
                    <Smartphone className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-[10px] text-slate-300">SMS</span>
                  </a>

                  {/* Email */}
                  <a
                    id="share-site-email"
                    href={emailUrl}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                    title="Send via Email"
                  >
                    <Mail className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-[10px] text-slate-300">Email</span>
                  </a>

                </div>
              </div>

              {/* Site QR Code Collapsible Section */}
              <div className="p-3 bg-[#090F24] border border-[#1E2E62] rounded-2xl">
                <div 
                  onClick={() => setShowQrExpanded(!showQrExpanded)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">Show Site QR Code (In-Person Scan)</span>
                  </div>
                  <span className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold">
                    {showQrExpanded ? 'Hide QR' : 'Show QR'}
                  </span>
                </div>

                {showQrExpanded && qrDataUrl && (
                  <div className="mt-3 pt-3 border-t border-[#1C2C5C] flex flex-col items-center animate-in fade-in">
                    <div className="p-3 bg-white rounded-2xl shadow-2xl border border-slate-700 inline-block">
                      <img 
                        src={qrDataUrl} 
                        alt="QuikTalks QR Code" 
                        className="w-44 h-44 rounded-lg object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-slate-300 text-center mt-2 font-medium">
                      Point any phone camera to instantly launch QuikTalks!
                    </p>
                    <button
                      onClick={handleDownloadQr}
                      className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save QR Image</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRIVATE FREQUENCY / 1-ON-1 ROOM INVITE              */}
          {/* ========================================================= */}
          {activeTab === 'room' && (
            <div className="space-y-4">
              
              {/* Room Code Badge */}
              <div className="p-3.5 bg-[#090F24] border border-[#1E2E62] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                    {isInCall ? 'Current Session Frequency' : 'Private 1-on-1 Frequency'}
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono tracking-widest text-cyan-300">
                    {roomCode}
                  </span>
                </div>
                
                {!isInCall && (
                  <button
                    id="share-regenerate-code-btn"
                    onClick={generateNewRoomCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14224D] hover:bg-[#1E3272] border border-[#273F85] text-xs text-cyan-300 font-semibold transition-colors"
                    title="Generate a different room code"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>New Code</span>
                  </button>
                )}
              </div>

              {/* Direct Room Deep Link URL Box */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Direct Room Deep Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#070B1A] border border-[#1C2A58] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 truncate select-all">
                    {roomShareUrl}
                  </div>
                  <button
                    id="share-copy-room-link-btn"
                    onClick={() => handleCopy(roomShareUrl, 'link')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-lg ${
                      isCopied && copiedType === 'link'
                        ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-cyan-950/40'
                    }`}
                  >
                    {isCopied && copiedType === 'link' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Share to Channels */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-2">
                  Invite via Socials & Messengers
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleNativeShare}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                    >
                      <Smartphone className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-[10px] text-slate-300">Device</span>
                    </button>
                  )}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-[10px] text-slate-300">WhatsApp</span>
                  </a>
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                  >
                    <Send className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-[10px] text-slate-300">Telegram</span>
                  </a>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                  >
                    <span className="font-bold text-xs text-white group-hover:scale-110 transition-transform mb-1">𝕏</span>
                    <span className="text-[10px] text-slate-300">Post</span>
                  </a>
                  <a
                    href={smsUrl}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                  >
                    <Smartphone className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-[10px] text-slate-300">SMS</span>
                  </a>
                  <a
                    href={emailUrl}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#121E42] hover:bg-[#1A2C60] border border-[#223670] transition-colors group"
                  >
                    <Mail className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-[10px] text-slate-300">Email</span>
                  </a>
                </div>
              </div>

              {/* Room QR Code */}
              <div className="p-3 bg-[#090F24] border border-[#1E2E62] rounded-2xl">
                <div 
                  onClick={() => setShowQrExpanded(!showQrExpanded)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">Scan Room QR Code on Mobile</span>
                  </div>
                  <span className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold">
                    {showQrExpanded ? 'Hide QR' : 'Show QR'}
                  </span>
                </div>

                {showQrExpanded && qrDataUrl && (
                  <div className="mt-3 pt-3 border-t border-[#1C2C5C] flex flex-col items-center animate-in fade-in">
                    <div className="p-2.5 bg-white rounded-2xl shadow-xl border border-slate-700 inline-block">
                      <img 
                        src={qrDataUrl} 
                        alt="Room QR Code" 
                        className="w-44 h-44 rounded-lg object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 text-center mt-2">
                      Scan to jump straight into room <span className="font-mono text-cyan-300 font-bold">{roomCode}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Host Action Button */}
              {!isInCall && (
                <div className="pt-2">
                  <button
                    id="share-start-waiting-room-btn"
                    onClick={handleStartHostRoom}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Start Waiting in Room ({roomCode})</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-1.5">
                    You'll enter the room immediately. When your friend opens the link, you will connect automatically!
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: JOIN WITH ROOM CODE OR LINK                         */}
          {/* ========================================================= */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Enter Room Code or Paste Invite Link
                </label>
                <input
                  id="share-join-code-input"
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => handleCheckCodeStatus(e.target.value)}
                  placeholder="e.g. TALK-749 or https://quiktalks.com/?room=TALK-749"
                  className="w-full bg-[#080D20] border border-[#22356B] focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                  autoFocus
                />
                {joinError && (
                  <p className="text-xs text-rose-400 mt-1 font-medium">{joinError}</p>
                )}
              </div>

              {/* Live Room Status Indicator */}
              {joinCodeInput.trim().length >= 3 && (
                <div className="p-3 rounded-2xl bg-[#090F24] border border-[#1E2E62] text-xs">
                  {checkingStatus ? (
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      Checking room status...
                    </span>
                  ) : roomStatus?.hasWaitingPeer ? (
                    <div className="flex items-center gap-2 text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>
                        <strong>{roomStatus.waitingCallsign || 'A friend'}</strong> is currently waiting in this room!
                      </span>
                    </div>
                  ) : roomStatus?.isOccupied ? (
                    <div className="flex items-center gap-2 text-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Room is currently in an active session.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Room is ready. Joining will connect you as soon as your friend arrives!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mode Selector for joining */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Join Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setJoinMode('voice')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      joinMode === 'voice'
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                        : 'bg-[#0A1024] border-[#1C2A55] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Voice Call</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setJoinMode('text')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      joinMode === 'text'
                        ? 'bg-blue-500/15 border-blue-400 text-blue-300'
                        : 'bg-[#0A1024] border-[#1C2A55] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span>Text Chat</span>
                  </button>
                </div>
              </div>

              {/* Connect Action Button */}
              <div className="pt-2">
                <button
                  id="share-join-room-submit-btn"
                  onClick={handleJoinByCode}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Connect to Private Frequency</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Security & Zero Signup Note Footer */}
        <div className="mt-3 pt-2.5 border-t border-[#1C2A55] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Free & No Sign-up</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">
            Encrypted WebRTC P2P
          </span>
        </div>

      </div>
    </div>
  );
};

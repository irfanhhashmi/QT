import React, { useState, useEffect, useRef } from 'react';
import { PeerInfo, ChatMessage } from '../types';
import { getCountryFlag, getCountryName } from '../data/countries';
import { compressAndProcessImage, extractImageFromClipboard } from '../utils/imageUtils';
import { unlockAudio } from '../utils/voiceSynthesis';
import { QuikTalksIcon } from './Logo';

interface ActiveCallScreenProps {
  peerInfo: PeerInfo;
  commonTags: string[];
  localVolume: number;
  remoteVolume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onSkip: () => void;
  onEndCall: () => void;
  onReport: () => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, imageUrl?: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  isStrangerTyping: boolean;
  isConnecting: boolean;
  autoCall: boolean;
  onToggleAutoCall: () => void;
  onAddFriend?: () => void;
  isFriendAdded?: boolean;
  onOpenCallLogs?: () => void;
  onViewImage?: (imageUrl: string, senderName?: string, timestamp?: number) => void;
}

const QUICK_CHATS = [
  '👋 Hey there!',
  '🔊 Can you hear me clearly?',
  '🌍 Where are you from?',
  '✨ Nice to meet you!',
  '🤣 Haha awesome',
  '👍 Sounds great!',
];

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({
  peerInfo,
  localVolume,
  remoteVolume,
  isMuted,
  onToggleMute,
  onSkip,
  onEndCall,
  onReport,
  chatMessages,
  onSendMessage,
  onSendTyping,
  isStrangerTyping,
  isConnecting,
  autoCall,
  onToggleAutoCall,
  onAddFriend,
  isFriendAdded = false,
  onOpenCallLogs,
  onViewImage,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isDialingNext, setIsDialingNext] = useState(false);
  const [dialingSeconds, setDialingSeconds] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset dialing state and duration whenever a new partner connects
  useEffect(() => {
    setIsDialingNext(false);
    setCallDuration(0);
    setDialingSeconds(0);
    setPendingImage(null);
  }, [peerInfo.id]);

  // Call timer loop
  useEffect(() => {
    if (isDialingNext) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isDialingNext]);

  // Dialing next timer loop
  useEffect(() => {
    if (!isDialingNext) return;
    const timer = setInterval(() => {
      setDialingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isDialingNext]);

  // Format call duration HH:MM:SS or MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainder = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Scroll chat to bottom when message arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (!showChatDrawer && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.sender === 'stranger') {
        setHasUnread(true);
      }
    }
  }, [chatMessages, showChatDrawer]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !pendingImage) return;
    onSendMessage(inputText.trim(), pendingImage || undefined);
    setInputText('');
    setPendingImage(null);
    onSendTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onSendTyping(e.target.value.length > 0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingImg(true);
      const dataUrl = await compressAndProcessImage(file);
      setPendingImage(dataUrl);
    } catch (err) {
      console.warn('Image processing error:', err);
    } finally {
      setIsProcessingImg(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const file = extractImageFromClipboard(e);
    if (file) {
      e.preventDefault();
      try {
        setIsProcessingImg(true);
        const dataUrl = await compressAndProcessImage(file);
        setPendingImage(dataUrl);
      } catch (err) {
        console.warn('Clipboard image error:', err);
      } finally {
        setIsProcessingImg(false);
      }
    }
  };

  // Handle Hangup or Next button click
  const handleHangupOrNext = () => {
    if (autoCall) {
      // Auto call is enabled: immediately transition into dialing animation on same screen and search next person
      setIsDialingNext(true);
      setDialingSeconds(0);
      onEndCall();
    } else {
      // Auto call is disabled: user wants to finish session
      onEndCall();
    }
  };

  const peerCountryCode = peerInfo.country || 'PK';
  const countryName = getCountryName(peerCountryCode);
  const countryFlag = getCountryFlag(peerCountryCode);

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-between px-4 py-4 bg-gradient-to-b from-[#0B132B] via-[#091024] to-[#060B18] text-white select-none relative overflow-hidden">
      
      {/* Top Bar: Floating Chat Button & Next Caller Quick Pill */}
      <div className="w-full max-w-lg flex items-center justify-between z-20 mb-1">
        <button
          id="active-call-chat-toggle"
          onClick={() => {
            setShowChatDrawer(!showChatDrawer);
            setHasUnread(false);
          }}
          className="relative w-11 h-11 rounded-2xl bg-[#142145] hover:bg-[#1C2F60] border border-[#273B78] flex items-center justify-center text-white transition-all shadow-xl"
          title="Toggle In-Call Chat"
        >
          <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {hasUnread && (
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping absolute -top-1 -right-1" />
          )}
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-[9px] font-bold text-slate-950">
              {chatMessages.length}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Skip / Next Caller Quick Pill */}
          <button
            onClick={() => {
              setIsDialingNext(true);
              setDialingSeconds(0);
              onSkip();
            }}
            className="px-4 py-2 rounded-full bg-[#182650] hover:bg-[#20336B] border border-[#2B3F7D] text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors shadow-md"
            title="Skip to Next Stranger"
          >
            <span>Next Caller</span>
            <span>⏭️</span>
          </button>
        </div>
      </div>

      {/* Center Main Stage: Circular Visual Display (Active Call vs Dialing Next) */}
      <div className="relative my-2 flex flex-col items-center justify-center z-10">
        
        {isDialingNext ? (
          /* Dialing Next Caller Radar State */
          <div className="relative flex items-center justify-center">
            <div className="absolute w-72 h-72 rounded-full border border-cyan-500/20 animate-ping opacity-40" />
            <div className="absolute w-64 h-64 rounded-full border border-emerald-500/30 animate-pulse" />
            <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-b from-[#163554]/90 via-[#0E233C]/95 to-[#071424] border-4 border-cyan-400 flex flex-col items-center justify-center shadow-2xl shadow-cyan-500/30 transition-all">
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-cyan-300 mb-1 animate-pulse">
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L3 20h18L12 3zm-6.5 12h13" />
                </svg>
              </div>
              <div className="text-sm sm:text-base font-extrabold tracking-widest text-cyan-300 font-sans animate-pulse">
                DIALING NEXT...
              </div>
              <div className="mt-1 text-xs font-mono tracking-wider font-semibold text-cyan-400">
                00:{dialingSeconds.toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        ) : (
          /* Active Call Connected State */
          <div className={`w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-b from-[#1C3D5A]/80 via-[#10273F]/90 to-[#0A1A2C] border-4 border-[#10B981] flex flex-col items-center justify-center shadow-2xl shadow-emerald-500/25 transition-all ${
            remoteVolume > 15 ? 'scale-105 shadow-emerald-400/40 border-emerald-400' : ''
          }`}>
            
            {/* Official QuikTalks Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1">
              <QuikTalksIcon className="w-full h-full drop-shadow-lg" />
            </div>

            {/* Brand Name */}
            <div className="text-xl sm:text-2xl font-black tracking-wider text-white font-sans flex items-center">
              <span>Quik</span>
              <span className="text-cyan-400">Talks</span>
            </div>

            {/* Live Call Duration (00:00:02) */}
            <div className="mt-1 text-xs sm:text-sm font-mono tracking-wider font-semibold text-emerald-400">
              {formatTime(callDuration)}
            </div>
          </div>
        )}


      </div>

      {/* 4 Circular Action Buttons (Matching Screenshot 1) */}
      <div className="w-full max-w-sm grid grid-cols-4 gap-4 sm:gap-6 my-4 z-10">
        
        {/* 1. Red Hang up Button (When Auto Call is checked, dials next caller seamlessly) */}
        <div className="flex flex-col items-center gap-1.5 relative">
          {!isDialingNext && (
            <div 
              id="active-call-hangup-duration-badge"
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-emerald-950/70 z-30"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatTime(callDuration)}</span>
            </div>
          )}

          <button
            id="active-call-hangup-btn"
            onClick={handleHangupOrNext}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center shadow-lg shadow-red-950/60 hover:scale-105 active:scale-95 transition-all"
            title={autoCall ? 'Hang up and dial next stranger' : 'Hang up'}
          >
            <svg className="w-7 h-7 transform rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-200">
              {isDialingNext ? 'Dialing...' : 'Hang up'}
            </span>
            {!isDialingNext && (
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                {formatTime(callDuration)}
              </span>
            )}
          </div>
        </div>

        {/* 2. Mute Button */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            id="active-call-mute-btn"
            onClick={onToggleMute}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border flex items-center justify-center shadow-md transition-all ${
              isMuted
                ? 'bg-red-500/20 border-red-400 text-red-300'
                : 'bg-[#152247] border-[#253974] hover:bg-[#1E2E5E] text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          <span className="text-xs font-medium text-slate-300">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </div>

        {/* 3. Add Friend Button */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            id="active-call-friend-btn"
            onClick={onAddFriend}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border flex items-center justify-center shadow-md transition-all ${
              isFriendAdded
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-[#152247] border-[#253974] hover:bg-[#1E2E5E] text-white'
            }`}
            title="Add Friend"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </button>
          <span className="text-xs font-medium text-slate-300">
            {isFriendAdded ? 'Added ✓' : 'Add Friend'}
          </span>
        </div>

        {/* 4. Report Button */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            id="active-call-report-btn"
            onClick={onReport}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#152247] hover:bg-[#1E2E5E] border border-[#253974] text-white flex items-center justify-center shadow-md transition-all"
            title="Report Peer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </button>
          <span className="text-xs font-medium text-slate-300">Report</span>
        </div>

      </div>

      {/* Checkbox & Call History Subrow */}
      <div className="flex items-center justify-center gap-3 text-xs text-slate-300 my-2 z-10">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={autoCall}
            onChange={onToggleAutoCall}
            className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-0"
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

      {/* Prominent Partner Country Banner */}
      <div className="w-full max-w-sm my-2 p-3 rounded-2xl bg-[#101A36] border border-[#213366] flex items-center justify-center gap-2 text-sm text-slate-200 z-10 shadow-lg">
        {isDialingNext ? (
          <div className="flex items-center gap-2 text-cyan-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Finding your next voice partner...</span>
          </div>
        ) : (
          <>
            <span>Your partner is from</span>
            <strong className="text-white font-bold">{peerInfo?.region && peerInfo.region !== 'any' ? `${peerInfo.region}, ` : ''}{countryName}</strong>
            <span className="text-2xl ml-1 leading-none">{countryFlag}</span>
          </>
        )}
      </div>

      {/* Slide-out In-Call Chat Drawer (Overlay) */}
      {showChatDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F1836] border border-[#263B75] rounded-3xl p-4 shadow-2xl flex flex-col h-[70vh] max-h-[500px]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#213366] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{countryFlag}</span>
                <div>
                  <div className="text-xs font-bold text-white">Chat with {peerInfo.callsign || 'Stranger'}</div>
                  <div className="text-[10px] text-slate-400">Voice call active • Messages disappear on hangup</div>
                </div>
              </div>
              <button
                onClick={() => setShowChatDrawer(false)}
                className="w-7 h-7 rounded-full bg-[#182650] text-slate-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <span className="text-3xl mb-2">💬</span>
                  <p className="text-xs">Send a message or image during your call</p>
                  <div className="flex flex-wrap gap-1 mt-3 justify-center">
                    {QUICK_CHATS.map((qc) => (
                      <button
                        key={qc}
                        onClick={() => onSendMessage(qc)}
                        className="text-[11px] bg-[#16234D] hover:bg-[#1E3068] text-slate-200 px-2.5 py-1 rounded-xl border border-[#2B3F7A]"
                      >
                        {qc}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'you' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[9px] text-slate-500 font-mono mb-0.5 px-1">
                      {msg.sender === 'you' ? 'You' : (peerInfo.callsign || 'Partner')}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl overflow-hidden text-xs break-words ${
                        msg.sender === 'you'
                          ? 'bg-[#4F46E5] text-white rounded-br-none'
                          : 'bg-[#1A264D] text-slate-100 rounded-bl-none border border-[#293D77]'
                      }`}
                    >
                      {msg.imageUrl && (
                        <div className="p-1 pb-0">
                          <img
                            src={msg.imageUrl}
                            alt="Attachment"
                            onClick={() => onViewImage?.(msg.imageUrl!, msg.sender === 'you' ? 'You' : (peerInfo.callsign || 'Partner'), msg.timestamp)}
                            className="max-h-44 w-full object-cover rounded-xl cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all bg-black/20"
                            loading="lazy"
                          />
                        </div>
                      )}
                      {msg.text && (
                        <div className="px-3 py-1.5">
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isStrangerTyping && (
                <div className="text-[10px] text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Partner is typing...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Strip */}
            {chatMessages.length > 0 && (
              <div className="flex gap-1 overflow-x-auto py-1.5 border-t border-[#1C2A52] no-scrollbar">
                {QUICK_CHATS.slice(0, 4).map((qc) => (
                  <button
                    key={qc}
                    onClick={() => onSendMessage(qc)}
                    className="whitespace-nowrap px-2 py-0.5 bg-[#17254E] hover:bg-[#20336B] text-slate-300 rounded-lg text-[10px] shrink-0 border border-[#283C73]"
                  >
                    {qc}
                  </button>
                ))}
              </div>
            )}

            {/* Pending Image Preview */}
            {pendingImage && (
              <div className="p-1.5 bg-[#0D152D] rounded-xl border border-[#233566] flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={pendingImage}
                    alt="Pending upload"
                    className="w-10 h-10 object-cover rounded-lg border border-indigo-400/40"
                  />
                  <div className="text-[11px] text-slate-300">
                    <span className="font-semibold text-white">Image attached</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="p-1 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-300 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Quick Tap-to-Send Texting Chips */}
            <div className="py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                'Can you hear me? 🎙️',
                'Hey! Greetings! 👋',
                'Where are you calling from? 🌍',
                'Nice voice! ✨',
                'Yes, I can hear you clearly! 👍',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onSendMessage(chip)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#131E3D] hover:bg-indigo-600 text-[11px] text-indigo-200 hover:text-white border border-[#20315F] transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="flex items-center gap-1.5 pt-2 border-t border-[#1C2A52]">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {/* Attach Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImg}
                className="p-2 rounded-xl bg-[#131E3D] hover:bg-[#1C2B54] text-slate-300 hover:text-indigo-300 border border-[#20315F] disabled:opacity-40 transition-colors flex items-center justify-center"
                title="Attach Image"
              >
                {isProcessingImg ? (
                  <span className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              <input
                type="text"
                placeholder={pendingImage ? "Add a caption..." : "Type message or paste image..."}
                value={inputText}
                onChange={handleInputChange}
                onPaste={handlePaste}
                className="flex-1 bg-[#0A1024] border border-[#20315F] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                maxLength={250}
              />
              <button
                type="submit"
                disabled={!inputText.trim() && !pendingImage}
                className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Send
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { ChatMode, MatchPreferences, PeerInfo, ChatMessage } from '../types';
import { getCountryFlag, getCountryName, DetectedCountryResult } from '../data/countries';
import { AiGestureType } from '../utils/audioCues';
import { compressAndProcessImage, extractImageFromClipboard } from '../utils/imageUtils';
import { unlockAudio } from '../utils/voiceSynthesis';
import { QuikTalksIcon } from './Logo';
import { HomepageSeoSection } from './HomepageSeoSection';

interface VoiceConsoleProps {
  connectionState: 'idle' | 'queueing' | 'connecting' | 'connected' | 'ended';
  waitTime?: number;
  preferences: MatchPreferences;
  onUpdatePreferences: (updated: Partial<MatchPreferences>) => void;
  onStartMatching: (mode: ChatMode) => void;
  onCancelQueue: () => void;
  onEndCall: () => void;
  onSkip: () => void;
  peerInfo: PeerInfo;
  commonTags: string[];
  localVolume: number;
  remoteVolume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onAddFriend: (callsign: string) => void;
  isFriendAdded: boolean;
  onOpenReport: () => void;
  onOpenCallLogs: () => void;
  onOpenFilters: () => void;
  onOpenFriends: () => void;
  onOpenSafety: () => void;
  onOpenShare?: () => void;
  detectedCountry?: DetectedCountryResult;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, imageUrl?: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  isStrangerTyping: boolean;
  partnerEndedMessage: string | null;
  onTestMicrophone: () => Promise<void>;
  isMicTesting: boolean;
  isAiSpeaking?: boolean;
  isListening?: boolean;
  liveTranscript?: string;
  aiSubtitleText?: string;
  aiStatusText?: string;
  aiGesture?: AiGestureType;
  onViewImage?: (imageUrl: string, senderName?: string, timestamp?: number) => void;
}

export const VoiceConsole: React.FC<VoiceConsoleProps> = ({
  connectionState,
  waitTime = 0,
  preferences,
  onUpdatePreferences,
  onStartMatching,
  onCancelQueue,
  onEndCall,
  onSkip,
  peerInfo,
  commonTags,
  localVolume,
  remoteVolume,
  isMuted,
  onToggleMute,
  onAddFriend,
  isFriendAdded,
  onOpenReport,
  onOpenCallLogs,
  onOpenFilters,
  onOpenFriends,
  onOpenSafety,
  onOpenShare,
  detectedCountry,
  chatMessages,
  onSendMessage,
  onSendTyping,
  isStrangerTyping,
  partnerEndedMessage,
  onTestMicrophone,
  isMicTesting,
  isAiSpeaking = false,
  isListening = false,
  liveTranscript = '',
  aiSubtitleText = '',
  aiStatusText = '',
  aiGesture = 'listening',
  onViewImage,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real-time call duration timer: updates every second while in active call
  useEffect(() => {
    if (connectionState === 'connected') {
      const startTime = Date.now();
      setCallDuration(0);
      const timer = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setCallDuration(elapsed);
      }, 1000);
      return () => window.clearInterval(timer);
    } else {
      setCallDuration(0);
    }
  }, [connectionState, peerInfo?.id]);

  // Unread badge for in-call chat
  useEffect(() => {
    if (!showChatDrawer && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.sender === 'stranger') {
        setHasUnread(true);
      }
    }
  }, [chatMessages, showChatDrawer]);

  useEffect(() => {
    if (showChatDrawer) {
      setHasUnread(false);
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showChatDrawer, chatMessages]);

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `00:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
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

  // Primary Action Button Handler (Call -> Searching -> Hang up)
  const handlePrimaryButtonClick = () => {
    unlockAudio();
    if (connectionState === 'idle') {
      onStartMatching('voice');
    } else if (connectionState === 'queueing') {
      onCancelQueue();
    } else if (connectionState === 'connected') {
      onEndCall();
    }
  };

  const peerCountryCode = peerInfo?.country || 'PK';
  const peerCountryName = getCountryName(peerCountryCode);
  const peerCountryFlag = getCountryFlag(peerCountryCode);

  const isConnected = connectionState === 'connected';
  const isSearching = connectionState === 'queueing' || connectionState === 'connecting';
  const isIdle = connectionState === 'idle';

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-[#0A1024] text-white select-none relative overflow-y-auto overflow-x-hidden min-h-[calc(100dvh-3.5rem)] max-w-full">
      
      {/* Top Floating In-Call Chat Button & Quick Mode / Filters */}
      <div className="w-full max-w-lg flex justify-between items-center z-30 mb-1 shrink-0">
        
        {/* Floating Chat Bubble (AirTalk style at top left) */}
        <button
          id="console-chat-drawer-toggle"
          onClick={() => setShowChatDrawer(!showChatDrawer)}
          className={`relative p-2 sm:p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 shadow-md ${
            showChatDrawer
              ? 'bg-indigo-600 border-indigo-400 text-white'
              : 'bg-[#142145] border-[#273B78] text-slate-200 hover:bg-[#1D2E60]'
          }`}
          title="Open Text Chat"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-semibold hidden min-[400px]:inline">Chat</span>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 ring-2 ring-[#0A1024] animate-pulse" />
          )}
        </button>

        {/* Quick Filters / Share / Next */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isConnected && (
            <button
              onClick={onSkip}
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-[#182650] hover:bg-[#20336B] border border-[#2B3F7D] text-xs font-bold text-slate-200 flex items-center gap-1 transition-colors shadow-md"
              title="Skip to next caller"
            >
              <span>Next</span>
              <span>⏩</span>
            </button>
          )}

          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 hover:text-white hover:bg-cyan-500/25 transition-all text-xs font-semibold shadow-md active:scale-95 shadow-cyan-950/30"
              title="Share / Invite Friends to Session"
            >
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden min-[360px]:inline">Share</span>
            </button>
          )}

          <button
            onClick={onOpenFilters}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[#142145] border border-[#273B78] text-slate-300 hover:text-white hover:bg-[#1D2E60] transition-colors text-xs font-semibold shadow-md"
          >
            <span>🌍</span>
            <span>Filters</span>
          </button>
        </div>

      </div>

      {/* 2. Main Center Mega Circular Emblem (Transitions smoothly between Idle, Searching, and Connected) */}
      <div className="relative my-1 sm:my-2 md:my-3 flex flex-col items-center justify-center z-10 shrink-0">
        
        {/* Animated Radial Rings during Searching */}
        {isSearching && (
          <>
            <div className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-cyan-500/20 animate-ping opacity-30 pointer-events-none" />
            <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-indigo-500/30 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Central Emblem Box */}
        <div
          className={`w-40 h-40 min-[400px]:w-48 min-[400px]:h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 relative p-2 sm:p-3 ${
            isConnected
              ? 'bg-gradient-to-b from-[#1C3D5A]/90 via-[#10273F]/95 to-[#0A1A2C] border-4 border-[#10B981] shadow-emerald-500/25'
              : isSearching
              ? 'bg-gradient-to-b from-[#1F3366]/80 via-[#132044]/90 to-[#0A1124] border-4 border-cyan-400/80 shadow-cyan-500/30 animate-pulse'
              : 'bg-gradient-to-b from-[#281A54]/80 via-[#120D29]/90 to-[#0A0718] border-4 border-[#3D2878] shadow-purple-950/70'
          } ${isConnected && remoteVolume > 15 ? 'scale-105 border-emerald-400 shadow-emerald-400/40' : ''}`}
        >
          {/* Central Official Icon */}
          <div className="w-12 h-12 min-[400px]:w-14 min-[400px]:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center text-white mb-0.5 sm:mb-1">
            <QuikTalksIcon className="w-full h-full drop-shadow-lg" />
          </div>

          {/* Logo Title */}
          <div className="text-lg min-[400px]:text-xl sm:text-2xl font-black tracking-wider text-white font-sans text-center px-2 truncate max-w-[160px] min-[400px]:max-w-[190px] sm:max-w-[220px] flex items-center justify-center">
            <span>Quik</span>
            <span className="text-cyan-400">Talks</span>
          </div>

          {/* Connected Call Timer (00:00:00) / Searching status / Official Tagline */}
          {isConnected ? (
            <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-mono tracking-wider font-semibold text-emerald-400">
              {formatTime(callDuration)}
            </div>
          ) : isSearching ? (
            waitTime >= 10 ? (
              <div className="mt-0.5 sm:mt-1 text-[10px] min-[400px]:text-[11px] font-mono tracking-wide font-bold text-amber-300 animate-pulse text-center px-1">
                USERS BUSY • WAITING
              </div>
            ) : (
              <div className="mt-0.5 sm:mt-1 text-[10px] min-[400px]:text-[11px] font-mono tracking-wide font-semibold text-cyan-300 animate-pulse">
                CONNECTING... (00:{waitTime.toString().padStart(2, '0')})
              </div>
            )
          ) : (
            <div className="text-[9px] min-[400px]:text-[10px] sm:text-[11px] text-amber-300 font-semibold tracking-normal mt-0.5 px-2 text-center leading-tight">
              No camera, no sign-up - just talk!
            </div>
          )}

        </div>


      </div>

      {/* 3. Four Circular Action Buttons (Matching AirTalk Video Layout) */}
      <div className="grid grid-cols-4 gap-2.5 min-[400px]:gap-3.5 sm:gap-5 md:gap-6 my-1.5 sm:my-2.5 z-20 shrink-0">
        
        {/* Button 1: Call / Searching Loader / Hang Up */}
        <div className="flex flex-col items-center gap-1 sm:gap-1.5 relative">
          {isConnected ? (
            /* Connected: Red Hang up button with Real-Time Duration Badge */
            <>
              {/* Floating Real-Time Call Duration Badge above Hang-Up Button */}
              <div 
                id="console-hangup-duration-badge"
                className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-emerald-950/70 z-30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{formatTime(callDuration)}</span>
              </div>

              <button
                id="console-hangup-btn"
                onClick={handlePrimaryButtonClick}
                className="w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center shadow-lg shadow-red-950/60 hover:scale-105 active:scale-95 transition-all"
                title={preferences.autoCall ? 'Hang up and auto-dial next stranger' : 'Hang up call'}
              >
                <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 sm:w-7 sm:h-7 transform rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </>
          ) : isSearching ? (
            /* Searching: Spinning loader button (click cancels search) */
            <button
              id="console-searching-btn"
              onClick={handlePrimaryButtonClick}
              className="w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#152247] hover:bg-[#1E2E5E] border border-cyan-500/50 text-cyan-300 flex items-center justify-center shadow-lg transition-all relative"
              title="Searching for partner... Click to cancel"
            >
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 sm:w-7 sm:h-7 animate-spin text-cyan-300" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </button>
          ) : (
            /* Idle: Green Call button */
            <button
              id="console-call-btn"
              onClick={handlePrimaryButtonClick}
              className="w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#10B981] hover:bg-[#059669] text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95 transition-all"
              title="Start Voice Chat (Dial Stranger)"
            >
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}

          {isConnected ? (
            <div className="flex flex-col items-center">
              <span className="text-[11px] sm:text-xs font-bold text-slate-100">Hang up</span>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-emerald-400">
                {formatTime(callDuration)}
              </span>
            </div>
          ) : (
            <span className="text-[11px] sm:text-xs font-bold text-slate-100">
              {isSearching ? 'Cancel' : 'Call'}
            </span>
          )}
        </div>

        {/* Button 2: Mute / Unmute */}
        <div className="flex flex-col items-center gap-1 sm:gap-1.5">
          <button
            id="console-mute-btn"
            onClick={isConnected ? onToggleMute : onTestMicrophone}
            className={`w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border flex items-center justify-center shadow-md transition-all ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                : isMicTesting
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-[#152247] border-[#253974] hover:bg-[#1E2E5E] text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          <span className="text-[11px] sm:text-xs font-medium text-slate-300">
            {isMuted ? 'Unmute' : isMicTesting ? 'Testing...' : 'Mute'}
          </span>
        </div>

        {/* Button 3: Add Friend */}
        <div className="flex flex-col items-center gap-1 sm:gap-1.5">
          <button
            id="console-add-friend-btn"
            onClick={isConnected ? () => onAddFriend(peerInfo.callsign) : onOpenFriends}
            className={`w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border flex items-center justify-center shadow-md transition-all ${
              isFriendAdded
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-[#152247] border-[#253974] hover:bg-[#1E2E5E] text-white'
            }`}
            title="Add Friend"
          >
            {isFriendAdded ? (
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            )}
          </button>
          <span className="text-[11px] sm:text-xs font-medium text-slate-300">
            {isFriendAdded ? 'Added ✓' : 'Add Friend'}
          </span>
        </div>

        {/* Button 4: Report */}
        <div className="flex flex-col items-center gap-1 sm:gap-1.5">
          <button
            id="console-report-btn"
            onClick={isConnected ? onOpenReport : onOpenSafety}
            className="w-12 h-12 min-[400px]:w-13 min-[400px]:h-13 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#152247] hover:bg-[#1E2E5E] border border-[#253974] text-white flex items-center justify-center shadow-md transition-all"
            title="Report & Safety"
          >
            <svg className="w-5 h-5 min-[400px]:w-6 min-[400px]:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </button>
          <span className="text-[11px] sm:text-xs font-medium text-slate-300">Report</span>
        </div>

      </div>

      {/* 4. Checkbox & Call History Subrow */}
      <div className="flex items-center justify-center gap-3 text-[11px] sm:text-xs text-slate-300 my-1 z-20 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.autoCall || false}
            onChange={(e) => onUpdatePreferences({ autoCall: e.target.checked })}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <span className="font-semibold text-slate-200">Enable Auto Call</span>
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

      {/* 5. Dynamic Status Message & Partner Info */}
      <div className="w-full max-w-md my-1 text-center z-20 min-h-[28px] sm:min-h-[32px] flex flex-col items-center justify-center gap-1 sm:gap-1.5 px-2 shrink-0">
        {isConnected ? (
          <>
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-200">
              <span>Your partner is from</span>
              <strong className="text-white font-bold">{peerInfo?.region && peerInfo.region !== 'any' ? `${peerInfo.region}, ` : ''}{peerCountryName}</strong>
              <span className="text-xl ml-0.5">{peerCountryFlag}</span>
            </div>

            {/* Live Audio & Speaking Status Feedback */}
            {localVolume > 7 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-xs font-medium text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>🎤 You are speaking...</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>🎙️ Microphone Active (Talk naturally)</span>
              </div>
            )}

            {/* Quick Interactive Conversational Prompts */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onSendMessage("Hey! How are you doing today?")}
                className="px-2.5 py-1 rounded-full bg-[#172554] hover:bg-[#1E3A8A] border border-blue-500/40 text-[11px] font-medium text-blue-200 hover:text-white transition-all shadow-sm active:scale-95"
              >
                👋 &ldquo;Hey! How are you?&rdquo;
              </button>
              <button
                type="button"
                onClick={() => onSendMessage(`What's it like in ${peerInfo?.region || peerCountryName}?`)}
                className="px-2.5 py-1 rounded-full bg-[#172554] hover:bg-[#1E3A8A] border border-blue-500/40 text-[11px] font-medium text-blue-200 hover:text-white transition-all shadow-sm active:scale-95"
              >
                🌍 &ldquo;Tell me about your city!&rdquo;
              </button>
              <button
                type="button"
                onClick={() => onSendMessage("What kind of music or movies are you into?")}
                className="px-2.5 py-1 rounded-full bg-[#172554] hover:bg-[#1E3A8A] border border-blue-500/40 text-[11px] font-medium text-blue-200 hover:text-white transition-all shadow-sm active:scale-95"
              >
                🎵 &ldquo;What music do you like?&rdquo;
              </button>
            </div>
          </>
        ) : isSearching ? (
          waitTime >= 10 ? (
            <div className="w-full max-w-sm sm:max-w-md mx-auto p-3 sm:p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200 flex items-start gap-2.5 text-left">
              <span className="text-base sm:text-lg shrink-0 mt-0.5">📞</span>
              <div className="flex-1">
                <p className="font-semibold text-amber-300 leading-snug">
                  All the users are currently connected on a call. Please wait while we try connect you with any available user.
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-200/80">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Searching for partner ... (waiting 00:{waitTime.toString().padStart(2, '0')})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Searching for partner ... (00:{waitTime.toString().padStart(2, '0')})</span>
            </div>
          )
        ) : partnerEndedMessage ? (
          <div className="text-xs sm:text-sm text-red-500 font-bold animate-in fade-in">
            {partnerEndedMessage}
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-slate-300 font-medium">
            Tap the <span className="text-emerald-400 font-bold">Call</span> button to call a new stranger
          </div>
        )}
      </div>

      {/* 7. Slide-In / Overlay In-Call Chat Drawer */}
      {showChatDrawer && (
        <div className="fixed inset-y-0 left-0 w-full sm:w-80 bg-[#0E1630]/95 backdrop-blur-md border-r border-[#24366A] z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
          
          {/* Drawer Header */}
          <div className="p-3 border-b border-[#213264] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">💬 In-Call Chat</span>
              {isStrangerTyping && (
                <span className="text-[10px] text-cyan-400 animate-pulse">Typing...</span>
              )}
            </div>
            <button
              onClick={() => setShowChatDrawer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A2850]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                <span className="text-2xl mb-1">🎙️</span>
                <p>Send a message or image while talking to your partner!</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'you' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl overflow-hidden break-words ${
                      msg.sender === 'you'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-[#182650] text-slate-100 border border-[#2B3F7D] rounded-bl-none'
                    }`}
                  >
                    {/* Render Image Attachment if present */}
                    {msg.imageUrl && (
                      <div className="p-1 pb-0">
                        <img
                          src={msg.imageUrl}
                          alt="Attachment"
                          onClick={() => onViewImage?.(msg.imageUrl!, msg.sender === 'you' ? 'You' : (peerInfo.callsign || 'Partner'), msg.timestamp)}
                          className="max-h-48 w-full object-cover rounded-xl cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all bg-black/20"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {msg.text && (
                      <div className="px-3 py-2">
                        {msg.text}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5 px-1 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Pending Image Preview Bar */}
          {pendingImage && (
            <div className="p-2 bg-[#121B38] border-t border-[#213264] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={pendingImage}
                  alt="Pending attachment"
                  className="w-12 h-12 object-cover rounded-lg border border-indigo-400/40"
                />
                <div className="text-[11px] text-slate-300">
                  <div className="font-semibold text-white">Image attached</div>
                  <div className="text-slate-400">Ready to send</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="p-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-300 text-xs font-bold transition-colors"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Tap-to-Send Texting Chips */}
          {isConnected && (
            <div className="px-2 py-1.5 border-t border-[#1D2B52] bg-[#0C142E] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#162247] hover:bg-indigo-600/80 text-[11px] text-indigo-200 hover:text-white border border-[#273B78] transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <form onSubmit={handleSendChatMessage} className="p-2 border-t border-[#213264] flex items-center gap-1.5">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Image Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isProcessingImg}
              className="p-2 rounded-xl bg-[#142042] hover:bg-[#1A2850] text-slate-300 hover:text-indigo-300 border border-[#273B78] disabled:opacity-40 transition-colors flex items-center justify-center"
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
              value={inputText}
              onChange={handleInputChange}
              onPaste={handlePaste}
              placeholder={isConnected ? (pendingImage ? 'Add a caption...' : 'Type message or paste image...') : 'Connect to chat...'}
              disabled={!isConnected}
              className="flex-1 px-3 py-2 rounded-xl bg-[#142042] border border-[#273B78] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isConnected || (!inputText.trim() && !pendingImage)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-colors"
            >
              Send
            </button>
          </form>

        </div>
      )}

      {/* Editable Homepage Marketing & SEO Content Section (Zapier Theme) */}
      <HomepageSeoSection 
        onStartCallWithPref={(country, mode) => {
          const selectedMode = (mode || preferences.mode || 'voice') as ChatMode;
          onUpdatePreferences({ 
            preferredCountries: country === 'ANY' ? [] : [country], 
            mode: selectedMode 
          });
          onStartMatching(selectedMode);
        }}
      />

    </div>
  );
};

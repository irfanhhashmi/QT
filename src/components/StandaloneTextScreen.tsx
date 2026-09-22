import React, { useState, useEffect, useRef } from 'react';
import { PeerInfo, ChatMessage } from '../types';
import { getCountryFlag, getCountryName } from '../data/countries';
import { compressAndProcessImage, extractImageFromClipboard } from '../utils/imageUtils';
import { QuikTalksLogo } from './Logo';

interface StandaloneTextScreenProps {
  peerInfo: PeerInfo;
  commonTags: string[];
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, imageUrl?: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  isStrangerTyping: boolean;
  onSkip: () => void;
  onEndChat: () => void;
  onReport: () => void;
  onOpenShare?: () => void;
  autoCall: boolean;
  onToggleAutoCall: () => void;
  onViewImage?: (imageUrl: string, senderName?: string, timestamp?: number) => void;
}

export const StandaloneTextScreen: React.FC<StandaloneTextScreenProps> = ({
  peerInfo,
  commonTags,
  chatMessages,
  onSendMessage,
  onSendTyping,
  isStrangerTyping,
  onSkip,
  onEndChat,
  onReport,
  onOpenShare,
  autoCall,
  onToggleAutoCall,
  onViewImage,
}) => {
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [chatTimer, setChatTimer] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setInterval(() => setChatTimer((prev) => prev + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !pendingImage) return;
    onSendMessage(inputText.trim(), pendingImage || undefined);
    setInputText('');
    setPendingImage(null);
    onSendTyping(false);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        setIsProcessingImg(true);
        const dataUrl = await compressAndProcessImage(file);
        setPendingImage(dataUrl);
      } catch (err) {
        console.warn('Drop image error:', err);
      } finally {
        setIsProcessingImg(false);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-full max-w-4xl mx-auto h-[calc(100vh-5rem)] flex flex-col py-3 px-3 sm:px-6 relative"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-amber-500/20 backdrop-blur-sm border-2 border-dashed border-amber-400 rounded-3xl flex flex-col items-center justify-center m-3 pointer-events-none animate-in fade-in">
          <div className="text-4xl mb-2">📥</div>
          <div className="text-base font-bold text-amber-300">Drop your image here to attach</div>
        </div>
      )}
      
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 mb-3">
        <div className="flex items-center gap-3">
          <QuikTalksLogo 
            iconSize="w-8 h-8"
            showTagline={false}
            titleClassName="font-extrabold text-sm text-white tracking-wide font-sans hidden sm:inline"
          />
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 font-mono">
                {peerInfo.callsign || 'Stranger #802'}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Text Mode
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <span>{getCountryFlag(peerInfo.country || 'US')}</span>
                <span className="text-slate-300 font-medium">{getCountryName(peerInfo.country || 'US')}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  ✓ Verified
                </span>
              </span>
              {commonTags.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-300/90 truncate max-w-[150px]">
                    {commonTags.map(t => `#${t}`).join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 hover:text-white hover:bg-cyan-500/25 border border-cyan-500/30 transition-colors shadow-sm shadow-cyan-950/30"
              title="Share / Invite Friends to Session"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}

          <span className="font-mono text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            {formatTimer(chatTimer)}
          </span>

          <button
            id="text-mode-report"
            onClick={onReport}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
            title="Report"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 bg-[#0A0F1D]/80 border border-slate-800 rounded-3xl p-4 overflow-y-auto space-y-3">
        <div className="text-center py-2 text-slate-400 text-xs font-mono">
          Connected to a stranger. Say hi, share thoughts or attach photos!
        </div>

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'you' ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-mono">
              {msg.sender === 'you' ? 'You' : peerInfo.callsign || 'Stranger'}
            </span>
            <div
              className={`max-w-[80%] rounded-2xl overflow-hidden text-sm leading-relaxed ${
                msg.sender === 'you'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none shadow-md'
                  : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
              }`}
            >
              {/* Image Thumbnail */}
              {msg.imageUrl && (
                <div className="p-1.5 pb-0">
                  <img
                    src={msg.imageUrl}
                    alt="Chat Attachment"
                    onClick={() => onViewImage?.(msg.imageUrl!, msg.sender === 'you' ? 'You' : (peerInfo.callsign || 'Stranger'), msg.timestamp)}
                    className="max-h-60 sm:max-h-72 w-full object-cover rounded-xl cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all bg-black/20"
                    loading="lazy"
                  />
                </div>
              )}
              {msg.text && (
                <div className="px-4 py-2.5 break-words">
                  {msg.text}
                </div>
              )}
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5 px-1 font-mono">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isStrangerTyping && (
          <div className="text-xs text-cyan-400 font-mono animate-pulse flex items-center gap-1">
            <span>Stranger is typing</span>
            <span className="animate-ping">...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Pending Image Attachment Preview Card */}
      {pendingImage && (
        <div className="mt-2 bg-slate-900 border border-amber-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <img
              src={pendingImage}
              alt="Pending preview"
              className="w-12 h-12 object-cover rounded-xl border border-amber-400/50"
            />
            <div className="text-xs text-slate-200">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <span>🖼️ Image Ready</span>
              </div>
              <div className="text-[11px] text-slate-400">Add a caption or send directly</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPendingImage(null)}
            className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold transition-colors border border-red-800/40"
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Auto-Next Checkbox Bar */}
      <div className="mt-2 w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between text-xs gap-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1">
          <input
            id="text-mode-auto-call-checkbox"
            type="checkbox"
            checked={autoCall}
            onChange={onToggleAutoCall}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900 cursor-pointer accent-amber-500 shrink-0"
          />
          <div>
            <span className="text-slate-200 font-semibold flex items-center gap-1.5 flex-wrap">
              <span>{autoCall ? '⚡ Auto-Connect Next Stranger' : '⏹ Return Back When Chat Ends'}</span>
              {autoCall ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-semibold">
                  AUTO-NEXT ON
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-full">
                  OFF
                </span>
              )}
            </span>
            <p className="text-[10px] text-slate-400">
              {autoCall
                ? 'Automatically matches next stranger when chat ends'
                : 'Chat continues normally. When finished, you will return back.'}
            </p>
          </div>
        </label>
      </div>

      {/* Input & Control Bar */}
      <div className="mt-2 flex flex-col sm:flex-row items-center gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="text-mode-skip"
            onClick={onSkip}
            className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs active:scale-95 transition-all shadow-md"
          >
            Next Stranger →
          </button>

          <button
            id="text-mode-end"
            onClick={onEndChat}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 font-semibold text-xs border border-slate-700 transition-colors"
          >
            {autoCall ? 'Exit to Home' : 'End Chat'}
          </button>
        </div>

        <form onSubmit={handleSend} className="flex-1 flex items-center gap-2 w-full">
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
            disabled={isProcessingImg}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700 rounded-2xl transition-colors flex items-center justify-center disabled:opacity-40"
            title="Attach image (or drag & drop / paste)"
          >
            {isProcessingImg ? (
              <span className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          <input
            type="text"
            placeholder={pendingImage ? "Add a caption..." : "Type message, paste image, or drop photo..."}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              onSendTyping(e.target.value.length > 0);
            }}
            onPaste={handlePaste}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!inputText.trim() && !pendingImage}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-2xl text-sm transition-transform active:scale-95 shadow-md"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
};


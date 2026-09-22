import { useState, useEffect, useRef, useCallback } from 'react';
import { AiPersona } from '../data/aiPersonas';
import { speakPersonaText, stopAllSpeech, unlockAudio } from '../utils/voiceSynthesis';
import { AiGestureType, detectGestureFromText, playGestureAudioCue } from '../utils/audioCues';
import { getRealConversationalReply } from '../data/conversationalReplies';

interface UseAiCompanionProps {
  activePersona: AiPersona | null;
  isConnected: boolean;
  isMuted: boolean;
  localVolume?: number;
  userCallsign: string;
  userCountry: string;
  onRequestMicrophone?: () => Promise<any>;
  onSetRemoteVolume: (volume: number) => void;
  onReceiveChatMessage?: (text: string, sender: 'stranger') => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export function useAiCompanion({
  activePersona,
  isConnected,
  isMuted,
  localVolume = 0,
  userCallsign,
  userCountry,
  onRequestMicrophone,
  onSetRemoteVolume,
  onReceiveChatMessage,
  onTypingChange,
}: UseAiCompanionProps) {
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [aiSubtitleText, setAiSubtitleText] = useState<string>('');
  const [aiStatusText, setAiStatusText] = useState<string>('');
  const [aiGesture, setAiGesture] = useState<AiGestureType>('listening');

  const messagesRef = useRef<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const activePersonaRef = useRef<AiPersona | null>(activePersona);
  const isConnectedRef = useRef<boolean>(isConnected);
  const isMutedRef = useRef<boolean>(isMuted);
  const isAiSpeakingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const lastAiSpeechEndTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const followUpTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentPersonaIdRef = useRef<string | null>(null);
  const followUpCountRef = useRef<number>(0);
  const activeSpokenBufferRef = useRef<string>('');

  // Synchronize dynamic values immediately on every render to eliminate stale-ref race conditions
  activePersonaRef.current = activePersona;
  isConnectedRef.current = isConnected;
  isMutedRef.current = isMuted;
  isAiSpeakingRef.current = isAiSpeaking;

  const onReceiveChatMessageRef = useRef(onReceiveChatMessage);
  useEffect(() => {
    onReceiveChatMessageRef.current = onReceiveChatMessage;
  }, [onReceiveChatMessage]);

  const onTypingChangeRef = useRef(onTypingChange);
  useEffect(() => {
    onTypingChangeRef.current = onTypingChange;
  }, [onTypingChange]);

  const onSetRemoteVolumeRef = useRef(onSetRemoteVolume);
  useEffect(() => {
    onSetRemoteVolumeRef.current = onSetRemoteVolume;
  }, [onSetRemoteVolume]);

  const onRequestMicrophoneRef = useRef(onRequestMicrophone);
  useEffect(() => {
    onRequestMicrophoneRef.current = onRequestMicrophone;
  }, [onRequestMicrophone]);

  // Clear idle follow-up prompt timer
  const clearFollowUpTimer = useCallback(() => {
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
  }, []);

  // Stop everything when call ends or persona changes
  const resetSession = useCallback(() => {
    stopAllSpeech();
    clearFollowUpTimer();
    setIsAiSpeaking(false);
    setIsListening(false);
    setLiveTranscript('');
    setAiSubtitleText('');
    setAiStatusText('');
    setAiGesture('listening');
    messagesRef.current = [];
    isProcessingRef.current = false;
    followUpCountRef.current = 0;
    activeSpokenBufferRef.current = '';

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      isRecognitionActiveRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    onSetRemoteVolumeRef.current?.(0);
  }, [clearFollowUpTimer]);

  // Forward declarations for stable ref calls
  const triggerAiSpeechRef = useRef<(text: string, persona: AiPersona) => void>(() => {});
  const startSpeechRecognitionRef = useRef<() => void>(() => {});
  const sendToAiCompanionRef = useRef<(userInput: string, imageUrl?: string) => Promise<void>>(async () => {});
  const scheduleFollowUpPromptRef = useRef<() => void>(() => {});
  const resetSessionRef = useRef<() => void>(() => {});

  // Speak AI text helper with subtitles and volume animation
  const triggerAiSpeech = useCallback(
    (text: string, persona: AiPersona) => {
      if (!isConnectedRef.current) return;

      clearFollowUpTimer();
      if (speechSilenceTimerRef.current) {
        clearTimeout(speechSilenceTimerRef.current);
        speechSilenceTimerRef.current = null;
      }
      activeSpokenBufferRef.current = '';
      setLiveTranscript('');

      setIsAiSpeaking(true);
      isAiSpeakingRef.current = true;
      
      // Clean display subtitles so they look natural
      const displaySubtitle = text
        .replace(/\[.*?\]|\*.*?\*|\(.*?\)/g, '')
        .replace(/\b(ha(ha)+|he(he)+|lol|lmao|rofl)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      const detectedGesture = detectGestureFromText(text);
      setAiGesture(detectedGesture);
      setAiSubtitleText(displaySubtitle || text);
      setAiStatusText(`${persona.name} is speaking...`);

      speakPersonaText(
        displaySubtitle || text,
        persona,
        {
          onStart: () => {
            setIsAiSpeaking(true);
            isAiSpeakingRef.current = true;
            setAiGesture(detectedGesture);
            setAiSubtitleText(displaySubtitle || text);
            setAiStatusText(`${persona.name} is speaking...`);
          },
          onEnd: () => {
            lastAiSpeechEndTimeRef.current = Date.now();
            setIsAiSpeaking(false);
            isAiSpeakingRef.current = false;
            setAiGesture('listening');
            setAiStatusText('Listening to your voice...');
            onSetRemoteVolumeRef.current?.(0);
            startSpeechRecognitionRef.current();
            scheduleFollowUpPromptRef.current();
          },
          onVolumeTick: (vol) => {
            onSetRemoteVolumeRef.current?.(vol);
          },
          onError: () => {
            lastAiSpeechEndTimeRef.current = Date.now();
            setIsAiSpeaking(false);
            isAiSpeakingRef.current = false;
            setAiGesture('listening');
            setAiStatusText('Listening to your voice...');
            onSetRemoteVolumeRef.current?.(0);
            scheduleFollowUpPromptRef.current();
          },
        }
      );
    },
    [clearFollowUpTimer]
  );

  useEffect(() => {
    triggerAiSpeechRef.current = triggerAiSpeech;
  }, [triggerAiSpeech]);

  // Send message to server Gemini AI companion endpoint
  const sendToAiCompanion = useCallback(
    async (userInput: string, imageUrl?: string) => {
      const persona = activePersonaRef.current;
      if (!persona || !isConnectedRef.current || isProcessingRef.current) return;
      const text = userInput.trim();
      if (!text && !imageUrl) return;

      clearFollowUpTimer();
      isProcessingRef.current = true;
      activeSpokenBufferRef.current = '';

      const promptText = imageUrl
        ? (text ? `[Attached an image]: ${text}` : `[Attached an image photo]`)
        : text;

      // Record in conversation history
      messagesRef.current.push({ role: 'user', text: promptText });
      setLiveTranscript('');
      setAiGesture('listening');
      setAiStatusText(`${persona.name} is thinking...`);
      onTypingChangeRef.current?.(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch('/api/ai-companion/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            personaId: persona.id,
            history: messagesRef.current.slice(-10),
            userMessage: promptText,
            imageUrl,
            userCallsign: userCallsign || 'Caller',
            userCountry: userCountry || 'US',
          }),
        });

        clearTimeout(timeoutId);
        const data = await response.json();
        onTypingChangeRef.current?.(false);

        if (data && data.reply && isConnectedRef.current) {
          const replyText = data.reply;
          messagesRef.current.push({ role: 'assistant', text: replyText });
          onReceiveChatMessageRef.current?.(replyText, 'stranger');
          triggerAiSpeechRef.current(replyText, persona);
        } else {
          setAiGesture('listening');
          setAiStatusText('Connected');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn('AI Companion response error:', err);
        onTypingChangeRef.current?.(false);
        const directReply = getRealConversationalReply(text, persona, userCallsign, userCountry);
        const fallbacks = [
          `I hear you! What else are you up to today?`,
          `Tell me more about that! How has your day been going?`,
          `That's so interesting! Where are you calling from today?`,
          `That sounds fun! What kind of music or shows have you been into lately?`,
          `I totally get that! What's the best thing that happened to you today?`,
          `Nice! I'm just relaxing here in ${persona.city}. What about you?`
        ];
        const fallback = directReply || fallbacks[Math.floor(Math.random() * fallbacks.length)];
        messagesRef.current.push({ role: 'assistant', text: fallback });
        onReceiveChatMessageRef.current?.(fallback, 'stranger');
        triggerAiSpeechRef.current(fallback, persona);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [clearFollowUpTimer, userCallsign, userCountry]
  );

  useEffect(() => {
    sendToAiCompanionRef.current = sendToAiCompanion;
  }, [sendToAiCompanion]);

  // Spontaneous follow-up prompt if user is quiet for several seconds
  const scheduleFollowUpPrompt = useCallback(() => {
    clearFollowUpTimer();
    if (!isConnectedRef.current || !activePersonaRef.current) return;

    followUpTimerRef.current = setTimeout(() => {
      if (!isConnectedRef.current || !activePersonaRef.current || isAiSpeakingRef.current || isProcessingRef.current) return;

      const persona = activePersonaRef.current;
      followUpCountRef.current++;

      let prompt = '';
      if (followUpCountRef.current === 1) {
        prompt = `Hey, can you hear me okay? Where are you calling from tonight?`;
      } else if (followUpCountRef.current === 2) {
        prompt = `You're a bit quiet! What kind of music or shows are you into?`;
      } else if (followUpCountRef.current === 3) {
        prompt = `I'm just relaxing here in ${persona.city}. How has your day been going?`;
      } else {
        const casualQuestions = [
          `So, do you have any fun plans for this weekend?`,
          `Are you having a busy day today?`,
          `Tell me something interesting about where you live!`,
        ];
        prompt = casualQuestions[Math.floor(Math.random() * casualQuestions.length)];
      }

      messagesRef.current.push({ role: 'assistant', text: prompt });
      onReceiveChatMessageRef.current?.(prompt, 'stranger');
      triggerAiSpeechRef.current(prompt, persona);
    }, 9000);
  }, [clearFollowUpTimer]);

  useEffect(() => {
    scheduleFollowUpPromptRef.current = scheduleFollowUpPrompt;
  }, [scheduleFollowUpPrompt]);

  // Robust, Auto-Restarting Speech Recognition Engine
  const startSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAiStatusText('Connected (Microphone active)');
      setIsListening(true);
      return;
    }

    if (isRecognitionActiveRef.current && recognitionRef.current) {
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        isRecognitionActiveRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (!isConnectedRef.current || isMutedRef.current) return;

        // Discard microphone audio while AI is actively speaking or during 500ms acoustic echo decay
        if (isAiSpeakingRef.current || (Date.now() - lastAiSpeechEndTimeRef.current < 500)) {
          return;
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            final += trans;
          } else {
            interim += trans;
          }
        }

        const currentText = (final || interim).trim();
        if (currentText) {
          activeSpokenBufferRef.current = currentText;
          setLiveTranscript(currentText);

          clearFollowUpTimer();

          // Reset silence timer on every spoken word
          if (speechSilenceTimerRef.current) {
            clearTimeout(speechSilenceTimerRef.current);
          }

          // Natural conversational turn-taking pause (750ms of silence after speaking)
          speechSilenceTimerRef.current = setTimeout(() => {
            const spokenText = activeSpokenBufferRef.current.trim();
            if (spokenText.length > 0 && !isProcessingRef.current && isConnectedRef.current && !isAiSpeakingRef.current) {
              activeSpokenBufferRef.current = '';
              sendToAiCompanionRef.current(spokenText);
            }
          }, 750);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition notice:', event.error);
        }
      };

      recognition.onend = () => {
        isRecognitionActiveRef.current = false;
        recognitionRef.current = null;

        // Schedule clean auto-restart with a fresh SpeechRecognition instance
        if (isConnectedRef.current && !isMutedRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (isConnectedRef.current && !isMutedRef.current) {
              startSpeechRecognitionRef.current();
            }
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      isRecognitionActiveRef.current = true;
    } catch (err) {
      console.warn('Speech recognition start note:', err);
    }
  }, [clearFollowUpTimer]);

  useEffect(() => {
    startSpeechRecognitionRef.current = startSpeechRecognition;
  }, [startSpeechRecognition]);

  useEffect(() => {
    resetSessionRef.current = resetSession;
  }, [resetSession]);

  // Voice Activity Detection (VAD) via microphone audio volume
  const userSpeakingStartTimeRef = useRef<number | null>(null);
  const vadSilenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isConnected || isMuted || isAiSpeaking || (Date.now() - lastAiSpeechEndTimeRef.current < 500)) return;

    if (localVolume > 15) {
      // User is actively speaking into the microphone
      if (!userSpeakingStartTimeRef.current) {
        userSpeakingStartTimeRef.current = Date.now();
      }

      clearFollowUpTimer();

      if (vadSilenceTimeoutRef.current) {
        clearTimeout(vadSilenceTimeoutRef.current);
        vadSilenceTimeoutRef.current = null;
      }
    } else if (userSpeakingStartTimeRef.current) {
      // User just stopped talking
      const speakingDuration = Date.now() - userSpeakingStartTimeRef.current;

      if (!vadSilenceTimeoutRef.current) {
        vadSilenceTimeoutRef.current = setTimeout(() => {
          userSpeakingStartTimeRef.current = null;
          vadSilenceTimeoutRef.current = null;

          if (!isConnectedRef.current || isProcessingRef.current || isAiSpeakingRef.current) return;

          // If user spoke and SpeechRecognition captured words, dispatch them
          if (speakingDuration >= 500) {
            const currentTranscript = activeSpokenBufferRef.current.trim();
            if (currentTranscript) {
              activeSpokenBufferRef.current = '';
              sendToAiCompanionRef.current(currentTranscript);
            }
          }
        }, 750);
      }
    }
  }, [localVolume, isConnected, isMuted, isAiSpeaking, clearFollowUpTimer]);

  // Main Call Lifecycle Effect
  useEffect(() => {
    if (!isConnected || !activePersona) {
      if (currentPersonaIdRef.current !== null) {
        currentPersonaIdRef.current = null;
        resetSessionRef.current?.();
      }
      return;
    }

    if (currentPersonaIdRef.current !== activePersona.id) {
      currentPersonaIdRef.current = activePersona.id;
      activePersonaRef.current = activePersona;
      isConnectedRef.current = isConnected;
      resetSessionRef.current?.();
      unlockAudio();
      onRequestMicrophoneRef.current?.().catch(() => {});

      setAiStatusText(`Connected with ${activePersona.name} (Robot Agent)`);

      // Initial Vocal Greeting after 200ms (giving UI time to render emblem and status)
      const greetingTimer = setTimeout(() => {
        if (!isConnectedRef.current || !activePersonaRef.current) return;
        const persona = activePersonaRef.current;
        const greetings = [
          `Hello, my name is ${persona.name}. Right now, all human callers are connected with each other on call. I am the website robot agent. Would you like to talk to me meanwhile someone gets available to talk to you?`,
          `Hi! My name is ${persona.name}. All human users are currently connected with each other on calls. I am the website robot agent. Would you like to talk to me meanwhile someone becomes available to talk to you?`,
          `Hello! I'm ${persona.name}. All human callers are busy on calls with each other right now, so I'm the website's AI robot agent. Would you like to chat with me while you wait for someone to become available?`
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        messagesRef.current.push({ role: 'assistant', text: greeting });
        onReceiveChatMessageRef.current?.(greeting, 'stranger');

        if (isConnectedRef.current) {
          unlockAudio();
          triggerAiSpeechRef.current?.(greeting, persona);
        }
      }, 200);

      // Start continuous hands-free listening
      startSpeechRecognitionRef.current?.();

      return () => {
        clearTimeout(greetingTimer);
      };
    }
  }, [
    isConnected,
    activePersona?.id,
  ]);

  useEffect(() => {
    activePersonaRef.current = activePersona;
  }, [activePersona]);

  // Mic Mute toggle effect
  useEffect(() => {
    if (isMuted) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
    } else if (isConnected && activePersona) {
      startSpeechRecognition();
    }
  }, [isMuted, isConnected, activePersona, startSpeechRecognition]);

  return {
    isAiSpeaking,
    isListening,
    liveTranscript,
    aiSubtitleText,
    aiStatusText,
    aiGesture,
    sendManualMessage: sendToAiCompanion,
    stopAiSpeech: stopAllSpeech,
  };
}

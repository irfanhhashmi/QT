import { AiPersona } from '../data/aiPersonas';
import { AiGestureType, detectGestureFromText, playGestureAudioCue } from './audioCues';

// Speech synthesis voice cache
let voicesLoaded = false;
let availableVoices: SpeechSynthesisVoice[] = [];

// Global storage to prevent JavaScript garbage collection of active utterances (Chromium/Safari bug)
if (typeof window !== 'undefined') {
  (window as any).__tts_utterances = (window as any).__tts_utterances || [];
  (window as any).__tts_active = null;
}

export function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      availableVoices = list;
      voicesLoaded = true;
    }
  } catch (e) {
    console.warn('Error loading speechSynthesis voices:', e);
  }
  return availableVoices;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

// User-gesture audio unlocker for Web Speech API and Web Audio
let isAudioUnlocked = false;
let globalAudioCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!globalAudioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        globalAudioCtx = new AudioCtx();
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch {
    return null;
  }
}

export function unlockAudio() {
  if (typeof window === 'undefined') return;
  
  // 1. Unlock Web Audio Context
  try {
    const ctx = getSharedAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      // Brief inaudible pulse to activate hardware audio pipeline
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  } catch {}

  // 2. Unlock Speech Synthesis API
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.resume();
      loadVoices();
      
      // Emit a silent 1-character utterance during user gesture to satisfy browser autoplay policy
      if (!isAudioUnlocked) {
        const silent = new SpeechSynthesisUtterance(' ');
        silent.volume = 0.01;
        silent.rate = 2.0;
        window.speechSynthesis.speak(silent);
      }
    } catch {}
  }

  // 3. Unlock HTMLMediaElement for WebRTC (Mobile Safari & Android Chrome autoplay authorization)
  try {
    const audioEl = document.getElementById('voicetalk-remote-audio') as HTMLAudioElement | null;
    if (audioEl) {
      audioEl.muted = false;
      audioEl.volume = 1.0;
      if (audioEl.srcObject) {
        audioEl.play().catch(() => {});
      }
    }
    const dummyAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    dummyAudio.volume = 0.001;
    dummyAudio.play().catch(() => {});
  } catch {}

  isAudioUnlocked = true;
}

// Auto-attach unlocker to user interaction events on window
if (typeof window !== 'undefined') {
  const unlockEvents = ['click', 'touchstart', 'keydown', 'mousedown', 'pointerdown'];
  const handleInteraction = () => {
    unlockAudio();
  };
  unlockEvents.forEach((evt) => window.addEventListener(evt, handleInteraction, { passive: true, capture: true }));
}

/**
 * Score a voice based on naturalness, human inflection, gender, and language match.
 * Strongly prioritizes Natural / Neural / Enhanced / Google / Siri voices.
 */
function scoreVoice(voice: SpeechSynthesisVoice, targetLangs: string[]): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase().replace('_', '-');
  let score = 0;

  // Language match
  const isTargetLang = targetLangs.some(t => lang.startsWith(t.toLowerCase()));
  if (isTargetLang) score += 100;
  else if (lang.startsWith('en')) score += 40;
  else return -100; // Skip non-English for English-speaking personas

  // Neural / Natural / Premium voice indicators (sound closest to real human)
  if (name.includes('natural') || name.includes('neural')) score += 90;
  if (name.includes('enhanced') || name.includes('premium')) score += 80;
  if (name.includes('google')) score += 70;
  if (name.includes('online')) score += 60;
  if (name.includes('siri')) score += 65;

  // Female voice hints
  const femaleVoiceHints = [
    'female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona',
    'zira', 'jenny', 'aria', 'natasha', 'stephanie', 'serena', 'susan',
    'veena', 'google us english', 'google uk english female', 'catherine',
    'olivia', 'emma', 'amy', 'hazel', 'linda', 'joanna', 'ivy', 'kendra',
    'ava', 'allison', 'kate', 'zoe', 'clara', 'sonia', 'libby', 'neerja', 'emily'
  ];

  if (femaleVoiceHints.some(hint => name.includes(hint))) {
    score += 50;
  }

  // Penalize robotic / legacy desktop synthesizers
  if (name.includes('desktop') || name.includes('synthesizer') || name.includes('espeak') || name.includes('microsoft david') || name.includes('microsoft mark')) {
    score -= 60;
  }

  return score;
}

/**
 * Finds the most natural, human-sounding female voice matching the persona's regional accent.
 */
export function getBestVoiceForPersona(persona: AiPersona): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = availableVoices.length > 0 ? availableVoices : loadVoices();
  if (!voices || voices.length === 0) return null;

  // Region prefix map
  const langTargets: Record<string, string[]> = {
    US: ['en-us', 'en'],
    UK: ['en-gb', 'en-ie', 'en'],
    AU: ['en-au', 'en-nz', 'en'],
    CA: ['en-ca', 'en-us', 'en'],
    IE: ['en-ie', 'en-gb', 'en'],
    EU: ['en-gb', 'en-us', 'en'],
  };

  const targets = langTargets[persona.voiceAccent] || ['en-us', 'en'];

  let bestVoice: SpeechSynthesisVoice | null = null;
  let highestScore = -Infinity;

  for (const voice of voices) {
    const s = scoreVoice(voice, targets);
    if (s > highestScore) {
      highestScore = s;
      bestVoice = voice;
    }
  }

  return bestVoice || voices[0] || null;
}

/**
 * Cleans text for spoken voice:
 * - Detects amused smile/laugh gestures
 * - Strips literal "haha", "hehe", "lol", asterisks, brackets, and emojis
 */
export function cleanTextForSpokenVoice(text: string): { cleanedText: string; gesture: AiGestureType } {
  if (!text) return { cleanedText: '', gesture: 'speaking' };

  const gesture = detectGestureFromText(text);

  let clean = text;
  // Remove stage directions / brackets / parentheticals
  clean = clean.replace(/\[.*?\]|\*.*?\*|\(.*?\)/g, ' ');
  // Remove literal "haha", "hehe", "lol", "lmao", "rofl", "xd"
  clean = clean.replace(/\b(ha(ha)+|he(he)+|lol|lmao|rofl|xd|haha|hehe)\b/gi, ' ');
  // Remove emojis
  clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ');
  // Clean punctuation artifacts
  clean = clean.replace(/^[\s,;:-]+/, '').replace(/\s{2,}/g, ' ').trim();

  return { cleanedText: clean, gesture };
}

let simulatedAudioInterval: NodeJS.Timeout | null = null;
let speechWatchdogTimer: NodeJS.Timeout | null = null;
let chromeHeartbeatTimer: NodeJS.Timeout | null = null;
let isSpeakingActive = false;

/**
 * Speaks text naturally using Speech Synthesis with natural voice selection,
 * real-time waveform volume simulation, and gesture acoustics.
 */
export function speakPersonaText(
  text: string,
  persona: AiPersona,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    onVolumeTick?: (volume: number) => void;
  }
): () => void {
  // Stop previous speech cleanly
  stopAllSpeech();
  unlockAudio();

  const { cleanedText, gesture } = cleanTextForSpokenVoice(text);
  if (!cleanedText) {
    options?.onEnd?.();
    return () => {};
  }

  isSpeakingActive = true;

  const startVolumeSimulation = () => {
    if (simulatedAudioInterval) clearInterval(simulatedAudioInterval);
    let step = 0;
    simulatedAudioInterval = setInterval(() => {
      if (!isSpeakingActive) {
        clearInterval(simulatedAudioInterval!);
        simulatedAudioInterval = null;
        return;
      }
      step++;
      const wave = Math.sin(step * 0.45) * 0.5 + 0.5;
      const noise = (Math.random() - 0.5) * 0.25;
      const energy = Math.max(35, Math.min(95, Math.round((wave * 0.7 + noise) * 65 + 35)));
      options?.onVolumeTick?.(energy);
    }, 60);
  };

  const stopVolumeSimulation = () => {
    if (simulatedAudioInterval) {
      clearInterval(simulatedAudioInterval);
      simulatedAudioInterval = null;
    }
    if (chromeHeartbeatTimer) {
      clearInterval(chromeHeartbeatTimer);
      chromeHeartbeatTimer = null;
    }
    options?.onVolumeTick?.(0);
  };

  // Browser SpeechSynthesis execution
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options?.onStart?.();
    startVolumeSimulation();
    const approxDuration = Math.max(2000, cleanedText.split(' ').length * 320);
    setTimeout(() => {
      stopVolumeSimulation();
      isSpeakingActive = false;
      options?.onEnd?.();
    }, approxDuration);
    return () => stopAllSpeech();
  }

  const voice = getBestVoiceForPersona(persona);
  const utterance = new SpeechSynthesisUtterance(cleanedText);

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-US';
  }

  let basePitch = persona.pitch || 1.08;
  let baseRate = persona.rate || 1.0;

  if (cleanedText.endsWith('?')) {
    basePitch += 0.05;
  }

  utterance.pitch = Math.max(0.9, Math.min(1.22, basePitch));
  utterance.rate = Math.max(0.95, Math.min(1.05, baseRate));
  utterance.volume = 1.0;

  // Retain active utterance reference to prevent garbage collection bug
  (window as any).__tts_active = utterance;
  (window as any).__tts_utterances.push(utterance);
  if ((window as any).__tts_utterances.length > 25) {
    (window as any).__tts_utterances.splice(0, 10);
  }

  let finished = false;
  const finishSpeech = () => {
    if (finished) return;
    finished = true;
    isSpeakingActive = false;
    (window as any).__tts_active = null;

    if (speechWatchdogTimer) {
      clearTimeout(speechWatchdogTimer);
      speechWatchdogTimer = null;
    }
    stopVolumeSimulation();
    options?.onEnd?.();
  };

  utterance.onstart = () => {
    if (finished) return;
    options?.onStart?.();
    startVolumeSimulation();
  };

  utterance.onend = () => {
    finishSpeech();
  };

  utterance.onerror = (e) => {
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      console.warn('SpeechSynthesis notice:', e.error);
    }
    finishSpeech();
  };

  // Chromium 14-second pause bug workaround
  chromeHeartbeatTimer = setInterval(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  }, 2000);

  // Generous speech watchdog
  const estimatedTime = Math.max(4000, cleanedText.split(' ').length * 600 + 3000);
  speechWatchdogTimer = setTimeout(() => {
    if (!finished && isSpeakingActive) {
      finishSpeech();
    }
  }, estimatedTime);

  const executeSpeak = () => {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
      options?.onStart?.();
      startVolumeSimulation();
    } catch (err) {
      console.warn('SpeechSynthesis invocation error:', err);
      finishSpeech();
    }
  };

  // Play gesture chime/cue if detected, then speak
  if (gesture === 'amused' || gesture === 'surprised' || gesture === 'affirmative' || gesture === 'empathetic') {
    playGestureAudioCue(gesture, () => {
      if (isSpeakingActive) {
        setTimeout(executeSpeak, 40);
      }
    });
  } else {
    setTimeout(executeSpeak, 30);
  }

  return () => {
    stopAllSpeech();
  };
}

export function stopAllSpeech() {
  isSpeakingActive = false;

  if (speechWatchdogTimer) {
    clearTimeout(speechWatchdogTimer);
    speechWatchdogTimer = null;
  }
  if (simulatedAudioInterval) {
    clearInterval(simulatedAudioInterval);
    simulatedAudioInterval = null;
  }
  if (chromeHeartbeatTimer) {
    clearInterval(chromeHeartbeatTimer);
    chromeHeartbeatTimer = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      window.speechSynthesis.resume();
    } catch {}
  }
}



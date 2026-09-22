/**
 * Real-time Web Audio API Acoustic Synthesizer for AI Persona Non-Verbal Audio Cues.
 * Provides organic auditory depth for non-verbal gestures (laughter, surprised gasp, affirmative nods, gentle sighs, thoughtful hmms).
 */

export type AiGestureType =
  | 'amused'
  | 'surprised'
  | 'affirmative'
  | 'empathetic'
  | 'thinking'
  | 'speaking'
  | 'listening';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Synthesizes a soft, organic acoustic chuckle/giggle when an 'amused' gesture is triggered.
 */
export function playAmusedCue(ctx: AudioContext, onDone?: () => void) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.15, now);
  masterGain.connect(ctx.destination);

  // 2-3 warm chuckle pulses with formant resonance
  const pulses = [0, 0.12, 0.23];
  pulses.forEach((pulseOffset, idx) => {
    const startTime = now + pulseOffset;
    const baseFreq = 460 + (idx === 0 ? 30 : idx === 1 ? -10 : -40) + (Math.random() * 16 - 8);

    // Vocal Tone Oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.78, startTime + 0.09);

    // Breath Formant Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, startTime);
    filter.Q.setValueAtTime(2.8, startTime);

    // Breath Noise Buffer
    const bufferSize = Math.floor(ctx.sampleRate * 0.09);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.14;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Pulse Gain Envelope
    const pulseGain = ctx.createGain();
    pulseGain.gain.setValueAtTime(0.001, startTime);
    pulseGain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.025);
    pulseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.095);

    osc.connect(pulseGain);
    noise.connect(filter);
    filter.connect(pulseGain);
    pulseGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.1);
    noise.start(startTime);
    noise.stop(startTime + 0.1);
  });

  setTimeout(() => {
    try {
      ctx.close().catch(() => {});
    } catch {}
    onDone?.();
  }, 360);
}

/**
 * Synthesizes a soft, curious breath intake / surprised melodic gasp when a 'surprised' gesture is triggered.
 */
export function playSurprisedCue(ctx: AudioContext, onDone?: () => void) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.12, now);
  masterGain.connect(ctx.destination);

  // Rising breath formant
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(700, now);
  filter.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
  filter.Q.setValueAtTime(3.5, now);

  // Breath noise
  const bufferSize = Math.floor(ctx.sampleRate * 0.2);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.18;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  // Soft vocal curiosity tone
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(380, now);
  osc.frequency.exponentialRampToValueAtTime(560, now + 0.16);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.08);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  noise.connect(filter);
  filter.connect(gainNode);
  osc.connect(gainNode);
  gainNode.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.2);
  noise.start(now);
  noise.stop(now + 0.2);

  setTimeout(() => {
    try {
      ctx.close().catch(() => {});
    } catch {}
    onDone?.();
  }, 240);
}

/**
 * Synthesizes a friendly affirmative double-tone ("Mhm" / "Uh-huh") when agreeing or nodding.
 */
export function playAffirmativeCue(ctx: AudioContext, onDone?: () => void) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.12, now);
  masterGain.connect(ctx.destination);

  // Tone 1 ("Uh")
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(340, now);
  osc1.frequency.linearRampToValueAtTime(360, now + 0.08);

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc1.connect(gain1);
  gain1.connect(masterGain);
  osc1.start(now);
  osc1.stop(now + 0.1);

  // Tone 2 ("Huh" - higher harmonic resolution)
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(440, now + 0.11);
  osc2.frequency.linearRampToValueAtTime(460, now + 0.2);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.001, now + 0.11);
  gain2.gain.exponentialRampToValueAtTime(0.24, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc2.connect(gain2);
  gain2.connect(masterGain);
  osc2.start(now + 0.11);
  osc2.stop(now + 0.23);

  setTimeout(() => {
    try {
      ctx.close().catch(() => {});
    } catch {}
    onDone?.();
  }, 260);
}

/**
 * Synthesizes a soft, empathetic breath sigh for comforting or relaxing moments.
 */
export function playEmpatheticCue(ctx: AudioContext, onDone?: () => void) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.1, now);
  masterGain.connect(ctx.destination);

  // Breath noise
  const bufferSize = Math.floor(ctx.sampleRate * 0.28);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.12;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(650, now);
  filter.frequency.exponentialRampToValueAtTime(320, now + 0.26);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(masterGain);

  noise.start(now);
  noise.stop(now + 0.28);

  setTimeout(() => {
    try {
      ctx.close().catch(() => {});
    } catch {}
    onDone?.();
  }, 300);
}

/**
 * Synthesizes a subtle thoughtful "hmm" harmonic cadence while the AI begins thinking.
 */
export function playThinkingCue(ctx: AudioContext, onDone?: () => void) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.08, now);
  masterGain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(310, now);
  osc.frequency.linearRampToValueAtTime(350, now + 0.08);
  osc.frequency.linearRampToValueAtTime(330, now + 0.16);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gainNode);
  gainNode.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.19);

  setTimeout(() => {
    try {
      ctx.close().catch(() => {});
    } catch {}
    onDone?.();
  }, 220);
}

/**
 * Master dispatcher to play the audio cue associated with a gesture.
 */
export function playGestureAudioCue(gesture: AiGestureType, onDone?: () => void): void {
  const ctx = getAudioContext();
  if (!ctx) {
    onDone?.();
    return;
  }

  switch (gesture) {
    case 'amused':
      playAmusedCue(ctx, onDone);
      break;
    case 'surprised':
      playSurprisedCue(ctx, onDone);
      break;
    case 'affirmative':
      playAffirmativeCue(ctx, onDone);
      break;
    case 'empathetic':
      playEmpatheticCue(ctx, onDone);
      break;
    case 'thinking':
      playThinkingCue(ctx, onDone);
      break;
    default:
      try {
        ctx.close().catch(() => {});
      } catch {}
      onDone?.();
      break;
  }
}

/**
 * Analyzes conversational text to detect emotional / non-verbal gestures.
 */
export function detectGestureFromText(text: string): AiGestureType {
  if (!text) return 'speaking';
  const lower = text.toLowerCase();

  // 1. Amused / Laughter / Chuckle
  if (
    /\b(ha(ha)+|he(he)+|lol|lmao|rofl|funny|hilarious|cracking up|so wild|laugh|giggle|chuckle|joke)\b/.test(lower) ||
    /\*.*(laugh|smile|giggle|chuckle).*\*/i.test(text) ||
    /\[.*(laugh|smile|giggle|chuckle).*\]/i.test(text)
  ) {
    return 'amused';
  }

  // 2. Surprised / Wonder
  if (
    /\b(no way|oh wow|really\?!|are you serious|unbelievable|gasp|whoa|whaaat|omg)\b/.test(lower) ||
    /\*.*(gasp|surprised|shocked).*\*/i.test(text)
  ) {
    return 'surprised';
  }

  // 3. Affirmative / Agreeing / Nod
  if (
    /\b(totally|exactly|for sure|i agree|100%|definitely|i know right|right on|absolutely)\b/.test(lower) ||
    /\*.*(nod|agrees).*\*/i.test(text)
  ) {
    return 'affirmative';
  }

  // 4. Empathetic / Comforting / Relaxed
  if (
    /\b(i hear you|aww|so relaxing|take care|take it easy|deep breath|stay safe|sending love)\b/.test(lower) ||
    /\*.*(sigh|smile warmly|comforting).*\*/i.test(text)
  ) {
    return 'empathetic';
  }

  return 'speaking';
}

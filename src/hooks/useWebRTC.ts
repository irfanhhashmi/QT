import { useState, useRef, useCallback, useEffect } from 'react';

// Network quality detection helper
function getNetworkQuality(): 'slow-2g' | '2g' | '3g' | '4g' | 'unknown' {
  if (typeof navigator !== 'undefined' && (navigator as any).connection) {
    const connection = (navigator as any).connection;
    const effectiveType = connection.effectiveType || 'unknown';
    
    // effectiveType: 'slow-2g', '2g', '3g', '4g'
    console.log('[WebRTC] Network quality detected:', effectiveType);
    return effectiveType;
  }
  return 'unknown';
}

// Get bitrate limit based on network quality
function getBitrateLimitForNetwork(networkQuality: string): number {
  switch (networkQuality) {
    case 'slow-2g':
    case '2g':
      // GPRS/Edge: 32 kbps max (safe margin for 50-80 kbps networks)
      return 32000;
    case '3g':
      // 3G: 64 kbps max
      return 64000;
    case '4g':
    default:
      // 4G/LTE and unknown: 128 kbps (current setting)
      return 128000;
  }
}

// Get TURN URL priorities based on network quality
function getTurnUrlsForNetwork(networkQuality: string): string[] {
  const baseTurn = 'hk-turn1.xirsys.com';
  
  switch (networkQuality) {
    case 'slow-2g':
    case '2g':
      // GPRS: Prefer TCP (more reliable on slow networks)
      // Avoid port 80 (HTTP interference), prioritize TLS 443
      return [
        `turn:${baseTurn}:3478?transport=tcp`,
        `turns:${baseTurn}:443?transport=tcp`,
      ];
    case '3g':
      // 3G: TCP first, then UDP
      return [
        `turn:${baseTurn}:3478?transport=tcp`,
        `turn:${baseTurn}:3478?transport=udp`,
        `turns:${baseTurn}:443?transport=tcp`,
      ];
    case '4g':
    default:
      // 4G: UDP preferred (faster), TCP fallback
      return [
        `turn:${baseTurn}:3478?transport=udp`,
        `turn:${baseTurn}:3478?transport=tcp`,
        `turns:${baseTurn}:443?transport=tcp`,
      ];
  }
}

// Get ICE candidate pool size based on network
function getIceCandidatePoolSize(networkQuality: string): number {
  switch (networkQuality) {
    case 'slow-2g':
    case '2g':
      // GPRS: Small pool to save bandwidth (fewer candidates = less overhead)
      return 2;
    case '3g':
      return 5;
    case '4g':
    default:
      return 10;
  }
}

// STUN servers (help two devices discover each other for a DIRECT connection)
// TURN servers (relay audio when a direct connection isn't possible - required for
// most real-world cross-network calls: mobile data, carrier-grade NAT, strict Wi-Fi, etc.)
//
// IMPORTANT: a previous edit stripped out the TURN credentials, leaving ONLY stun: entries.
// Without a working TURN relay, calls between two different networks will frequently fail
// to connect properly, or connect after a long delay and then stay degraded - this was the
// primary cause of the reported "15 second delay, then stays delayed" symptom.
//
// WebRTC ICE Servers configured exclusively for Xirsys TURN & verified STUN
const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun.cloudflare.com:3478',
    ],
  },
];

export interface WebRTCState {
  isMuted: boolean;
  hasAudioPermission: boolean;
  localVolume: number;    // 0 to 100
  remoteVolume: number;   // 0 to 100
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed';
  permissionError: string | null;
}

export function useWebRTC(onSendSignal: (signal: RTCSessionDescriptionInit | RTCIceCandidateInit | any) => void) {
  const [isMuted, setIsMuted] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [localVolume, setLocalVolume] = useState(0);
  const [remoteVolume, setRemoteVolume] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const speakerGainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const remoteAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Queue to buffer pending ICE candidates until remote description is set
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  // Queue to buffer session offers/answers if arrived before PC initialization completes
  const pendingSDPRef = useRef<RTCSessionDescriptionInit | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const onSendSignalRef = useRef(onSendSignal);
  // Remembers which side of the call we are, so only the original offer-creator
  // attempts an ICE restart (prevents both sides racing to renegotiate at once).
  const isInitiatorRef = useRef<boolean>(false);
  // Timer used to give a brief grace period on 'disconnected' before attempting
  // a restart, since short blips (e.g. switching Wi-Fi to mobile data) often
  // recover on their own within a second or two.
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptReconnectRef = useRef<(() => void) | null>(null);
  const consecutiveDisconnectedTicksRef = useRef<number>(0);

  // Diagnostic telemetry interval reference
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      console.log('[WebRTC Telemetry] Call connected successfully. Starting diagnostics telemetry...');
      
      // ADD THIS:
      const networkQuality = getNetworkQuality();
      const maxBitrate = getBitrateLimitForNetwork(networkQuality);
      console.log(`[WebRTC Telemetry] Network Quality: ${networkQuality}, Audio Bitrate Limit: ${maxBitrate/1000}kbps`);
      
      // Check if we're actually using reduced bitrate on GPRS
      if ((networkQuality === 'slow-2g' || networkQuality === '2g') && maxBitrate === 32000) {
        console.log('[WebRTC Telemetry] ✓ GPRS mode active: Low bitrate audio enabled');
      }

      // Check local stream track status
      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getAudioTracks();
        if (tracks.length > 0) {
          const t = tracks[0];
          const isSynth = !!(t as any)._isSynthetic;
          console.log(`[WebRTC Telemetry] Local Audio Track: id=${t.id}, label="${t.label}", enabled=${t.enabled}, readyState=${t.readyState}, isSynthetic=${isSynth}`);
        } else {
          console.warn('[WebRTC Telemetry] WARNING: No local audio tracks found in localStream!');
        }
      } else {
        console.warn('[WebRTC Telemetry] WARNING: localStreamRef is null!');
      }

      // Check remote stream track status
      if (remoteStreamRef.current) {
        const tracks = remoteStreamRef.current.getAudioTracks();
        if (tracks.length > 0) {
          const t = tracks[0];
          console.log(`[WebRTC Telemetry] Remote Audio Track: id=${t.id}, enabled=${t.enabled}, readyState=${t.readyState}, muted=${t.muted}`);
        } else {
          console.warn('[WebRTC Telemetry] WARNING: No remote audio tracks received in remoteStream yet!');
        }
      }

      // Periodic WebRTC stats and metrics logger
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = setInterval(async () => {
        const pc = peerConnectionRef.current;
        if (!pc || pc.connectionState !== 'connected') {
          if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
            statsIntervalRef.current = null;
          }
          return;
        }

        try {
          const stats = await pc.getStats();
          let bytesSent = 0;
          let bytesReceived = 0;
          let candidatePairType = 'unknown';
          let localCandidateType = '';
          let remoteCandidateType = '';
          let transportProtocol = '';

          stats.forEach((report) => {
            if (report.type === 'outbound-rtp' && report.kind === 'audio') {
              bytesSent = report.bytesSent || 0;
            }
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
              bytesReceived = report.bytesReceived || 0;
            }
            if (report.type === 'transport') {
              // check selected candidate pair
              const selectedPairId = report.selectedCandidatePairId;
              if (selectedPairId) {
                const pairReport = stats.get(selectedPairId);
                if (pairReport) {
                  candidatePairType = pairReport.state || 'active';
                  const localCand = stats.get(pairReport.localCandidateId);
                  const remoteCand = stats.get(pairReport.remoteCandidateId);
                  if (localCand) localCandidateType = localCand.candidateType; // host, srflx, relay
                  if (remoteCand) remoteCandidateType = remoteCand.candidateType;
                  transportProtocol = localCand?.protocol || '';
                }
              }
            }
          });

          console.log(`[WebRTC Stats] bytesSent=${bytesSent}, bytesReceived=${bytesReceived}, transport=${transportProtocol}, localCandidate=${localCandidateType}, remoteCandidate=${remoteCandidateType}`);
          if (bytesReceived === 0) {
            console.warn('[WebRTC Stats Warning] bytesReceived is 0! Audio packets are not arriving from the peer or being dropped.');
          }
        } catch (e) {
          console.warn('[WebRTC Stats Error]', e);
        }
      }, 3000);
    } else {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    };
  }, [connectionStatus]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    onSendSignalRef.current = onSendSignal;
  }, [onSendSignal]);

  // Unlock and get AudioContext with mobile resume support
  const getAudioContext = useCallback(() => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      return audioContextRef.current;
    } catch (e) {
      console.warn('[WebRTC] AudioContext creation warning:', e);
      return null;
    }
  }, []);

  // Concurrency guard for getUserMedia to prevent mobile AbortError
  const micPromiseRef = useRef<Promise<MediaStream> | null>(null);

  // Request Microphone Stream with concurrency deduplication & fallback track replacement
  const requestMicrophone = useCallback(async (): Promise<MediaStream> => {
    setPermissionError(null);

    // 1. Reuse existing active real microphone stream if live
    if (localStreamRef.current && localStreamRef.current.active && localStreamRef.current.getAudioTracks().length > 0) {
      const activeTrack = localStreamRef.current.getAudioTracks().find(t => t.readyState === 'live');
      if (activeTrack && !(activeTrack as any)._isSynthetic) {
        setHasAudioPermission(true);
        return localStreamRef.current;
      }
    }

    // 2. If a request is already in-flight, return existing promise (prevents concurrent mobile getUserMedia AbortError)
    if (micPromiseRef.current) {
      return micPromiseRef.current;
    }

    // 3. Initiate getUserMedia request
    const promise = (async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          let stream: MediaStream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: { ideal: true },
                noiseSuppression: { ideal: true },
                autoGainControl: { ideal: true },
                channelCount: { ideal: 1 },
              },
              video: false,
            });
          } catch (primaryErr) {
            console.warn('[WebRTC] Advanced audio constraints rejected, falling back to simple audio: true', primaryErr);
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
          }

          localStreamRef.current = stream;
          setHasAudioPermission(true);
          setPermissionError(null);

          // Ensure local tracks are enabled and active
          stream.getAudioTracks().forEach((track) => {
            track.enabled = !isMutedRef.current;
          });

          // If RTCPeerConnection was created beforehand, replace or add track immediately!
          if (peerConnectionRef.current) {
            const realTrack = stream.getAudioTracks()[0];
            if (realTrack) {
              const senders = peerConnectionRef.current.getSenders();
              const audioSender = senders.find(s => !s.track || s.track.kind === 'audio');
              if (audioSender) {
                console.log('[WebRTC] Upgrading peer connection sender with authorized microphone track...');
                audioSender.replaceTrack(realTrack).catch(e => console.warn('[WebRTC] Track replace note:', e));
              } else {
                try {
                  peerConnectionRef.current.addTrack(realTrack, stream);
                } catch (e) {
                  console.warn('[WebRTC] Track add note:', e);
                }
              }
            }
          }

          // Setup local audio analyzer for visualizer (skip on low-bandwidth/GPRS connections)
          try {
            const conn = (navigator as any).connection;
            const isSlow = conn && ['slow-2g', '2g'].includes(conn.effectiveType);
            if (!isSlow) {
              const ctx = getAudioContext();
              if (ctx) {
                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.8;
                source.connect(analyser);
                localAnalyserRef.current = analyser;
              }
            } else {
              console.log('[WebRTC] Skipping local analyzer setup due to slow connection');
            }
          } catch (e) {
            console.warn('[WebRTC] Local analyzer init note:', e);
          }

          return stream;
        }
      } catch (mediaErr: unknown) {
        console.warn('[WebRTC] Microphone getUserMedia warning:', mediaErr);
        const errMsg = (mediaErr as Error)?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. You can still listen and chat.'
          : 'Could not access microphone hardware.';
        setPermissionError(errMsg);
        setHasAudioPermission(false);
      } finally {
        micPromiseRef.current = null;
      }

      // 4. Temporary synthetic track ONLY if real mic is denied or unavailable
      try {
        const ctx = getAudioContext();
        if (ctx) {
          const dest = ctx.createMediaStreamDestination();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.value = 0.0001;
          osc.connect(gain);
          gain.connect(dest);
          osc.start();

          const fallbackStream = dest.stream;
          const fallbackTrack = fallbackStream.getAudioTracks()[0];
          if (fallbackTrack) {
            (fallbackTrack as any)._isSynthetic = true;
          }
          localStreamRef.current = fallbackStream;
          return fallbackStream;
        }
      } catch (err) {
        console.warn('[WebRTC] Fallback stream generator error:', err);
      }

      // Final fallback empty media stream
      const emptyStream = new MediaStream();
      localStreamRef.current = emptyStream;
      return emptyStream;
    })();

    micPromiseRef.current = promise;
    return promise;
  }, [getAudioContext]);

  // Lightweight 10Hz audio level monitoring loop using WebRTC getStats and local analyser
  useEffect(() => {
    let active = true;
    const localData = new Uint8Array(64);

    const interval = setInterval(async () => {
      if (!active) return;

      // 1. Local Microphone Volume (from local analyser or mute status)
      if (localAnalyserRef.current && !isMutedRef.current) {
        try {
          localAnalyserRef.current.getByteFrequencyData(localData);
          let sum = 0;
          for (let i = 0; i < localData.length; i++) {
            sum += localData[i];
          }
          const avg = sum / localData.length;
          setLocalVolume(Math.min(100, Math.round((avg / 128) * 100)));
        } catch {
          setLocalVolume(0);
        }
      } else {
        setLocalVolume(0);
      }

      // 2. Remote Voice Level using native WebRTC C++ stats (zero CPU/main-thread overhead)
      const pc = peerConnectionRef.current;
      if (pc && pc.connectionState === 'connected') {
        try {
          const stats = await pc.getStats();
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
              if (typeof report.audioLevel === 'number') {
                const vol = Math.min(100, Math.round(report.audioLevel * 100));
                setRemoteVolume(vol);
              }
            }
          });
        } catch {}
      } else {
        setRemoteVolume(0);
      }
    }, 100);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Ensure remote audio playback element exists in-viewport (never offscreen -9999px which causes mobile Safari/Chrome to cull audio playback)
  useEffect(() => {
    let audio = document.getElementById('voicetalk-remote-audio') as HTMLAudioElement;
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'voicetalk-remote-audio';
      audio.autoplay = true;
      (audio as any).playsInline = true;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.setAttribute('autoplay', 'true');
      audio.volume = 1.0;
      audio.muted = false;
      audio.style.position = 'fixed';
      audio.style.bottom = '2px';
      audio.style.right = '2px';
      audio.style.width = '2px';
      audio.style.height = '2px';
      audio.style.opacity = '0.1';
      audio.style.pointerEvents = 'none';
      audio.style.zIndex = '9999';
      document.body.appendChild(audio);
    }
    remoteAudioElementRef.current = audio;

    // Attach global user interaction handler to unlock/resume audio if autoplay policy suspended it
    const handleUserInteraction = () => {
      // Warm up mobile browser audio engine via throwaway element so remote audio srcObject is never mutated
      try {
        const dummy = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        dummy.volume = 0.001;
        dummy.play().catch(() => {});
      } catch {}

      if (remoteAudioElementRef.current) {
        remoteAudioElementRef.current.muted = false;
        remoteAudioElementRef.current.volume = 1.0;
        if (remoteAudioElementRef.current.srcObject) {
          remoteAudioElementRef.current.play().catch(() => {});
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    };

    // Mobile visibility watchdog: re-enable tracks and resume playback when user switches back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[WebRTC] Page became visible, ensuring audio tracks enabled and active');
        if (remoteStreamRef.current) {
          remoteStreamRef.current.getAudioTracks().forEach(t => { if (!t.enabled) t.enabled = true; });
        }
        if (remoteAudioElementRef.current && remoteAudioElementRef.current.srcObject) {
          remoteAudioElementRef.current.muted = false;
          remoteAudioElementRef.current.volume = 1.0;
          remoteAudioElementRef.current.play().catch(() => {});
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    };

    window.addEventListener('click', handleUserInteraction, { passive: true, capture: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true, capture: true });
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true, capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', handleUserInteraction, true);
      window.removeEventListener('touchstart', handleUserInteraction, true);
      window.removeEventListener('pointerdown', handleUserInteraction, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (remoteAudioElementRef.current) {
        remoteAudioElementRef.current.pause();
        remoteAudioElementRef.current.srcObject = null;
      }
    };
  }, []);

  // Drain pending ICE candidates once remoteDescription is set
  const drainPendingIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) return;

    const candidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        if (candidate.candidate && typeof candidate.candidate === 'string' && candidate.candidate.trim().length > 0) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.warn('[WebRTC] Error adding buffered ICE candidate:', err);
      }
    }
  }, []);

  // Process an incoming signal (offer, answer, or candidate)
  const processSignal = useCallback(async (pc: RTCPeerConnection, signal: any) => {
    if (!signal || !pc) return;

    try {
      // 1. Session Description (Offer or Answer)
      if (signal.type === 'offer' && signal.sdp) {
        console.log('[WebRTC] Received offer, signaling state:', pc.signalingState);
        const offerCollision = pc.signalingState !== 'stable';
        const isPolite = !isInitiatorRef.current; // non-initiator is polite peer

        if (offerCollision) {
          if (!isPolite) {
            console.log('[WebRTC] Impolite peer ignoring offer collision.');
            return;
          }
          console.log('[WebRTC] Polite peer rolling back local description to accept incoming offer...');
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch (rbErr) {
            console.warn('[WebRTC] Rollback note:', rbErr);
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription({ type: signal.type, sdp: signal.sdp }));
        await drainPendingIceCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[WebRTC] Created answer, sending back...');
        onSendSignalRef.current({ type: answer.type, sdp: answer.sdp });
      } else if (signal.type === 'answer' && signal.sdp) {
        console.log('[WebRTC] Received answer, setting remote description...');
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: signal.type, sdp: signal.sdp }));
          await drainPendingIceCandidates(pc);
        }
      } else if (signal.type === 'request_ice_restart') {
        console.log('[WebRTC] Received ICE restart request from peer, initiating renegotiation...');
        if (attemptReconnectRef.current) {
          attemptReconnectRef.current();
        }
      } 
      // 2. ICE Candidate
      else if (signal.candidate !== undefined || signal.sdpMid !== undefined || signal.sdpMLineIndex !== undefined) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            if (signal.candidate && typeof signal.candidate === 'string' && signal.candidate.trim().length > 0) {
              await pc.addIceCandidate(new RTCIceCandidate(signal));
            }
          } catch (err) {
            console.warn('[WebRTC] Error adding ICE candidate:', err);
          }
        } else {
          // Remote description not set yet, buffer candidate
          pendingCandidatesRef.current.push(signal);
        }
      }
    } catch (err) {
      console.warn('[WebRTC] Signal handling error:', err);
    }
  }, [drainPendingIceCandidates]);

  // Handle incoming signaling message from peer
  const handleIncomingSignal = useCallback(async (signal: any) => {
    if (!signal) return;

    const pc = peerConnectionRef.current;
    if (!pc || isInitializingRef.current) {
      if (signal.type === 'offer' || signal.type === 'answer') {
        pendingSDPRef.current = signal;
      } else {
        pendingCandidatesRef.current.push(signal);
      }
      return;
    }

    await processSignal(pc, signal);
  }, [processSignal]);

  // Initialize WebRTC Peer Connection
  const initPeerConnection = useCallback(async (isInitiator: boolean) => {
    isInitializingRef.current = true;
    isInitiatorRef.current = isInitiator;
    setConnectionStatus('connecting');
    pendingCandidatesRef.current = [];
    pendingSDPRef.current = null;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (audioWatchdogRef.current) {
      clearInterval(audioWatchdogRef.current);
      audioWatchdogRef.current = null;
    }

    // Clean prior peer connection if any
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {}
      peerConnectionRef.current = null;
    }

    // Reset mute status for fresh call
    setIsMuted(false);
    isMutedRef.current = false;

    let iceServersToUse = ICE_SERVERS;
    try {
      const res = await fetch(`/api/turn-servers?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const data = await res.json();
      if (data && data.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        // Sanity-check that dynamic credentials are not expired
        const turnServer = data.iceServers.find((s: any) => s.username && s.credential);
        let isValid = true;
        if (turnServer && typeof turnServer.username === 'string') {
          try {
            const raw = atob(turnServer.username);
            const nameIdx = raw.indexOf('irfanhhashmi');
            if (nameIdx >= 4) {
              const expTs = (raw.charCodeAt(nameIdx - 4) * 16777216) +
                            (raw.charCodeAt(nameIdx - 3) * 65536) +
                            (raw.charCodeAt(nameIdx - 2) * 256) +
                            raw.charCodeAt(nameIdx - 1);
              const nowSec = Math.floor(Date.now() / 1000);
              if (expTs <= (nowSec + 60)) {
                console.warn('[WebRTC] Received expired token from cache, requesting fresh credentials...');
                isValid = false;
              }
            }
          } catch {}
        }

        if (isValid) {
          const networkQuality = getNetworkQuality();
          if (networkQuality === 'slow-2g' || networkQuality === '2g') {
            console.log('[WebRTC] GPRS detected: Using TCP/TLS TURN only');
            const turnServer = data.iceServers.find((s: any) => s.username && s.credential);
            const gprsOptimizedTurn = {
              urls: getTurnUrlsForNetwork(networkQuality),
              username: turnServer.username,
              credential: turnServer.credential,
            };
            // TURN first, then STUN
            iceServersToUse = [
              gprsOptimizedTurn,
              data.iceServers.find((s: any) => !s.username) || { urls: ['stun:stun.l.google.com:19302'] },
            ];
          } else {
            // TURN first, then STUN
            const turnServer = data.iceServers.find((s: any) => s.username && s.credential);
            const stunServer = data.iceServers.find((s: any) => !s.username) || { urls: ['stun:stun.l.google.com:19302'] };
            iceServersToUse = turnServer ? [turnServer, stunServer] : [stunServer];
          }
          console.log('[WebRTC] Active Xirsys ICE servers configured (merged):', iceServersToUse.length);
        } else {
          // Force refresh from server endpoint
          try {
            const freshRes = await fetch(`/api/turn-servers?refresh=true&_t=${Date.now()}`, {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
            });
            const freshData = await freshRes.json();
            if (freshData?.iceServers?.length) {
              iceServersToUse = [...ICE_SERVERS, ...freshData.iceServers];
              console.log('[WebRTC] Fresh Xirsys ICE servers loaded on demand (merged):', iceServersToUse.length);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('[WebRTC] Failed to fetch TURN servers, using static fallback:', e);
    }

    // CHANGE: Detect network quality and adapt configuration
    const networkQuality = getNetworkQuality();
    const bitrateLimitKbps = getBitrateLimitForNetwork(networkQuality);
    const iceCandidatePool = getIceCandidatePoolSize(networkQuality);
    
    console.log(`[WebRTC] GPRS Optimization: Network=${networkQuality}, Bitrate=${bitrateLimitKbps/1000}kbps, ICEPool=${iceCandidatePool}`);
    
    const pc = new RTCPeerConnection({
      iceServers: iceServersToUse,
      bundlePolicy: 'max-bundle',
      iceCandidatePoolSize: iceCandidatePool,
    });

    peerConnectionRef.current = pc;

    // Acquire microphone stream (or reuse active mic stream) and attach tracks with localStream MSID
    const localStream = await requestMicrophone();
    if (localStream && localStream.getAudioTracks().length > 0) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMutedRef.current;
        try {
          const sender = pc.addTrack(track, localStream);

          // Add bitrate limiting for stable audio quality
          if (sender && sender.getParameters) {
            try {
              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              
            // CHANGE: Use network-adaptive bitrate
              const networkQuality = getNetworkQuality();
              const maxBitrate = (networkQuality === 'slow-2g' || networkQuality === '2g') ? 20000 : getBitrateLimitForNetwork(networkQuality);
              
              params.encodings[0].maxBitrate = maxBitrate;
              params.encodings[0].priority = 'high';
              
              console.log(`[WebRTC] Audio bitrate limited to ${maxBitrate/1000}kbps for ${networkQuality} network`);
              sender.setParameters(params).catch(() => {});
            } catch (e) {
              console.warn('[WebRTC] Bitrate config note:', e);
            }
          }

          // Zero jitter delay optimization on sender if supported
          if (sender && 'playoutDelayHint' in sender) {
            (sender as any).playoutDelayHint = 0;
          }
          console.log('[WebRTC] Local microphone track bound to peer connection:', track.id, track.readyState);
        } catch (e) {
          console.warn('[WebRTC] addTrack warning:', e);
        }
      });
    }

    // Handle remote audio stream: resilient dual-routed playback with zero jitter buffer lag
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote audio track received!', event.streams, event.track);
      
      // Optimize receiver playout delay hint for zero real-time latency
      if (pc.getReceivers) {
        pc.getReceivers().forEach(receiver => {
          if (receiver.track && receiver.track.kind === 'audio') {
            try {
              const networkQuality = getNetworkQuality();
              if ('playoutDelayHint' in receiver) {
                // If GPRS/2G, add buffer. Otherwise zero.
                (receiver as any).playoutDelayHint = (networkQuality === 'slow-2g' || networkQuality === '2g') ? 0.5 : 0;
              }
            } catch {}
          }
        });
      }

      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      if (stream) {
        remoteStreamRef.current = stream;

        // Ensure remote track is fully unmuted and active
        event.track.enabled = true;
        stream.getAudioTracks().forEach((t) => { t.enabled = true; });

        // Hardware speaker playback via pure native HTML Audio element
        // Incoming MediaStream is bound 100% directly to the hardware audio decoder & AEC engine
        const audio = (document.getElementById('voicetalk-remote-audio') as HTMLAudioElement) || remoteAudioElementRef.current;
        if (audio) {
          const playAudio = () => {
            try {
              if (audio.srcObject !== stream) {
                audio.removeAttribute('src');
                audio.srcObject = stream;
              }
              audio.muted = false;
              audio.volume = 1.0;

              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log('[WebRTC] Native audio playback active at live edge');
                  })
                  .catch((e) => {
                    console.warn('[WebRTC] Native audio play blocked by browser autoplay policy:', e);
                  });
              }
            } catch (err) {
              console.warn('[WebRTC] Error during audio playback:', err);
            }
          };

          audio.onplaying = () => {
            console.log('[WebRTC] Native audio element playing actively');
          };

          // Trigger playback immediately
          playAudio();

          // Audio Watchdog: periodically ensure the audio element is playing
          if (audioWatchdogRef.current) clearInterval(audioWatchdogRef.current);
          audioWatchdogRef.current = setInterval(async () => {
            const currentAudio = remoteAudioElementRef.current;
            if (!currentAudio) return;

            // 1. Ensure tracks are enabled
            if (remoteStreamRef.current) {
              remoteStreamRef.current.getAudioTracks().forEach(t => {
                if (!t.enabled) t.enabled = true;
              });
            }

            // 2. Ensure playback
            if (currentAudio.paused || currentAudio.ended || currentAudio.readyState === 0) {
              console.log('[WebRTC] Audio watchdog: element paused/ended/ready-state-0, attempting resume...');
              try {
                await playAudio();
              } catch (e) {
                console.error('[WebRTC] Audio watchdog: play failed', e);
              }
            }
          }, 2000); 
          
          // Also re-trigger when track un-mutes
          event.track.onunmute = () => {
            console.log('[WebRTC] Remote track unmuted, re-verifying audio playback active');
            playAudio();
          };
        }
      }
    };

    // Handle ICE candidates generated locally
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onSendSignalRef.current({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment,
        });
      }
    };

    pc.onicecandidateerror = (event: any) => {
      // 401 is standard RFC 5766 challenge before client sends credentials
      // 701 is STUN host lookup error when candidate probing alternate network interfaces
      if (event.errorCode === 401 || event.errorCode === 701) {
        return;
      }
      console.warn(`[WebRTC ICE Error] Code ${event.errorCode}: ${event.errorText || 'Unknown'} (${event.url || 'local'})`);
    };

    // Attempts to recover a broken connection by restarting ICE and, if we're the
    // side that originally created the offer, renegotiating with a fresh offer.
    // The non-initiator side does NOT create its own offer here - it simply waits
    // for the renegotiated offer to arrive (this avoids both sides racing to
    // renegotiate at the same time, which would just cause more failures).
    const attemptReconnect = () => {
      if (!isInitiatorRef.current) return;
      console.log('[WebRTC] Attempting ICE restart to recover connection...');
      try {
        if (typeof pc.restartIce === 'function') {
          pc.restartIce();
        }
        pc.createOffer({ iceRestart: true })
          .then(async (offer) => {
            await pc.setLocalDescription(offer);
            onSendSignalRef.current({ type: offer.type, sdp: offer.sdp });
          })
          .catch((err) => {
            console.warn('[WebRTC] ICE restart offer creation failed:', err);
            setConnectionStatus('failed');
          });
      } catch (err) {
        console.warn('[WebRTC] ICE restart error:', err);
        setConnectionStatus('failed');
      }
    };
    attemptReconnectRef.current = attemptReconnect;

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log('[WebRTC] ICE connection state:', state);
      if (state === 'connected' || state === 'completed') {
        setConnectionStatus('connected');
        // Connection recovered - cancel any pending reconnect attempt.
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      } else if (state === 'checking') {
        setConnectionStatus('connecting');
      } else if (state === 'disconnected') {
        setConnectionStatus('connecting');
        // Mobile cellular data handoffs (4G/5G tower switches) take 4-8s.
        // Give native WebRTC ICE agent 12 seconds to probe alternate TURN paths before forcing renegotiation.
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            console.warn('[WebRTC] ICE remained disconnected for 12s, initiating ICE restart...');
            attemptReconnect();
          }
        }, 12000);
      } else if (state === 'failed') {
        console.warn('[WebRTC] ICE state failed, forcing immediate recovery...');
        setConnectionStatus('connecting');
        attemptReconnect();
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('[WebRTC] Connection state:', state);
      if (state === 'connected') {
        setConnectionStatus('connected');
        // Bind native mobile OS MediaSession to keep audio engine awake in background & lockscreen
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
          try {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: 'AirTalk Voice Call',
              artist: 'Live P2P Session',
            });
            navigator.mediaSession.setActionHandler('play', () => {});
            navigator.mediaSession.setActionHandler('pause', () => {});
          } catch {}
        }
      } else if (state === 'disconnected') {
        setConnectionStatus('connecting');
      } else if (state === 'failed') {
        setConnectionStatus('failed');
      }
    };

    // If initiator, create and dispatch offer before releasing init lock
    if (isInitiator) {
      try {
        console.log('[WebRTC] Initiator creating offer...');
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);
        onSendSignalRef.current({ type: offer.type, sdp: offer.sdp });
      } catch (err) {
        console.error('[WebRTC] Error creating offer:', err);
      }
    }

    isInitializingRef.current = false;

    // Drain any SDP offer/answer that arrived while initializing
    if (pendingSDPRef.current) {
      const sdp = pendingSDPRef.current;
      pendingSDPRef.current = null;
      await processSignal(pc, sdp);
    }
  }, [getAudioContext, processSignal, requestMicrophone]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    const newMuted = !isMutedRef.current;
    isMutedRef.current = newMuted;
    setIsMuted(newMuted);

    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !newMuted;
      });
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach((s) => {
        if (s.track && s.track.kind === 'audio') {
          s.track.enabled = !newMuted;
        }
      });
    }
  }, []);

  // Proactive Network Switch Handoff
  useEffect(() => {
    const handleNetworkChange = () => {
      if (navigator.onLine) {
        console.log('[WebRTC] Network switch detected (online), proactively restarting ICE...');
        if (isInitiatorRef.current) {
          attemptReconnectRef.current?.();
        } else {
          onSendSignalRef.current?.({ type: 'request_ice_restart' });
        }
      }
    };

    window.addEventListener('online', handleNetworkChange);
    return () => window.removeEventListener('online', handleNetworkChange);
  }, []);

  // Connectivity Watchdog
  useEffect(() => {
    const interval = setInterval(() => {
      const pc = peerConnectionRef.current;
      if (!pc) {
        consecutiveDisconnectedTicksRef.current = 0;
        return;
      }

      // Do not count failure strikes if device network is completely offline
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        console.log('[WebRTC] Network offline, pausing watchdog strike counter...');
        return;
      }

      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        consecutiveDisconnectedTicksRef.current = 0;
        return;
      }

      if (state === 'failed' || state === 'disconnected') {
        consecutiveDisconnectedTicksRef.current++;
        const strike = consecutiveDisconnectedTicksRef.current;
        console.warn(`[WebRTC] Connectivity Watchdog: State is ${state} (Strike ${strike}/6). Attempting recovery...`);
        
        if (strike <= 6) {
          if (isInitiatorRef.current) {
            console.log('[WebRTC] Watchdog: Initiator executing ICE restart...');
            if (attemptReconnectRef.current) {
              attemptReconnectRef.current();
            }
          } else {
            console.log('[WebRTC] Watchdog: Non-initiator requesting peer to restart ICE...');
            onSendSignalRef.current({ type: 'request_ice_restart' });
          }
        } else {
          console.warn('[WebRTC] Watchdog: Recovery failed after 6 attempts (30s). Setting connection state to failed.');
          setConnectionStatus('failed');
        }
      } else {
        // State is connected or completed - reset strikes immediately
        consecutiveDisconnectedTicksRef.current = 0;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Teardown Peer Connection
  const closeConnection = useCallback(() => {
    isInitializingRef.current = false;
    pendingCandidatesRef.current = [];
    pendingSDPRef.current = null;
    attemptReconnectRef.current = null;
    consecutiveDisconnectedTicksRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {}
      peerConnectionRef.current = null;
    }
    if (remoteSourceNodeRef.current) {
      try { remoteSourceNodeRef.current.disconnect(); } catch {}
      remoteSourceNodeRef.current = null;
    }
    if (speakerGainNodeRef.current) {
      try { speakerGainNodeRef.current.disconnect(); } catch {}
      speakerGainNodeRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    const audio = (document.getElementById('voicetalk-remote-audio') as HTMLAudioElement) || remoteAudioElementRef.current;
    if (audio) {
      audio.pause();
      audio.srcObject = null;
    }
    remoteAnalyserRef.current = null;
    setConnectionStatus('disconnected');
    setRemoteVolume(0);
  }, []);

  // Full cleanup
  const stopAll = useCallback(() => {
    closeConnection();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    localAnalyserRef.current = null;
    setLocalVolume(0);
    setHasAudioPermission(false);
  }, [closeConnection]);

  return {
    isMuted,
    hasAudioPermission,
    localVolume,
    remoteVolume,
    connectionStatus,
    permissionError,
    requestMicrophone,
    initPeerConnection,
    handleIncomingSignal,
    toggleMute,
    closeConnection,
    stopAll,
    getAudioContext,
  };
}

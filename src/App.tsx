import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MatchPreferences,
  ConnectionState,
  PeerInfo,
  ChatMessage,
  MutualFriend,
  UserProfile,
  ReportPayload,
  ChatMode,
  CallLog,
} from './types';
import { useWebRTC } from './hooks/useWebRTC';
import { useAiCompanion } from './hooks/useAiCompanion';
import { AiPersona } from './data/aiPersonas';
import { sounds } from './utils/audio';
import { unlockAudio } from './utils/voiceSynthesis';
import { UnifiedSignalingClient } from './utils/signaling';
import { Navbar } from './components/Navbar';
import { VoiceConsole } from './components/VoiceConsole';
import { StandaloneTextScreen } from './components/StandaloneTextScreen';
import { FriendsModal } from './components/FriendsModal';
import { ReportModal } from './components/ReportModal';
import { SafetyAndPrivacyModal } from './components/SafetyAndPrivacyModal';
import { CallLogsModal } from './components/CallLogsModal';
import { FiltersModal } from './components/FiltersModal';
import { GamesModal } from './components/GamesModal';
import { AgeConsentModal } from './components/AgeConsentModal';
import { OwnerAnalyticsModal } from './components/OwnerAnalyticsModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { ShareModal } from './components/ShareModal';
import { BlogPage } from './components/BlogPage';
import { AdminConsole } from './components/AdminConsole';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { DynamicPageView } from './components/DynamicPageView';
import { DEFAULT_PAGES } from './data/defaultPages';
import { useRole } from './context/RoleContext';
import { useAnalytics } from './hooks/useAnalytics';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../firebase-applet-config.json';

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
import {
  detectCountryFromClient,
  DetectedCountryResult,
  getCountryByCode,
} from './data/countries';

const initialDetected = detectCountryFromClient();

const DEFAULT_PREFERENCES: MatchPreferences = {
  mode: 'voice',
  language: 'any',
  userCountry: initialDetected.code,
  preferredCountries: [],
  restrictedCountries: [],
  region: 'any',
  tags: ['Deep Talk', 'Late Night Vibes'],
  userGender: 'unspecified',
  preferredGender: 'any',
  strictGender: false,
  autoCall: true,
};

export default function App() {
  const { role } = useRole();

  // State: Preferences
  const [preferences, setPreferences] = useState<MatchPreferences>(() => {
    const saved = localStorage.getItem('voicetalk_prefs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          allowAi: true,
          roomCode: undefined, // Never restore stale roomCode into public queue
        };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  // State: User Profile (optional lightweight callsign)
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('voicetalk_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      callsign: `EchoWalker #${Math.floor(100 + Math.random() * 900)}`,
      bio: 'Nighttime conversationalist',
      avatarSeed: '🎙️',
    };
  });

  // State: Mutual Friends List
  const [friends, setFriends] = useState<MutualFriend[]>(() => {
    const saved = localStorage.getItem('voicetalk_friends');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // State: Call Logs (Retains last 19 calls)
  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    const saved = localStorage.getItem('voicetalk_call_logs_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // App & Connection State
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [partnerEndedMessage, setPartnerEndedMessage] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1001);
  const [waitTime, setWaitTime] = useState<number>(0);
  const [fallbackActive, setFallbackActive] = useState<boolean>(false);
  
  // Country Detection State (Tamper-proof & verified)
  const [detectedCountry, setDetectedCountry] = useState<DetectedCountryResult>(() => initialDetected);
  const [isDetectingCountry, setIsDetectingCountry] = useState<boolean>(false);

  // Peer State
  const [peerInfo, setPeerInfo] = useState<PeerInfo>({ id: '', tags: [] });
  const [commonTags, setCommonTags] = useState<string[]>([]);
  const [lastCallDuration, setLastCallDuration] = useState<number>(0);
  const [isFriendAdded, setIsFriendAdded] = useState<boolean>(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStrangerTyping, setIsStrangerTyping] = useState<boolean>(false);

  // AI Companion Bot state
  const [activeAiPersona, setActiveAiPersona] = useState<AiPersona | null>(null);
  const [aiRemoteVolume, setAiRemoteVolume] = useState<number>(0);

  // Clear any legacy AI disabled flag from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem('quiktalks_ai_disabled');
    } catch {}
  }, []);

  // Server keep-alive ping effect (every 120 seconds) on dynamic backend hosts
  useEffect(() => {
    const pingServer = () => {
      fetch('/api/health', { method: 'GET', cache: 'no-store' }).catch(() => {});
    };
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('run.app')) {
      pingServer();
      const interval = setInterval(pingServer, 120000);
      return () => clearInterval(interval);
    }
  }, []);

  // Modals
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isCallLogsModalOpen, setIsCallLogsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isGamesModalOpen, setIsGamesModalOpen] = useState(false);
  const [isBlogsModalOpen, setIsBlogsModalOpen] = useState(false);
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [blogSlug, setBlogSlug] = useState<string | null>(null);
  const [isAgeConsentModalOpen, setIsAgeConsentModalOpen] = useState(false);
  const [isOwnerAnalyticsOpen, setIsOwnerAnalyticsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; sender?: string; timestamp?: number } | null>(null);
  const [pendingMatchMode, setPendingMatchMode] = useState<ChatMode | null>(null);
  const [activeDynamicPage, setActiveDynamicPage] = useState<any | null>(null);

  // Dynamic Page Title & SEO Update Effect
  useEffect(() => {
    if (activeDynamicPage) return; // Custom CMS page title takes precedence
    if (preferences.mode === 'voice') {
      document.title = 'Anonymous Voice Chat with Strangers | QuickTalks';
    } else if (preferences.mode === 'text') {
      document.title = 'Free Random Text Chat Online | QuickTalks';
    } else {
      document.title = 'QuickTalks - Talk to Strangers | Free Anonymous Voice & Text Chat';
    }
  }, [preferences.mode, activeDynamicPage]);

  // Detect dynamic published pages (e.g. /contact, /about, /seo-page, /privacy, /terms)
  useEffect(() => {
    const rawPath = window.location.pathname.toLowerCase().trim();
    if (rawPath === '/' || rawPath === '' || rawPath === '/admin-console' || rawPath.startsWith('/blogs')) {
      return;
    }

    const targetPath = rawPath.replace(/\/+$/, '');

    // Check default pages fallback first (e.g. /contact, /privacy, /terms, /about, /faq)
    if (DEFAULT_PAGES[targetPath]) {
      const defPage = DEFAULT_PAGES[targetPath];
      setActiveDynamicPage(defPage);
      document.title = `${defPage.title} | QuikTalks`;
    }

    const fetchDynamicPage = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'pages'));
        const allPages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        const match = allPages.find((p: any) => {
          let pSlug = (p.slug || '').toLowerCase().trim();
          if (pSlug.includes('://')) {
            pSlug = pSlug.replace(/^https?:\/\/[^\/]+/, '');
          }
          pSlug = pSlug.replace(/\/+$/, '');
          if (!pSlug.startsWith('/')) pSlug = '/' + pSlug;

          return pSlug === targetPath;
        });

        if (match) {
          const pageObj = match as any;
          setActiveDynamicPage(pageObj);
          document.title = `${pageObj.title || 'Dynamic Page'} | QuikTalks`;
        }
      } catch (err) {
        console.error('Error fetching dynamic page route:', err);
      }
    };

    fetchDynamicPage();
  }, []);

  // Detect deep link room & action parameters on initial load (e.g. ?action=call or ?room=TALK-749)
  useEffect(() => {
    if (window.location.pathname.startsWith('/blogs/')) {
        const slug = window.location.pathname.split('/')[2];
        if (slug) {
            setBlogSlug(slug);
            setIsBlogsModalOpen(true);
        }
    }
    if (window.location.pathname === '/admin-console') {
        setIsAdminConsoleOpen(true);
    }
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room') || params.get('join') || params.get('code');
      if (roomParam) {
        const cleanCode = roomParam.trim();
        if (cleanCode) {
          setIsShareModalOpen(true);
        }
      }

      // Google Ads Action Button deep link handler
      const actionParam = (params.get('action') || params.get('start') || params.get('call') || '').toLowerCase();
      if (actionParam === 'call' || actionParam === 'voice' || actionParam === 'now' || actionParam === '1' || actionParam === 'true') {
        setPreferences((prev) => ({ ...prev, mode: 'voice' }));
        const agreed = localStorage.getItem('voicetalk_18_agreed') === 'true';
        if (agreed) {
          setTimeout(() => {
            if (executeJoinQueueRef.current) {
              executeJoinQueueRef.current('voice').catch(() => {});
            }
          }, 400);
        } else {
          setPendingMatchMode('voice');
          setIsAgeConsentModalOpen(true);
        }
      }
    } catch {}
  }, []);

  // Background Website Analytics Telemetry Hook
  const { recordCallActivity, recordChatActivity } = useAnalytics(preferences.userCountry);

  // General hash listener
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdminConsoleOpen(true);
      } else if (window.location.hash === '#analytics' || window.location.hash === '#owner') {
        setIsOwnerAnalyticsOpen(true);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on mount

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Owner shortcut listener: Ctrl+Shift+A or Cmd+Shift+A (only for owner)
  useEffect(() => {
    if (role !== 'owner') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsOwnerAnalyticsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [role]);

  const [hasAgreedTo18, setHasAgreedTo18] = useState<boolean>(() => {
    return localStorage.getItem('voicetalk_18_agreed') === 'true';
  });

  // Mic Testing on Home Screen
  const [isMicTesting, setIsMicTesting] = useState(false);

  // Timing Ref for active calls
  const callStartTimeRef = useRef<number>(0);

  // Unified Signaling Transport Ref & State Refs for message handlers
  const signalingRef = useRef<UnifiedSignalingClient | null>(null);
  const isInitiatorRef = useRef<boolean>(false);
  const preferencesRef = useRef<MatchPreferences>(preferences);
  const profileRef = useRef<UserProfile>(profile);
  const peerInfoRef = useRef<PeerInfo>(peerInfo);
  const commonTagsRef = useRef<string[]>(commonTags);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    peerInfoRef.current = peerInfo;
  }, [peerInfo]);

  useEffect(() => {
    commonTagsRef.current = commonTags;
  }, [commonTags]);

  const connectionStateRef = useRef<ConnectionState>(connectionState);
  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  const executeJoinQueueRef = useRef<((selectedMode: ChatMode, forceAi?: boolean, overrideRoomCode?: string) => Promise<void>) | null>(null);

  // Save prefs & profile & friends & callLogs to localStorage
  useEffect(() => {
    const { roomCode, ...safePrefs } = preferences;
    localStorage.setItem('voicetalk_prefs', JSON.stringify({ ...safePrefs, allowAi: true }));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('voicetalk_profile', JSON.stringify(profile));
  }, [profile]);

  // Periodic stats synchronization
  useEffect(() => {
    const fetchStats = async () => {
      if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('run.app')) return;
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.onlineUsers === 'number') {
            setOnlineCount(data.onlineUsers);
          }
        }
      } catch {
        // silent fallback
      }
    };
    fetchStats();
    const timer = setInterval(fetchStats, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('voicetalk_friends', JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem('voicetalk_call_logs_v1', JSON.stringify(callLogs));
  }, [callLogs]);

  // Helper: Record Call Log (Last 19 calls maximum)
  const recordCallLog = useCallback(
    (endedReason: 'completed' | 'skipped' | 'peer_left' | 'hung_up', fallbackSecs?: number) => {
      const elapsed =
        callStartTimeRef.current > 0
          ? Math.max(1, Math.round((Date.now() - callStartTimeRef.current) / 1000))
          : (fallbackSecs || 8);

      setLastCallDuration(elapsed);
      callStartTimeRef.current = 0;

      const currentPeer = peerInfoRef.current;
      if (currentPeer && currentPeer.id) {
        const newLog: CallLog = {
          id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          peerId: currentPeer.id,
          callsign: currentPeer.callsign || 'Anonymous Stranger',
          mode: preferencesRef.current.mode,
          duration: elapsed,
          timestamp: Date.now(),
          tags: commonTagsRef.current || [],
          language: preferencesRef.current.language,
          country: currentPeer.country || 'US',
          region: preferencesRef.current.region,
          endedReason,
        };

        setCallLogs((prev) => {
          const updated = [newLog, ...prev.filter((l) => l.id !== newLog.id)].slice(0, 19);
          localStorage.setItem('voicetalk_call_logs_v1', JSON.stringify(updated));
          return updated;
        });
      }
    },
    []
  );

  // Send signaling message helper
  const sendSignaling = useCallback((msg: any) => {
    if (signalingRef.current) {
      signalingRef.current.send(msg);
    }
  }, []);

  // Send signal helper with robust cross-browser serialization
  const sendSignalOverTransport = useCallback((signal: any) => {
    if (signalingRef.current && signal) {
      let serialized: any = null;
      if (signal.type && signal.sdp) {
        serialized = { type: signal.type, sdp: signal.sdp };
      } else if (signal.candidate !== undefined || signal.sdpMid !== undefined || signal.sdpMLineIndex !== undefined) {
        serialized = {
          candidate: signal.candidate || '',
          sdpMid: signal.sdpMid !== undefined ? signal.sdpMid : null,
          sdpMLineIndex: signal.sdpMLineIndex !== undefined ? signal.sdpMLineIndex : null,
          usernameFragment: signal.usernameFragment,
        };
      } else if (typeof signal.toJSON === 'function') {
        serialized = signal.toJSON();
      } else {
        serialized = signal;
      }

      console.log('[WebRTC Signaling] Sending outbound signal:', serialized?.type || (serialized?.candidate ? 'candidate' : 'unknown'));
      signalingRef.current.send({
        type: 'signal',
        signal: serialized,
      });
    }
  }, []);

  // WebRTC Hook
  const {
    isMuted,
    localVolume,
    remoteVolume: webRtcRemoteVolume,
    permissionError: micPermissionError,
    requestMicrophone,
    initPeerConnection,
    handleIncomingSignal,
    toggleMute,
    closeConnection,
    stopAll,
    getAudioContext,
  } = useWebRTC(sendSignalOverTransport);

  // AI Companion Hook for 50 Female Bot Personas
  const {
    isAiSpeaking,
    isListening,
    liveTranscript,
    aiSubtitleText,
    aiStatusText,
    aiGesture,
    sendManualMessage: sendAiManualMessage,
    stopAiSpeech,
  } = useAiCompanion({
    activePersona: activeAiPersona,
    isConnected: connectionState === 'connected',
    isMuted,
    localVolume,
    userCallsign: profile.callsign,
    userCountry: detectedCountry?.code || preferences.userCountry || 'US',
    onRequestMicrophone: requestMicrophone,
    onSetRemoteVolume: (vol) => setAiRemoteVolume(vol),
    onReceiveChatMessage: (text) => {
      // Add message to chat display if not already present
      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === 'stranger' && last.text === text) return prev;
        return [
          ...prev,
          {
            id: `msg_${Date.now()}_ai`,
            sender: 'stranger',
            text,
            timestamp: Date.now(),
          }
        ];
      });
    },
    onTypingChange: (isTyping) => {
      setIsStrangerTyping(isTyping);
    },
  });

  const effectiveRemoteVolume = Math.max(webRtcRemoteVolume, aiRemoteVolume);

  const initPeerConnectionRef = useRef(initPeerConnection);
  const handleIncomingSignalRef = useRef(handleIncomingSignal);
  const closeConnectionRef = useRef(closeConnection);
  const lastCallDurationRef = useRef(lastCallDuration);

  useEffect(() => {
    initPeerConnectionRef.current = initPeerConnection;
    handleIncomingSignalRef.current = handleIncomingSignal;
    closeConnectionRef.current = closeConnection;
    lastCallDurationRef.current = lastCallDuration;
  }, [initPeerConnection, handleIncomingSignal, closeConnection, lastCallDuration]);

  const activeRoomIdRef = useRef<string | null>(null);

  // Unified Signaling Connection Lifecycle
  useEffect(() => {
    const client = new UnifiedSignalingClient({
      onReconnect: (info) => {
        console.log('[App] Signaling transport reconnected / renewed session.', info);
        if (connectionStateRef.current === 'connected' && activeRoomIdRef.current) {
          console.log('[App] Re-associating active call room after session renewal:', activeRoomIdRef.current);
          client.send({
            type: 'reassociate',
            roomId: activeRoomIdRef.current,
            oldClientId: info?.oldClientId,
          });
        } else if (connectionStateRef.current === 'queueing') {
          console.log('[App] Resubmitting queue request after transport reconnect...');
          executeJoinQueueRef.current?.(preferencesRef.current.mode || 'voice');
        }
      },
      onMessage: async (msg) => {
        try {
          switch (msg.type) {
            case 'pong':
              break;

            case 'connected':
              if (typeof msg.stats?.onlineUsers === 'number') {
                setOnlineCount(msg.stats.onlineUsers);
              }
              if (msg.detectedCountry) {
                setDetectedCountry(msg.detectedCountry);
                setPreferences((prev) => ({
                  ...prev,
                  userCountry: msg.detectedCountry.code,
                }));
              }
              break;

            case 'stats':
              if (typeof msg.stats?.onlineUsers === 'number') {
                setOnlineCount(msg.stats.onlineUsers);
              }
              break;

            case 'country_verified':
              if (msg.detectedCountry) {
                setDetectedCountry(msg.detectedCountry);
                setPreferences((prev) => ({
                  ...prev,
                  userCountry: msg.detectedCountry.code,
                }));
              }
              break;

            case 'queue_joined':
              setConnectionState('queueing');
              setWaitTime(0);
              setFallbackActive(false);
              sounds.playRadioTune();
              break;

            case 'queue_status':
              setWaitTime(msg.waitTime || 0);
              setFallbackActive(!!msg.fallbackActive);
              break;

            case 'matched': {
              console.log('[App] Matched with peer:', msg.peerInfo, 'isInitiator:', msg.isInitiator, 'isAiCompanion:', msg.isAiCompanion);
              activeRoomIdRef.current = msg.roomId || null;
              unlockAudio();
              sounds.playConnectedChime();
              callStartTimeRef.current = Date.now();
              setPartnerEndedMessage(null);
              setPeerInfo(msg.peerInfo);
              setCommonTags(msg.commonTags || []);
              setChatMessages([]);
              setIsFriendAdded(false);
              isInitiatorRef.current = msg.isInitiator;
              setConnectionState('connected');
              setActiveAiPersona(null);

              const currentMode = msg.mode || preferencesRef.current.mode || 'voice';
              if (currentMode === 'voice') {
                await initPeerConnectionRef.current(msg.isInitiator);
              }
              break;
            }

            case 'signal':
              await handleIncomingSignalRef.current(msg.signal);
              break;

            case 'chat_message':
              setChatMessages((prev) => [...prev, msg.message]);
              setIsStrangerTyping(false);
              break;

            case 'typing':
              setIsStrangerTyping(!!msg.isTyping);
              break;

            case 'end_call':
            case 'skip':
            case 'peer_left': {
              sounds.playEndBeep();
              closeConnectionRef.current();
              stopAiSpeech();
              setActiveAiPersona(null);
              setAiRemoteVolume(0);
              recordCallLog('peer_left', msg.duration);
              
              const currentPrefs = preferencesRef.current;
              if (currentPrefs.autoCall) {
                // When Auto Call is ENABLED: instantly search & auto-dial next partner on the console
                sounds.playRadioTune();
                setConnectionState('queueing');
                setPartnerEndedMessage(null);
                setWaitTime(0);
                setChatMessages([]);
                client.send({
                  type: 'skip',
                  requeue: true,
                  mode: currentPrefs.mode || 'voice',
                  language: currentPrefs.language,
                  region: currentPrefs.region,
                  tags: currentPrefs.tags,
                  userGender: currentPrefs.userGender,
                  preferredGender: currentPrefs.preferredGender,
                  preferredCountries: currentPrefs.preferredCountries,
                  strictGender: currentPrefs.strictGender,
                  callsign: profileRef.current.callsign,
                  allowAi: currentPrefs.allowAi !== false,
                });
              } else {
                // When Auto Call is DISABLED: stay right on the console in idle state with red alert text
                setConnectionState('idle');
                setPartnerEndedMessage('Your partner has ended the call');
              }
              break;
            }

            case 'friend_request_received': {
              const newFriend: MutualFriend = {
                id: `friend_${Date.now()}`,
                callsign: msg.senderCallsign || 'Stranger',
                tags: commonTagsRef.current,
                addedAt: Date.now(),
                lastCallDuration: lastCallDurationRef.current,
                friendCode: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
                frequencyCode: msg.frequencyCode || `${(90 + Math.random() * 18).toFixed(1)} FM`,
              };
              setFriends((prev) => {
                if (prev.some((f) => f.callsign === newFriend.callsign)) return prev;
                return [newFriend, ...prev];
              });
              setIsFriendAdded(true);
              break;
            }

            default:
              break;
          }
        } catch (err) {
          console.error('Failed to parse signaling message:', err);
        }
      },
    });

    signalingRef.current = client;
    client.connect();

    return () => {
      client.close();
      signalingRef.current = null;
    };
  }, [recordCallLog]);

  // Start Matching (Voice or Text)
  const executeJoinQueue = async (selectedMode: ChatMode, forceAi?: boolean, overrideRoomCode?: string) => {
    // Unlock Audio Context on user tap
    try {
      getAudioContext();
    } catch {}

    const targetRoomCode = overrideRoomCode !== undefined ? overrideRoomCode : undefined;

    setPartnerEndedMessage(null);
    unlockAudio();
    setPreferences((prev) => ({ ...prev, mode: selectedMode, roomCode: targetRoomCode }));
    setConnectionState('queueing');
    setWaitTime(0);
    setFallbackActive(false);
    sounds.playRadioTune();

    // Acquire microphone synchronously during user gesture for mobile browser compliance
    if (selectedMode === 'voice') {
      try {
        await requestMicrophone();
      } catch (err) {
        console.warn('Microphone pre-flight warning:', err);
      }
    }

    const cleanRoom = targetRoomCode ? targetRoomCode.trim().toLowerCase() : undefined;

    const payload = {
      type: 'join_queue',
      mode: selectedMode,
      language: preferences.language,
      region: preferences.region,
      tags: preferences.tags,
      userGender: preferences.userGender,
      preferredGender: preferences.preferredGender,
      preferredCountries: preferences.preferredCountries,
      strictGender: preferences.strictGender,
      callsign: profile.callsign,
      roomCode: cleanRoom,
    };

    recordCallActivity();
    sendSignaling(payload);
  };

  useEffect(() => {
    executeJoinQueueRef.current = executeJoinQueue;
  });

  const handleStartMatching = async (selectedMode: ChatMode) => {
    await executeJoinQueue(selectedMode);
  };

  const handleJoinPrivateRoom = async (roomCode: string, selectedMode: ChatMode) => {
    setIsShareModalOpen(false);
    await executeJoinQueue(selectedMode, false, roomCode);
  };

  const handleConfirmAgeConsent = async () => {
    localStorage.setItem('voicetalk_18_agreed', 'true');
    setHasAgreedTo18(true);
    setIsAgeConsentModalOpen(false);
    if (pendingMatchMode) {
      const mode = pendingMatchMode;
      setPendingMatchMode(null);
      await executeJoinQueue(mode);
    }
  };

  // Cancel Queue
  const handleCancelQueue = () => {
    setPartnerEndedMessage(null);
    sendSignaling({ type: 'leave_queue' });
    setConnectionState('idle');
  };

  // Skip Call / Match Next Stranger
  const handleSkip = () => {
    stopAiSpeech();
    setActiveAiPersona(null);
    setAiRemoteVolume(0);
    recordCallLog('skipped');
    closeConnection();
    sounds.playRadioTune();
    setConnectionState('queueing');
    setPartnerEndedMessage(null);
    setWaitTime(0);
    setChatMessages([]);

    const cleanRoom = preferences.roomCode ? preferences.roomCode.trim().toLowerCase() : undefined;

    sendSignaling({
      type: 'skip',
      requeue: true,
      mode: preferences.mode || 'voice',
      language: preferences.language,
      region: preferences.region,
      tags: preferences.tags,
      userGender: preferences.userGender,
      preferredGender: preferences.preferredGender,
      preferredCountries: preferences.preferredCountries,
      strictGender: preferences.strictGender,
      callsign: profile.callsign,
      allowAi: cleanRoom ? false : (preferences.allowAi !== false),
      roomCode: cleanRoom,
    });
  };

  // End Call / Next (Hang Up immediately searches for next stranger if autoCall is checked)
  const handleEndCall = () => {
    sounds.playEndBeep();
    stopAiSpeech();
    setActiveAiPersona(null);
    setAiRemoteVolume(0);
    recordCallLog('hung_up');
    closeConnection();

    const cleanRoom = preferences.roomCode ? preferences.roomCode.trim().toLowerCase() : undefined;

    if (preferences.autoCall) {
      // Auto Call is ENABLED: immediately transition into queueing and auto-dial next stranger on the console
      sounds.playRadioTune();
      setConnectionState('queueing');
      setPartnerEndedMessage(null);
      setWaitTime(0);
      setChatMessages([]);

      sendSignaling({
        type: 'skip',
        requeue: true,
        mode: preferences.mode || 'voice',
        language: preferences.language,
        region: preferences.region,
        tags: preferences.tags,
        userGender: preferences.userGender,
        preferredGender: preferences.preferredGender,
        preferredCountries: preferences.preferredCountries,
        strictGender: preferences.strictGender,
        callsign: profile.callsign,
        allowAi: cleanRoom ? false : (preferences.allowAi !== false),
        roomCode: cleanRoom,
      });
    } else {
      // Auto Call is DISABLED: user simply hangs up and returns to idle state on the console
      setConnectionState('idle');
      setPartnerEndedMessage(null);
      sendSignaling({
        type: 'skip',
        requeue: false,
        allowAi: preferences.allowAi !== false,
      });
    }
  };

  // Toggle Auto-Call Preference
  const handleToggleAutoCall = () => {
    setPreferences((prev) => ({ ...prev, autoCall: !prev.autoCall }));
  };

  // Send In-Call Chat Message
  const handleSendMessage = (text: string, imageUrl?: string) => {
    recordChatActivity();
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'you',
      text,
      imageUrl,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, newMsg]);

    if (activeAiPersona) {
      sendAiManualMessage(text, imageUrl);
    } else {
      sendSignaling({
        type: 'chat_message',
        text,
        imageUrl,
      });
    }
  };

  // Send In-Call Typing Status
  const handleSendTyping = (isTyping: boolean) => {
    sendSignaling({
      type: 'typing',
      isTyping,
    });
  };

  // Send Mutual Friend Request
  const handleSendFriendRequest = (peerCallsign: string) => {
    const newFriend: MutualFriend = {
      id: `friend_${Date.now()}`,
      callsign: peerCallsign,
      tags: commonTags,
      addedAt: Date.now(),
      lastCallDuration: lastCallDuration,
      friendCode: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
      frequencyCode: `${(92 + Math.random() * 16).toFixed(1)} FM`,
    };

    setFriends((prev) => [newFriend, ...prev]);
    setIsFriendAdded(true);

    sendSignaling({
      type: 'friend_request',
      callsign: profile.callsign,
      frequencyCode: newFriend.frequencyCode,
    });
  };

  // Submit Report
  const handleSubmitReport = (payload: ReportPayload) => {
    sendSignaling({
      type: 'report_user',
      ...payload,
    });
    closeConnection();
    setConnectionState('idle');
  };

  // Initial Server Country Detection
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const languages = typeof navigator !== 'undefined' && navigator.languages ? Array.from(navigator.languages) : [];
        const res = await fetch('/api/detect-country', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone: tz, languages }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.country) {
            setDetectedCountry(data.country);
            setPreferences((prev) => ({
              ...prev,
              userCountry: data.country.code,
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch country detection:', err);
      }
    };
    fetchCountry();
  }, []);

  // Re-detect or refresh country detection manually
  const handleRefreshCountryDetection = async () => {
    setIsDetectingCountry(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const languages = typeof navigator !== 'undefined' && navigator.languages ? Array.from(navigator.languages) : [];
      
      // 1. Sync over unified signaling client
      if (signalingRef.current) {
        signalingRef.current.send({
          type: 'sync_telemetry',
          timezone: tz,
          languages,
        });
      }

      // 2. Fetch via HTTP endpoint
      const res = await fetch('/api/detect-country', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: tz, languages }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.country) {
          setDetectedCountry(data.country);
          setPreferences((prev) => ({
            ...prev,
            userCountry: data.country.code,
          }));
        }
      }
    } catch (err) {
      console.warn('Re-detect country error:', err);
    } finally {
      setTimeout(() => setIsDetectingCountry(false), 500);
    }
  };

  // Test Microphone on Home Screen
  const handleTestMicrophone = async () => {
    if (isMicTesting) {
      stopAll();
      setIsMicTesting(false);
    } else {
      const stream = await requestMicrophone();
      if (stream) {
        setIsMicTesting(true);
      }
    }
  };

  // Call Mutual Friend Directly
  const handleCallFriend = (freq: string) => {
    setIsFriendsModalOpen(false);
    handleStartMatching('voice');
  };

  const isInActiveCall = connectionState === 'connected';

  if (activeDynamicPage) {
    return (
      <DynamicPageView
        page={activeDynamicPage}
        onGoHome={() => {
          setActiveDynamicPage(null);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#070B12] text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden">
      
      {/* 1. Header Navigation */}
      <Navbar
        mode={preferences.mode}
        onSelectMode={(m) => setPreferences((prev) => ({ ...prev, mode: m }))}
        onlineCount={onlineCount}
        onOpenFriends={() => setIsFriendsModalOpen(true)}
        onOpenSafety={() => setIsSafetyModalOpen(true)}
        onOpenCallLogs={() => setIsCallLogsModalOpen(true)}
        onOpenFilters={() => setIsFiltersModalOpen(true)}
        onOpenGames={() => setIsGamesModalOpen(true)}
        onOpenBlogs={() => setIsBlogsModalOpen(true)}
        onOpenAnalytics={role === 'owner' ? () => setIsOwnerAnalyticsOpen(true) : undefined}
        onOpenShare={() => setIsShareModalOpen(true)}
        callLogsCount={callLogs.length}
        friendsCount={friends.length}
        isInCall={isInActiveCall}
        onGoHome={() => setConnectionState('idle')}
      />

      {/* 2. Main Content Views */}
      <main className="flex-1 flex flex-col items-center justify-start w-full min-h-0 overflow-x-hidden overflow-y-auto">
        {preferences.mode === 'voice' ? (
          <VoiceConsole
            connectionState={connectionState === 'ended' ? 'idle' : connectionState}
            waitTime={waitTime}
            preferences={preferences}
            onUpdatePreferences={(updated) => setPreferences((prev) => ({ ...prev, ...updated }))}
            onStartMatching={handleStartMatching}
            onCancelQueue={handleCancelQueue}
            onEndCall={handleEndCall}
            onSkip={handleSkip}
            peerInfo={peerInfo}
            commonTags={commonTags}
            localVolume={localVolume}
            remoteVolume={effectiveRemoteVolume}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onAddFriend={handleSendFriendRequest}
            isFriendAdded={isFriendAdded}
            onOpenReport={() => setIsReportModalOpen(true)}
            onOpenCallLogs={() => setIsCallLogsModalOpen(true)}
            onOpenFilters={() => setIsFiltersModalOpen(true)}
            onOpenFriends={() => setIsFriendsModalOpen(true)}
            onOpenSafety={() => setIsSafetyModalOpen(true)}
            onOpenShare={() => setIsShareModalOpen(true)}
            detectedCountry={detectedCountry}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            onSendTyping={handleSendTyping}
            isStrangerTyping={isStrangerTyping}
            partnerEndedMessage={partnerEndedMessage}
            onTestMicrophone={handleTestMicrophone}
            isMicTesting={isMicTesting}
            onViewImage={(url, sender, timestamp) => setViewingImage({ url, sender, timestamp })}
          />
        ) : (
          <StandaloneTextScreen
            peerInfo={peerInfo}
            commonTags={commonTags}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            onSendTyping={handleSendTyping}
            isStrangerTyping={isStrangerTyping}
            onSkip={handleSkip}
            onEndChat={handleEndCall}
            onReport={() => setIsReportModalOpen(true)}
            onOpenShare={() => setIsShareModalOpen(true)}
            autoCall={preferences.autoCall}
            onToggleAutoCall={handleToggleAutoCall}
            onViewImage={(url, sender, timestamp) => setViewingImage({ url, sender, timestamp })}
          />
        )}
      </main>

      {/* 3. Modals */}
      {viewingImage && (
        <ImageViewerModal
          isOpen={!!viewingImage}
          onClose={() => setViewingImage(null)}
          imageUrl={viewingImage.url}
          senderName={viewingImage.sender}
          timestamp={viewingImage.timestamp}
        />
      )}

      <FiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={(up) => setPreferences((prev) => ({ ...prev, ...up }))}
      />

      <GamesModal
        isOpen={isGamesModalOpen}
        onClose={() => setIsGamesModalOpen(false)}
        onShareToChat={(text) => {
          setIsGamesModalOpen(false);
          handleSendMessage(text);
        }}
      />

      {isBlogsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0A1128] w-full max-w-2xl rounded-2xl border border-[#23356E] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#23356E]">
              <h2 className="text-xl font-bold text-white">Blogs</h2>
              <button onClick={() => { setIsBlogsModalOpen(false); setBlogSlug(null); }} className="text-gray-400 hover:text-white">Close</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <BlogPage initialSlug={blogSlug || undefined} />
            </div>
          </div>
        </div>
      )}

      {isAdminConsoleOpen && (
        <div className="fixed inset-0 z-50 bg-[#070B12] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b border-[#23356E]">
            <h2 className="text-xl font-bold text-white">Admin Console</h2>
            <button onClick={() => setIsAdminConsoleOpen(false)} className="text-gray-400 hover:text-white">Close</button>
          </div>
          <AdminConsole onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)} />
        </div>
      )}

      <DiagnosticsModal isOpen={isDiagnosticsModalOpen} onClose={() => setIsDiagnosticsModalOpen(false)} />

      <AgeConsentModal
        isOpen={isAgeConsentModalOpen}
        onConfirm={handleConfirmAgeConsent}
        onCancel={() => {
          setIsAgeConsentModalOpen(false);
          setPendingMatchMode(null);
        }}
      />

      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        profile={profile}
        onUpdateProfile={(up) => setProfile((prev) => ({ ...prev, ...up }))}
        friends={friends}
        onRemoveFriend={(id) => setFriends((prev) => prev.filter((f) => f.id !== id))}
        onCallFriend={handleCallFriend}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onJoinPrivateRoom={handleJoinPrivateRoom}
        currentRoomId={preferences.roomCode}
        isInCall={isInActiveCall}
        currentMode={preferences.mode}
        userCallsign={profile.callsign}
      />

      <CallLogsModal
        isOpen={isCallLogsModalOpen}
        onClose={() => setIsCallLogsModalOpen(false)}
        callLogs={callLogs}
        onClearLogs={() => setCallLogs([])}
        onAddFriendFromLog={(log) => {
          const newFriend: MutualFriend = {
            id: `friend_${Date.now()}`,
            callsign: log.callsign,
            tags: log.tags || [],
            addedAt: Date.now(),
            lastCallDuration: log.duration,
            friendCode: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
            frequencyCode: `${(92 + Math.random() * 16).toFixed(1)} FM`,
          };
          setFriends((prev) => {
            if (prev.some((f) => f.callsign === newFriend.callsign)) return prev;
            return [newFriend, ...prev];
          });
        }}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleSubmitReport}
        peerId={peerInfo.id}
      />

      <SafetyAndPrivacyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
      />

      <OwnerAnalyticsModal
        isOpen={isOwnerAnalyticsOpen}
        onClose={() => setIsOwnerAnalyticsOpen(false)}
      />

    </div>
  );
}

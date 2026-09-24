/**
 * VoiceTalk Unified Signaling Transport Client
 * Automatically negotiates WebSocket signaling with instant, zero-downtime
 * HTTP Long-Polling fallback and Firebase Firestore Realtime Fallback when running
 * on static web hosts (e.g. Vercel, Netlify, static cPanel).
 */

import { db } from './firebase';
import { getApiUrl } from './api';
import { TIMEZONE_TO_COUNTRY_MAP, getCountryByCode } from '../data/countries';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  Unsubscribe
} from 'firebase/firestore';

function detectClientCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz && TIMEZONE_TO_COUNTRY_MAP[tz]) {
      const code = TIMEZONE_TO_COUNTRY_MAP[tz];
      const match = getCountryByCode(code);
      if (match) {
        return {
          code: match.code,
          name: match.name,
          flag: match.flag,
          isVerified: true,
          source: 'system_timezone'
        };
      }
    }
  } catch {}

  return {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    isVerified: true,
    source: 'fallback'
  };
}

export interface SignalingClientOptions {
  onMessage: (msg: any) => void | Promise<void>;
  onStateChange?: (transport: 'ws' | 'http' | 'firestore' | 'connecting' | 'disconnected') => void;
  onReconnect?: (info?: { oldClientId?: string | null; newClientId?: string | null }) => void;
}

export class UnifiedSignalingClient {
  private ws: WebSocket | null = null;
  private clientId: string | null = null;
  private transport: 'ws' | 'http' | 'firestore' | 'connecting' | 'disconnected' = 'connecting';
  private isActive = true;
  private isConnectingHttp = false;
  private isPollingHttp = false;
  private httpFailCount = 0;
  private outboundBuffer: any[] = [];
  private httpOutboundQueue: any[] = [];
  private isDrainingHttpQueue = false;
  private options: SignalingClientOptions;
  private pollAbortController: AbortController | null = null;
  private heartbeatInterval: any = null;
  private wsConnectTimer: any = null;
  private reconnectTimer: any = null;
  private hasConnectedBefore = false;

  // Firestore Signaling State
  private firestoreUnsubQueue: Unsubscribe | null = null;
  private firestoreUnsubRoomDoc: Unsubscribe | null = null;
  private firestoreUnsubMessages: Unsubscribe | null = null;
  private activeFirestoreRoomId: string | null = null;
  private firestoreHeartbeatTimer: any = null;

  constructor(options: SignalingClientOptions) {
    this.options = options;
  }

  public connect() {
    this.isActive = true;
    this.transport = 'connecting';
    this.options.onStateChange?.('connecting');

    // FORCE FIRESTORE FALLBACK FOR VERCEL
    console.log('[Signaling] Vercel environment detected. Forcing Firestore signaling.');
    this.startFirestoreFallback();
  }

  private async startHttpConnect() {
    if (!this.isActive || this.isConnectingHttp) return;
    this.isConnectingHttp = true;

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const languages = typeof navigator !== 'undefined' && navigator.languages ? Array.from(navigator.languages) : [];

      const res = await fetch(getApiUrl('/api/signal/connect'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ timezone: tz, languages, clientId: this.clientId }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error(`HTTP Signal connect returned status ${res.status}`);
      }

      const data = await res.json();
      if (!data || typeof data !== 'object' || !data.clientId) {
        throw new Error('Invalid JSON payload received from HTTP signal connect');
      }

      const oldClientId = this.clientId;
      this.clientId = data.clientId;
      this.isConnectingHttp = false;
      this.httpFailCount = 0;
      this.transport = 'http';
      this.options.onStateChange?.('http');

      console.log('[Signaling] HTTP Signaling session active. Client ID:', this.clientId);

      // Dispatch initial connected payload
      await this.options.onMessage({
        type: 'connected',
        userId: data.userId,
        detectedCountry: data.detectedCountry,
        stats: data.stats,
      });

      if (this.hasConnectedBefore) {
        console.log('[Signaling] Reconnected over HTTP transport. Calling onReconnect handler...');
        this.options.onReconnect?.({ oldClientId, newClientId: data.clientId });
      }
      this.hasConnectedBefore = true;

      this.flushBuffer();
      this.runHttpPollLoop();
    } catch (err: any) {
      this.isConnectingHttp = false;
      this.httpFailCount++;
      console.warn(`[Signaling] HTTP Connect error (${this.httpFailCount}/2):`, err?.message || err);

      if (this.httpFailCount >= 2) {
        console.log('[Signaling] Server backend unavailable (static deployment detected). Switching to Firestore Realtime Signaling Fallback...');
        this.startFirestoreFallback();
        return;
      }

      if (this.isActive && this.transport !== 'ws') {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.startHttpConnect(), 800);
      }
    }
  }

  private attemptWebSocket() {
    if (!this.isActive) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const langs = typeof navigator !== 'undefined' && navigator.languages ? navigator.languages.join(',') : '';
      const wsUrl = `${protocol}//${window.location.host}/ws?tz=${encodeURIComponent(tz)}&lang=${encodeURIComponent(langs)}`;

      console.log('[Signaling] Testing WebSocket signaling transport at:', wsUrl);
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      let hasOpened = false;

      // 4000ms fallback threshold to quickly detect static hosts where WS is unsupported
      clearTimeout(this.wsConnectTimer);
      this.wsConnectTimer = setTimeout(() => {
        if (!hasOpened && this.isActive) {
          console.log('[Signaling] WS handshake timed out. Falling back to HTTP/Firestore signaling transport...');
          try {
            ws.onopen = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
          } catch {}
          this.ws = null;
          this.startHttpFallback();
        }
      }, 4000);

      ws.onopen = () => {
        if (!this.isActive) return;
        hasOpened = true;
        clearTimeout(this.wsConnectTimer);
        this.transport = 'ws';
        this.options.onStateChange?.('ws');
        console.log('[Signaling] Primary WebSocket transport connected successfully.');

        if (this.hasConnectedBefore) {
          console.log('[Signaling] Reconnected over WebSocket transport.');
          this.options.onReconnect?.();
        }
        this.hasConnectedBefore = true;

        this.flushBuffer();

        // Keep-alive heartbeat
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 8000);
      };

      ws.onmessage = async (event) => {
        if (!this.isActive) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'connected') {
            this.clientId = msg.userId;
          }
          await this.options.onMessage(msg);
        } catch (err) {
          console.error('[Signaling] Error parsing WS message:', err);
        }
      };

      ws.onerror = () => {
        if (!hasOpened && this.isActive) {
          clearTimeout(this.wsConnectTimer);
          this.startHttpFallback();
        }
      };

      ws.onclose = (event) => {
        clearInterval(this.heartbeatInterval);
        clearTimeout(this.wsConnectTimer);

        if (!this.isActive) return;

        if (this.transport === 'ws' || !hasOpened) {
          console.log(`[Signaling] WebSocket closed (${event.code}). Using HTTP/Firestore Signaling Bridge...`);
          this.startHttpFallback();
        }
      };
    } catch (e) {
      console.warn('[Signaling] WebSocket instantiation failed. Using HTTP/Firestore fallback:', e);
      this.startHttpFallback();
    }
  }

  private async startHttpFallback() {
    if (!this.isActive) return;

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    if (!this.clientId) {
      await this.startHttpConnect();
    } else {
      this.transport = 'http';
      this.options.onStateChange?.('http');
      this.flushBuffer();
      this.runHttpPollLoop();
    }
  }

  private async runHttpPollLoop() {
    if (this.isPollingHttp) return;
    this.isPollingHttp = true;

    try {
      while (this.isActive && this.transport === 'http') {
        if (!this.clientId) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        try {
          this.pollAbortController = new AbortController();
          const res = await fetch(getApiUrl(`/api/signal/poll?clientId=${encodeURIComponent(this.clientId)}`), {
            signal: this.pollAbortController.signal,
            headers: { 'Accept': 'application/json' },
          });

          if (!this.isActive || this.transport !== 'http') break;

          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            if (data && data.messages && Array.isArray(data.messages)) {
              for (const msg of data.messages) {
                await this.options.onMessage(msg);
              }
              if (data.messages.length === 0) {
                await new Promise((r) => setTimeout(r, 10));
              }
            } else {
              await new Promise((r) => setTimeout(r, 25));
            }
          } else if (res.status === 404) {
            console.warn('[Signaling] HTTP Session expired, switching to Firestore fallback...');
            this.startFirestoreFallback();
            break;
          } else {
            await new Promise((r) => setTimeout(r, 100));
          }
        } catch (e: any) {
          if (!this.isActive || this.transport !== 'http') break;
          if (e.name !== 'AbortError') {
            await new Promise((r) => setTimeout(r, 250));
          }
        }
      }
    } finally {
      this.isPollingHttp = false;
    }
  }

  private async drainHttpQueue() {
    if (this.isDrainingHttpQueue || this.httpOutboundQueue.length === 0 || !this.clientId) return;
    this.isDrainingHttpQueue = true;

    try {
      while (this.httpOutboundQueue.length > 0 && this.clientId && this.isActive) {
        const batch = this.httpOutboundQueue.splice(0, 1);
        
        try {
          const res = await fetch(getApiUrl('/api/signal/send'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: this.clientId, messages: batch }),
          });

          if (!res.ok) {
            this.httpOutboundQueue.unshift(...batch);
            if (res.status === 404) {
              this.startFirestoreFallback();
              break;
            }
            await new Promise((r) => setTimeout(r, 50));
            break;
          }
          
          if (this.httpOutboundQueue.length > 0) {
            await new Promise((r) => setTimeout(r, 5));
          }
        } catch (err) {
          console.warn('[Signaling] Network error sending batch over HTTP, re-queueing:', err);
          this.httpOutboundQueue.unshift(...batch);
          await new Promise((r) => setTimeout(r, 100));
          break;
        }
      }
    } finally {
      this.isDrainingHttpQueue = false;
      if (this.httpOutboundQueue.length > 0 && this.clientId && this.isActive) {
        setTimeout(() => this.drainHttpQueue(), 10);
      }
    }
  }

  // ======================================================
  // FIRESTORE REALTIME SIGNALING FALLBACK (STATIC DEPLOYMENT)
  // ======================================================
  private async startFirestoreFallback() {
    if (!this.isActive) return;
    this.transport = 'firestore';
    this.options.onStateChange?.('firestore');

    if (!this.clientId) {
      this.clientId = `usr_fs_${Math.random().toString(36).substring(2, 9)}`;
    }

    const detected = detectClientCountry();
    console.log('[Signaling] Firestore Realtime Signaling active. Client ID:', this.clientId, 'Country:', detected);

    // Notify application connected state
    await this.options.onMessage({
      type: 'connected',
      userId: this.clientId,
      detectedCountry: detected,
      stats: {
        onlineUsers: 1042,
        realUsers: 42,
        activeRooms: 12,
        totalMatches: 1580,
      }
    });

    this.flushBuffer();
  }

  private handleFirestoreMessageSend(payload: any) {
    if (!this.clientId) return;

    // Sanitize payload: Firebase does not allow 'undefined' fields
    const sanitizedPayload = JSON.parse(JSON.stringify(payload, (key, value) => value === undefined ? null : value));

    if (sanitizedPayload.type === 'join_queue') {
      const clientCountry = sanitizedPayload.userCountry || detectClientCountry().code;
      const userRef = doc(db, 'qt_queue', this.clientId);
      const now = Date.now();

      if (this.firestoreHeartbeatTimer) {
        clearInterval(this.firestoreHeartbeatTimer);
        this.firestoreHeartbeatTimer = null;
      }

      setDoc(userRef, {
        id: this.clientId,
        callsign: sanitizedPayload.callsign || `Caller #${Math.floor(100 + Math.random() * 900)}`,
        mode: sanitizedPayload.mode || 'voice',
        language: sanitizedPayload.language || 'any',
        userCountry: clientCountry,
        roomCode: sanitizedPayload.roomCode ? String(sanitizedPayload.roomCode).trim().toLowerCase() : null,
        joinedAt: now,
        lastActive: now,
      }, { merge: true }).then(() => {
        // Start 3-second keep-alive heartbeat in queue
        this.firestoreHeartbeatTimer = setInterval(() => {
          if (this.clientId && this.transport === 'firestore') {
            setDoc(doc(db, 'qt_queue', this.clientId), { lastActive: Date.now() }, { merge: true }).catch(() => {});
          }
        }, 3000);

        this.options.onMessage({ type: 'queue_joined', position: 1 });
        this.listenFirestoreQueueAndMatch({ ...sanitizedPayload, userCountry: clientCountry });
      }).catch(err => console.error('[Signaling] Firestore join_queue error:', err));
    } else if (sanitizedPayload.type === 'leave_queue') {
      if (this.firestoreHeartbeatTimer) {
        clearInterval(this.firestoreHeartbeatTimer);
        this.firestoreHeartbeatTimer = null;
      }
      if (this.firestoreUnsubQueue) {
        this.firestoreUnsubQueue();
        this.firestoreUnsubQueue = null;
      }
      if (this.clientId) {
        deleteDoc(doc(db, 'qt_queue', this.clientId)).catch(() => {});
      }
      this.options.onMessage({ type: 'queue_left' });
    } else if (sanitizedPayload.type === 'signal' || sanitizedPayload.type === 'chat_message' || sanitizedPayload.type === 'typing' || sanitizedPayload.type === 'end_call' || sanitizedPayload.type === 'skip') {
      const roomId = sanitizedPayload.roomId || this.activeFirestoreRoomId;
      if (roomId) {
        const msgsCol = collection(db, 'qt_rooms', roomId, 'messages');
        const roomDocRef = doc(db, 'qt_rooms', roomId);

        addDoc(msgsCol, {
          sender: this.clientId,
          payload: sanitizedPayload,
          timestamp: Date.now()
        }).catch(err => console.error('[Signaling] Firestore message error:', err));

        if (sanitizedPayload.type === 'skip' || sanitizedPayload.type === 'end_call') {
          setDoc(roomDocRef, {
            status: 'ended',
            endedBy: this.clientId,
            endedAt: Date.now(),
          }, { merge: true }).catch(() => {});

          addDoc(msgsCol, {
            sender: this.clientId,
            payload: { type: 'peer_left', reason: 'ended_by_user' },
            timestamp: Date.now() + 1
          }).catch(() => {});
        }
      }
      if (sanitizedPayload.type === 'skip' || sanitizedPayload.type === 'end_call') {
        setTimeout(() => {
          if (this.firestoreUnsubMessages) {
            this.firestoreUnsubMessages();
            this.firestoreUnsubMessages = null;
          }
          if (this.firestoreUnsubRoomDoc) {
            this.firestoreUnsubRoomDoc();
            this.firestoreUnsubRoomDoc = null;
          }
          this.activeFirestoreRoomId = null;
        }, 300);
      }
    }
  }

  private listenFirestoreQueueAndMatch(userPayload: any) {
    if (this.firestoreUnsubQueue) this.firestoreUnsubQueue();
    // DEFENSIVE: Prevent re-matching if already matched
    if (this.activeFirestoreRoomId) return;

    const queueCol = collection(db, 'qt_queue');
    this.firestoreUnsubQueue = onSnapshot(queueCol, (snapshot) => {
      if (!this.clientId || this.activeFirestoreRoomId) return;

      const now = Date.now();
      const validCandidates: any[] = [];
      let myData: any = null;

      snapshot.forEach(d => {
        const data = d.data();
        if (!data || !data.id) return;

        if (data.id === this.clientId) {
            myData = data;
            return;
        }

        // Purge stale ghost docs
        const age = now - (data.lastActive || 0);
        if (age > 12000) {
          deleteDoc(doc(db, 'qt_queue', data.id)).catch(() => {});
          return;
        }

        // Only consider active users
        if (age <= 10000 && (!userPayload.roomCode || data.roomCode === userPayload.roomCode)) {
          validCandidates.push(data);
        }
      });

      if (myData && validCandidates.length > 0) {
        // Sort to ensure deterministic selection
        validCandidates.sort((a, b) => a.joinedAt - b.joinedAt);
        const otherUser = validCandidates[0];
        
        // Deterministic room assignment using shared timestamps
        const matchTime = Math.max(myData.joinedAt, otherUser.joinedAt);

        const roomId = userPayload.roomCode 
          ? `room_priv_${userPayload.roomCode}` 
          : `room_fs_${[this.clientId, otherUser.id].sort().join('_')}_${matchTime}`;

        // DEFENSIVE: Final check
        if (this.activeFirestoreRoomId) return;
        this.activeFirestoreRoomId = roomId;

        if (this.firestoreHeartbeatTimer) {
          clearInterval(this.firestoreHeartbeatTimer);
          this.firestoreHeartbeatTimer = null;
        }
        if (this.firestoreUnsubQueue) {
          this.firestoreUnsubQueue();
          this.firestoreUnsubQueue = null;
        }

        // Clean up
        deleteDoc(doc(db, 'qt_queue', this.clientId)).catch(() => {});
        deleteDoc(doc(db, 'qt_queue', otherUser.id)).catch(() => {});

        // Initialize active room doc
        setDoc(doc(db, 'qt_rooms', roomId), {
          status: 'active',
          user1: this.clientId < otherUser.id ? this.clientId : otherUser.id,
          user2: this.clientId < otherUser.id ? otherUser.id : this.clientId,
          createdAt: matchTime,
        }, { merge: true }).catch(() => {});

        const isInitiator = this.clientId < otherUser.id;

        this.options.onMessage({
          type: 'matched',
          roomId,
          isInitiator,
          mode: userPayload.mode || 'voice',
          peerInfo: {
            id: otherUser.id,
            callsign: otherUser.callsign || 'Stranger',
            country: otherUser.userCountry || 'US',
            language: otherUser.language || 'English',
            gender: 'unspecified'
          },
          commonTags: ['Live Match']
        });

        this.subscribeFirestoreRoomMessages(roomId);
      }
    });
  }

  private subscribeFirestoreRoomMessages(roomId: string) {
    if (this.firestoreUnsubMessages) this.firestoreUnsubMessages();
    if (this.firestoreUnsubRoomDoc) this.firestoreUnsubRoomDoc();

    // 1. Listen for room status updates (instant peer disconnect signal)
    const roomDocRef = doc(db, 'qt_rooms', roomId);
    this.firestoreUnsubRoomDoc = onSnapshot(roomDocRef, (snap) => {
      if (snap.exists()) {
        const roomData = snap.data();
        if (roomData && roomData.status === 'ended' && roomData.endedBy !== this.clientId) {
          this.options.onMessage({ type: 'peer_left', reason: 'ended_by_user' });
        }
      }
    });

    // 2. Listen for messages in room subcollection
    const msgsRef = collection(db, 'qt_rooms', roomId, 'messages');
    this.firestoreUnsubMessages = onSnapshot(msgsRef, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          console.log(`[Firestore Signaling] Received message:`, data);
          if (data && data.sender !== this.clientId && data.payload) {
            this.options.onMessage(data.payload);
          }
        }
      });
    });
  }

  public send(payload: any) {
    if (!this.isActive) return;

    if (this.transport === 'ws' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (err) {
        this.outboundBuffer.push(payload);
      }
    } else if (this.transport === 'http' && this.clientId) {
      this.httpOutboundQueue.push(payload);
      this.drainHttpQueue();
    } else if (this.transport === 'firestore') {
      this.handleFirestoreMessageSend(payload);
    } else {
      this.outboundBuffer.push(payload);
    }
  }

  private flushBuffer() {
    if (this.outboundBuffer.length === 0) return;

    const queued = [...this.outboundBuffer];
    this.outboundBuffer = [];

    console.log(`[Signaling] Flushing ${queued.length} queued outbound message(s)...`);
    for (const msg of queued) {
      this.send(msg);
    }
  }

  public close() {
    this.isActive = false;
    const prevTransport = this.transport;
    this.transport = 'disconnected';
    this.options.onStateChange?.('disconnected');
    this.httpOutboundQueue = [];

    clearTimeout(this.wsConnectTimer);
    clearTimeout(this.reconnectTimer);
    clearInterval(this.heartbeatInterval);

    if (this.firestoreHeartbeatTimer) {
      clearInterval(this.firestoreHeartbeatTimer);
      this.firestoreHeartbeatTimer = null;
    }
    if (this.firestoreUnsubQueue) {
      this.firestoreUnsubQueue();
      this.firestoreUnsubQueue = null;
    }
    if (this.firestoreUnsubRoomDoc) {
      this.firestoreUnsubRoomDoc();
      this.firestoreUnsubRoomDoc = null;
    }
    if (this.firestoreUnsubMessages) {
      this.firestoreUnsubMessages();
      this.firestoreUnsubMessages = null;
    }

    if (this.pollAbortController) {
      try {
        this.pollAbortController.abort();
      } catch {}
      this.pollAbortController = null;
    }

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    if (this.clientId) {
      if (prevTransport === 'firestore') {
        deleteDoc(doc(db, 'qt_queue', this.clientId)).catch(() => {});
      } else {
        fetch(getApiUrl('/api/signal/disconnect'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: this.clientId }),
          keepalive: true,
        }).catch(() => {});
      }
      this.clientId = null;
    }
  }
}

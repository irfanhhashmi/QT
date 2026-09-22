/**
 * VoiceTalk Unified Signaling Transport Client
 * Automatically negotiates WebSocket signaling with instant, zero-downtime
 * HTTP Long-Polling fallback when running behind Cloudflare Workers, firewalls,
 * or reverse proxies that block WebSocket upgrades (e.g. Cloudflare Error 1101 / 500).
 */

export interface SignalingClientOptions {
  onMessage: (msg: any) => void | Promise<void>;
  onStateChange?: (transport: 'ws' | 'http' | 'connecting' | 'disconnected') => void;
  onReconnect?: (info?: { oldClientId?: string | null; newClientId?: string | null }) => void;
}

export class UnifiedSignalingClient {
  private ws: WebSocket | null = null;
  private clientId: string | null = null;
  private transport: 'ws' | 'http' | 'connecting' | 'disconnected' = 'connecting';
  private isActive = true;
  private isConnectingHttp = false;
  private isPollingHttp = false;
  private outboundBuffer: any[] = [];
  private httpOutboundQueue: any[] = [];
  private isDrainingHttpQueue = false;
  private options: SignalingClientOptions;
  private pollAbortController: AbortController | null = null;
  private heartbeatInterval: any = null;
  private wsConnectTimer: any = null;
  private reconnectTimer: any = null;
  private hasConnectedBefore = false;

  constructor(options: SignalingClientOptions) {
    this.options = options;
  }

  public connect() {
    this.isActive = true;
    this.transport = 'connecting';
    this.options.onStateChange?.('connecting');

    // Attempt WebSocket with fast fallback to robust HTTP Long-Polling
    this.attemptWebSocket();
  }

  private async startHttpConnect() {
    if (!this.isActive || this.isConnectingHttp) return;
    this.isConnectingHttp = true;

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const languages = typeof navigator !== 'undefined' && navigator.languages ? Array.from(navigator.languages) : [];

      const res = await fetch('/api/signal/connect', {
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
      console.warn('[Signaling] HTTP Connect error, retrying in 1s:', err?.message || err);
      if (this.isActive && this.transport !== 'ws') {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.startHttpConnect(), 1000);
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

      // 15000ms fallback threshold to allow container cold-start TLS + WebSocket handshakes
      clearTimeout(this.wsConnectTimer);
      this.wsConnectTimer = setTimeout(() => {
        if (!hasOpened && this.isActive) {
          console.log('[Signaling] WS handshake timed out (15s). Falling back to HTTP Long-Polling transport...');
          try {
            ws.onopen = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
          } catch {}
          this.ws = null;
          this.startHttpFallback();
        }
      }, 15000);

      ws.onopen = () => {
        if (!this.isActive) return;
        hasOpened = true;
        clearTimeout(this.wsConnectTimer);
        this.transport = 'ws';
        this.options.onStateChange?.('ws');
        console.log('[Signaling] Primary WebSocket transport connected successfully.');

        if (this.hasConnectedBefore) {
          console.log('[Signaling] Reconnected over WebSocket transport. Calling onReconnect handler...');
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

        // If closed or upgrade failed, fallback to HTTP bridge
        if (this.transport === 'ws' || !hasOpened) {
          console.log(`[Signaling] WebSocket closed (${event.code}). Using HTTP Signaling Bridge...`);
          this.startHttpFallback();
        }
      };
    } catch (e) {
      console.warn('[Signaling] WebSocket instantiation failed. Using HTTP fallback:', e);
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
          const res = await fetch(`/api/signal/poll?clientId=${encodeURIComponent(this.clientId)}`, {
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
              // If no messages were returned on this poll cycle, pause briefly to prevent CPU spinning
              if (data.messages.length === 0) {
                await new Promise((r) => setTimeout(r, 10)); // Reduced from 60ms for faster delivery
              }
            } else {
              await new Promise((r) => setTimeout(r, 25)); // Reduced from 100ms
            }
          } else if (res.status === 404) {
            console.warn('[Signaling] HTTP Session expired, re-registering...');
            this.clientId = null;
            await this.startHttpConnect();
            break;
          } else {
            await new Promise((r) => setTimeout(r, 100)); // Reduced from 500ms
          }
        } catch (e: any) {
          if (!this.isActive || this.transport !== 'http') break;
          if (e.name !== 'AbortError') {
            await new Promise((r) => setTimeout(r, 250)); // Reduced from 1000ms
          }
        }
      }
    } finally {
      this.isPollingHttp = false;
    }
  }

  public send(payload: any) {
    if (!this.isActive) return;

    if (this.transport === 'ws' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (err) {
        console.warn('[Signaling] Error sending over WS, buffering:', err);
        this.outboundBuffer.push(payload);
      }
    } else if (this.clientId) {
      this.httpOutboundQueue.push(payload);
      this.drainHttpQueue();
    } else {
      // Still establishing connection, buffer message
      this.outboundBuffer.push(payload);
    }
  }

  private async drainHttpQueue() {
    if (this.isDrainingHttpQueue || this.httpOutboundQueue.length === 0 || !this.clientId) return;
    this.isDrainingHttpQueue = true;

    try {
      while (this.httpOutboundQueue.length > 0 && this.clientId && this.isActive) {
        // CHANGE: Send only 1 message per batch instead of splicing all
        const batch = this.httpOutboundQueue.splice(0, 1);
        
        try {
          const res = await fetch('/api/signal/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: this.clientId, messages: batch }),
          });

          if (!res.ok) {
            if (res.status === 404) {
              console.warn('[Signaling] Session expired during HTTP send (404). Re-queuing messages and re-registering...');
              this.httpOutboundQueue.unshift(...batch);
              this.clientId = null;
              await this.startHttpConnect();
              break;
            } else {
              console.warn(`[Signaling] HTTP send returned status ${res.status}, re-queuing...`);
              this.httpOutboundQueue.unshift(...batch);
              await new Promise((r) => setTimeout(r, 50)); // Reduced from 500ms
              break;
            }
          }
          
          // CHANGE: Add small delay between individual messages to prevent server load
          if (this.httpOutboundQueue.length > 0) {
            await new Promise((r) => setTimeout(r, 5));
          }
        } catch (err) {
          console.warn('[Signaling] Network error sending batch over HTTP, re-queueing:', err);
          this.httpOutboundQueue.unshift(...batch);
          await new Promise((r) => setTimeout(r, 100)); // Reduced from 500ms
          break;
        }
      }
    } finally {
      this.isDrainingHttpQueue = false;
      if (this.httpOutboundQueue.length > 0 && this.clientId && this.isActive) {
        // CHANGE: Retry quickly instead of waiting
        setTimeout(() => this.drainHttpQueue(), 10);
      }
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
    this.transport = 'disconnected';
    this.options.onStateChange?.('disconnected');
    this.httpOutboundQueue = [];

    clearTimeout(this.wsConnectTimer);
    clearTimeout(this.reconnectTimer);
    clearInterval(this.heartbeatInterval);

    if (this.pollAbortController) {
      try {
        this.pollAbortController.abort();
      } catch {}
      this.pollAbortController = null;
    }

    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    if (this.clientId) {
      fetch('/api/signal/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: this.clientId }),
        keepalive: true,
      }).catch(() => {});
      this.clientId = null;
    }
  }
}

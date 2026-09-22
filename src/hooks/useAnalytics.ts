import { useEffect, useRef, useCallback } from 'react';

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem('quiktalks_vid');
    if (!vid) {
      vid = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem('quiktalks_vid', vid);
    }
    return vid;
  } catch {
    return `v_temp_${Math.random().toString(36).slice(2, 9)}`;
  }
}

function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem('quiktalks_sid');
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem('quiktalks_sid', sid);
    }
    return sid;
  } catch {
    return `s_temp_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export function useAnalytics(userCountry?: string) {
  const visitorIdRef = useRef<string>(getOrCreateVisitorId());
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const sessionStartTimeRef = useRef<number>(Date.now());
  const durationSecondsRef = useRef<number>(0);
  const callsJoinedCountRef = useRef<number>(0);
  const textChatsCountRef = useRef<number>(0);
  const userCountryRef = useRef<string | undefined>(userCountry);

  useEffect(() => {
    userCountryRef.current = userCountry;
  }, [userCountry]);

  // Send ping / heartbeat to server
  const sendPing = useCallback((isBeacon = false) => {
    try {
      const now = Date.now();
      const currentDuration = Math.max(
        durationSecondsRef.current,
        Math.round((now - sessionStartTimeRef.current) / 1000)
      );
      durationSecondsRef.current = currentDuration;

      const payload = {
        visitorId: visitorIdRef.current,
        sessionId: sessionIdRef.current,
        durationSeconds: currentDuration,
        callsJoined: callsJoinedCountRef.current,
        textChats: textChatsCountRef.current,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
        clientCountry: userCountryRef.current,
        referrer: document.referrer || 'Direct / Bookmark',
        landingPath: window.location.pathname || '/',
      };

      if (isBeacon && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/ping', blob);
      } else {
        fetch('/api/analytics/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {
          // Silent catch for background heartbeat
        });
      }
    } catch {
      // Ignore background heartbeat error
    }
  }, []);

  // Set up timer and listeners
  useEffect(() => {
    // 1. Initial Ping
    sendPing();

    // 2. Periodic Duration Increment & Server Sync
    const interval = setInterval(() => {
      durationSecondsRef.current = Math.max(
        durationSecondsRef.current,
        Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
      );
      sendPing();
    }, 15000); // Heartbeat every 15 seconds

    // 3. Tab Visibility & Pagehide/BeforeUnload Handlers for exact duration capture
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendPing(true);
      } else {
        sendPing(false);
      }
    };

    const handleBeforeUnload = () => {
      sendPing(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      sendPing(true);
    };
  }, [sendPing]);

  const recordCallActivity = useCallback(() => {
    callsJoinedCountRef.current += 1;
    sendPing();
  }, [sendPing]);

  const recordChatActivity = useCallback(() => {
    textChatsCountRef.current += 1;
    sendPing();
  }, [sendPing]);

  return {
    recordCallActivity,
    recordChatActivity,
  };
}

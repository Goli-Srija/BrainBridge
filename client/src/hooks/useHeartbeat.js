import { useEffect, useRef } from 'react';
import { api } from '../services/api';

/**
 * Real study-time tracking: once a minute, if the tab is visible AND the student interacted
 * (mouse, keyboard, scroll, touch) in the last 2 minutes, tell the server to add one study minute.
 * The server ignores heartbeats that arrive less than 50 seconds apart, so time cannot be inflated.
 */
export function useHeartbeat(enabled, onMinute) {
  const lastActivity = useRef(Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    const mark = () => { lastActivity.current = Date.now(); };
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const timer = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivity.current > 2 * 60 * 1000) return;
      try {
        const r = await api.post('/tracker/heartbeat');
        onMinute?.(r.studyMinutesToday);
      } catch { /* offline: skip this minute */ }
    }, 60 * 1000);
    return () => { clearInterval(timer); events.forEach((e) => window.removeEventListener(e, mark)); };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}

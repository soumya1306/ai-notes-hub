import { useEffect, useRef } from "react";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";
const BACKOFF = [1000, 2000, 4000, 8000];

export function useNoteSocket(noteId, accessToken, onMessage) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const sendQueueRef = useRef([]);

  // Always use the latest onMessage without re-running the effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!noteId || !accessToken) return;

    let attempt = 0;
    let timer = null;
    let alive = true;

    const connect = () => {
      if (!alive) return;

      const ws = new WebSocket(
        `${WS_BASE}/ws/notes/${noteId}?token=${accessToken}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        // flush anything queued before the connection opened
        sendQueueRef.current.forEach((msg) => ws.send(msg));
        sendQueueRef.current = [];
      };

      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "pong") return;
          onMessageRef.current?.(payload);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        ws.close(); // triggers onclose which handles reconnect
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!alive) return;
        const delay = BACKOFF[Math.min(attempt, BACKOFF.length - 1)];
        attempt += 1;
        timer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      alive = false;
      clearTimeout(timer);
      const ws = wsRef.current;
      if (ws) {
        // strip handlers so onclose doesn't schedule a reconnect after cleanup
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
        wsRef.current = null;
      }
    };
  }, [noteId, accessToken]); // onMessage intentionally omitted — handled via ref

  const send = (payload) => {
    const ws = wsRef.current;
    const msg = JSON.stringify(payload);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(msg);
    } else {
      // buffer until connection is ready
      sendQueueRef.current.push(msg);
    }
  };

  return { send };
}

// lib/websocket.ts
import { useEffect, useRef, RefObject } from 'react';

export function useWebSocket(
  userId: string | null,
  onMessage: (data: any) => void
): RefObject<WebSocket | null> {
  // Explicitly type wsRef as WebSocket or null
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log('[useWebSocket] ▶️ mount, userId=', userId, 'wsRef.current=', wsRef.current);
  
    if (!userId) return; // Only connect when user is authenticated

    // If there’s already a socket here, bail out
    if (wsRef.current) {
      console.log('[useWebSocket] ⛔️ already have a WS, skipping new one');
      return;
  }

    // Create and store WebSocket instance
    const ws = new WebSocket(`ws://localhost:6699/api/live/ws/${userId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[useWebSocket] raw message', event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup on unmount or userId change
    return () => {
      console.log('[useWebSocket] cleaning up for user', userId);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [userId, onMessage]);

  return wsRef;
}

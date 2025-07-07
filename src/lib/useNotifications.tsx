// lib/useNotifications.tsx
import { useEffect, useRef } from "react";
import { useAuth } from "./auth";
import { toast } from "sonner";

export type NotificationMessage = {
  type: string;
  content: string;
};

/**
 * Opens a WebSocket and invokes onMessage for each incoming message
 */
export function useNotifications(
  onMessage: (msg: NotificationMessage) => void
) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("access_token");
    const url = `${process.env.NEXT_PUBLIC_WS_URL}/live/ws/${token}`;

    let ws: WebSocket;
    let retry = 0;

    const connect = () => {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as NotificationMessage;
          onMessage(msg);
        } catch {
          // ignore invalid messages
        }
      };

      ws.onclose = () => {
        const timeout = Math.min(10000, 1000 * 2 ** retry++);
        setTimeout(connect, timeout);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, [user, onMessage]);
}


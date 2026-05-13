import { useEffect, useRef } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import type { NotificationRecord } from "../../api/notifications";

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_MESSAGES_PER_SECOND = 50;
const WS_BASE_URL = `${protocol}//${window.location.host}`;

export function useWebSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let reconnectAttempts = 0;
    let isComponentMounted = true;
    let reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
    let messageCount = 0;
    let messageWindowStart = Date.now();

    const connect = () => {
      if (!isComponentMounted) return;

      const ws = new WebSocket(WS_BASE_URL + "/ws/notifications/");

      ws.onopen = () => {
        console.info("[WebSocket] Connected");
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        const now = Date.now();
        if (now - messageWindowStart > 1000) {
          messageCount = 0;
          messageWindowStart = now;
        }
        messageCount++;
        if (messageCount > MAX_MESSAGES_PER_SECOND) {
          console.warn("[WebSocket] Rate limit exceeded, dropping message");
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification" && data.payload) {
            const raw = data.payload;

            if (
              typeof raw.id === "undefined" ||
              typeof raw.message !== "string"
            ) {
              console.warn("[WebSocket] Malformed payload", raw);
              return;
            }

            const newNotif: NotificationRecord = {
              id: String(raw.id),
              recipient: String(raw.recipient_id),
              notification_type: raw.notification_type || "GENERAL_UPDATE",
              message: raw.message,
              action_url: raw.action_url || "",
              is_read: false,
              created_at: raw.created_at || new Date().toISOString(),
            };
            addNotification(newNotif);
          }
        } catch (e) {
          console.error("[WebSocket] Parse error", e);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (isComponentMounted && reconnectAttempts < MAX_RETRIES) {
          const delay = Math.pow(2, reconnectAttempts) * BASE_DELAY_MS;
          console.info(`[WebSocket] Reconnecting in ${delay}ms...`);
          reconnectTimerId = setTimeout(connect, delay);
          reconnectAttempts++;
        }
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      isComponentMounted = false;
      if (reconnectTimerId) clearTimeout(reconnectTimerId);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, addNotification]);
}

import { Client } from "@stomp/stompjs";
import axiosClient, { API_BASE_URL } from "./axiosClient";
import { getAccessToken } from "./session";

/**
 * WebSocket (STOMP) client dùng chung.
 *
 * URL mặc định suy ra từ VITE_API_BASE_URL:  http://host:8080/api/v1  ->  ws://host:8080/ws
 * Có thể ghi đè bằng VITE_WS_URL (vd: wss://api.example.com/ws).
 */
export const WS_URL =
  import.meta.env.VITE_WS_URL ??
  `${API_BASE_URL.replace(/^http/, "ws").replace(/\/api\/v\d+\/?$/, "")}/ws`;

function tokenExpiresSoon(token, skewSeconds = 60) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(b64));
    return !exp || exp * 1000 - Date.now() < skewSeconds * 1000;
  } catch {
    return true;
  }
}

/** Trả access token còn hạn. Nếu sắp hết hạn: gọi 1 API nhẹ để interceptor tự refresh token. */
async function getFreshToken() {
  let token = getAccessToken();
  if (token && tokenExpiresSoon(token)) {
    try {
      await axiosClient.get("/users/me");
    } catch {
      /* refresh hỏng -> interceptor đã đưa người dùng về trang đăng nhập */
    }
    token = getAccessToken();
  }
  return token;
}

/**
 * Kết nối và nghe các kênh /topic/user/{userId}/{topic}.
 *
 * @param {object}   opts
 * @param {number}   opts.userId
 * @param {string[]} opts.topics            vd ["matching"] hoặc ["requests"]
 * @param {(msg: object) => void} opts.onMessage   nhận payload JSON đã parse
 * @param {(connected: boolean) => void} [opts.onConnectionChange]
 * @returns {() => void} hàm ngắt kết nối
 *
 * Tự động kết nối lại (5s) và đăng ký lại kênh; mỗi lần kết nối lại dùng token mới.
 */
export function connectUserTopics({ userId, topics, onMessage, onConnectionChange }) {
  const client = new Client({
    brokerURL: WS_URL,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    beforeConnect: async (c) => {
      const token = await getFreshToken();
      c.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },

    onConnect: () => {
      topics.forEach((topic) => {
        client.subscribe(`/topic/user/${userId}/${topic}`, (frame) => {
          try {
            onMessage(JSON.parse(frame.body));
          } catch (e) {
            console.warn("[ws] payload không hợp lệ", e);
          }
        });
      });
      onConnectionChange?.(true);
    },

    onWebSocketClose: () => onConnectionChange?.(false),
    onStompError: (frame) => console.warn("[ws] STOMP error:", frame.headers?.message),
  });

  client.activate();
  return () => {
    onConnectionChange?.(false);
    client.deactivate();
  };
}

/**
 * @returns {{ publish: (destination: string, payload: object) => boolean, disconnect: () => void }}
 */
export function connectWorkerChannel({ userId, topics = [], onMessage, onConnectionChange }) {
  const client = new Client({
    brokerURL: WS_URL,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    beforeConnect: async (c) => {
      const token = await getFreshToken();
      c.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },

    onConnect: () => {
      topics.forEach((topic) => {
        client.subscribe(`/topic/user/${userId}/${topic}`, (frame) => {
          try {
            onMessage?.(JSON.parse(frame.body));
          } catch (e) {
            console.warn("[ws] payload không hợp lệ", e);
          }
        });
      });
      onConnectionChange?.(true);
    },

    onWebSocketClose: () => onConnectionChange?.(false),
    onStompError: (frame) => console.warn("[ws] STOMP error:", frame.headers?.message),
  });

  client.activate();

  return {
    publish(destination, payload) {
      if (!client.connected) return false;
      client.publish({
        destination,
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
      });
      return true;
    },
    disconnect() {
      onConnectionChange?.(false);
      client.deactivate();
    },
  };
}

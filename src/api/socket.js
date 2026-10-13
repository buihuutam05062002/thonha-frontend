import { Client } from "@stomp/stompjs";
import axiosClient, { API_BASE_URL } from "./axiosClient";
import { getAccessToken } from "./session";


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

async function getFreshToken() {
  let token = getAccessToken();
  if (token && tokenExpiresSoon(token)) {
    try {
      await axiosClient.get("/users/me");
    } catch {
      alert.console("hello")
    }
    token = getAccessToken();
  }
  return token;
}

/**

 * @param {object}   opts
 * @param {number}   opts.userId
 * @param {string[]} opts.topics          
 * @param {(msg: object) => void} opts.onMessage   
 * @param {(connected: boolean) => void} [opts.onConnectionChange]
 * @returns {() => void} hàm ngắt kết nối
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

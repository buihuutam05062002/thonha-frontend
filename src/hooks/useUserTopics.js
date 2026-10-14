import { useEffect, useRef, useState } from "react";
import { connectUserTopics } from "../api/socket";

/**
 * Nghe thông báo realtime của người dùng hiện tại qua WebSocket.
 *
 * @param {number|null|undefined} userId   truyền null/undefined để tạm không kết nối
 * @param {string[]} topics                vd ["matching"]
 * @param {(msg: object) => void} onMessage
 * @returns {boolean} đang kết nối hay không
 */
export function useUserTopics(userId, topics, onMessage) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onMessage);
  const topicsKey = topics.join(",");

  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    if (!userId) return undefined;
    const disconnect = connectUserTopics({
      userId,
      topics: topicsKey.split(","),
      onMessage: (msg) => handlerRef.current?.(msg),
      onConnectionChange: setConnected,
    });
    return disconnect;
  }, [userId, topicsKey]);

  return connected;
}

import { useEffect, useRef, useState } from "react";
import { connectUserTopics } from "../api/socket";

/**
 *
 * @param {number|null|undefined} userId   
 * @param {string[]} topics               
 * @param {(msg: object) => void} onMessage
 * @returns {boolean} 
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

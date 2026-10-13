import axiosClient from "./axiosClient";

/**
 * Chat khách <-> thợ
 *
 * Backend endpoints:
 * - GET   /api/v1/chats/by-request/{requestId}          
 * - GET   /api/v1/chats/{chatId}/messages?beforeId&size  
 * - POST  /api/v1/chats/{chatId}/messages             
 * - PATCH /api/v1/chats/{chatId}/seen              
 *
 */

export const CHAT_PAGE_SIZE = 30;
export const CHAT_MAX_IMAGES = 5;
export const CHAT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function getChatByRequest(requestId) {
  return axiosClient.get(`/chats/by-request/${requestId}`);
}

export async function getChatMessages(chatId, beforeId = null) {
  const params = { size: CHAT_PAGE_SIZE };
  if (beforeId != null) params.beforeId = beforeId;
  return (await axiosClient.get(`/chats/${chatId}/messages`, { params })) ?? [];
}

export function sendChatMessage(chatId, content, files = []) {
  const formData = new FormData();
  if (content) formData.append("content", content);
  files.forEach((f) => f && formData.append("files", f));
  return axiosClient.post(`/chats/${chatId}/messages`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
}

export function markChatSeen(chatId) {
  return axiosClient.patch(`/chats/${chatId}/seen`);
}

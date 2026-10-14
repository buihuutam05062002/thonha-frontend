import axiosClient from "./axiosClient";

export async function getPendingOffer() {
  const data = await axiosClient.get("/worker/pending-offer");
  return data || null;
}

export function getRequestOffer(requestId) {
  return axiosClient.get(`/worker/requests/${requestId}`);
}

export function acceptRequest(requestId) {
  return axiosClient.post(`/worker/requests/${requestId}/accept`);
}

export function rejectRequest(requestId) {
  return axiosClient.post(`/worker/requests/${requestId}/reject`);
}

export function registerDeviceToken(token) {
  return axiosClient.post("/devices/token", { token });
}

export function startMoving(requestId) {
  return axiosClient.post(`/worker/requests/${requestId}/start-moving`);
}

export function arriveAtRequest(requestId) {
  return axiosClient.post(`/worker/requests/${requestId}/arrive`);
}

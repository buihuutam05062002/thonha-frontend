const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";
const USER = "user";
const SESSION_EXPIRED_EVENT = "auth:session-expired";


const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeSession(listener) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", notify);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", notify);
  };
}

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);


let userCache = { raw: undefined, user: null };

export function getStoredUser() {
  const raw = localStorage.getItem(USER);
  if (raw === userCache.raw) return userCache.user;
  // eslint-disable-next-line no-useless-assignment
  let user = null;
  try {
    user = JSON.parse(raw || "null");
  } catch {
    user = null;
  }
  userCache = { raw, user };
  return user;
}

export function saveSession(authData) {
  if (authData?.accessToken) localStorage.setItem(ACCESS_TOKEN, authData.accessToken);
  if (authData?.refreshToken) localStorage.setItem(REFRESH_TOKEN, authData.refreshToken);
  if (authData?.user) localStorage.setItem(USER, JSON.stringify(authData.user));
  notify();
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem(USER);
  notify();
}

export function expireSession() {
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function onSessionExpired(handler) {
  window.addEventListener(SESSION_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
}

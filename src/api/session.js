const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";
const USER = "user";
const SESSION_EXPIRED_EVENT = "auth:session-expired";

// ---- Store reactive -------------------------------------------------------------------------
// Mọi thay đổi phiên (đăng nhập, đổi user, đăng xuất, hết hạn) đều gọi notify() để
// `useAuth()` (src/auth/useAuth.js) cập nhật giao diện. Sự kiện `storage` của trình duyệt
// được dùng để đồng bộ giữa các tab (tab khác đăng xuất/đăng nhập thì tab này cũng đổi theo).
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Đăng ký nhận thông báo khi phiên đổi. Trả về hàm huỷ đăng ký (dùng với useSyncExternalStore). */
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

// Giữ nguyên tham chiếu object khi chuỗi JSON không đổi: useSyncExternalStore so sánh snapshot
// bằng Object.is, nếu mỗi lần parse ra object mới thì React sẽ render lặp vô hạn.
let userCache = { raw: undefined, user: null };

export function getStoredUser() {
  const raw = localStorage.getItem(USER);
  if (raw === userCache.raw) return userCache.user;
  let user = null;
  try {
    user = JSON.parse(raw || "null");
  } catch {
    user = null;
  }
  userCache = { raw, user };
  return user;
}

// Chỉ ghi những phần có mặt trong `authData` (vd ProfilePage chỉ cập nhật `user`).
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

// axiosClient nằm ngoài cây React nên không tự điều hướng được:
// xoá phiên rồi phát sự kiện. `RequireAuth` tự đưa người dùng về trang đăng nhập khi phiên mất;
// sự kiện này vẫn được giữ để nơi nào cần (vd hiện thông báo "hết phiên") có thể lắng nghe.
export function expireSession() {
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function onSessionExpired(handler) {
  window.addEventListener(SESSION_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
}

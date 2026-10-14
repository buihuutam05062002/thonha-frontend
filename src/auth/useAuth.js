import { useCallback, useMemo, useSyncExternalStore } from "react";
import { logout as logoutApi } from "../api/authApi";
import { getAccessToken, getStoredUser, subscribeSession } from "../api/session";

const NO_ROLES = [];

/**
 * Trạng thái đăng nhập dùng chung cho toàn app. Đọc từ session store nên tự cập nhật khi
 * đăng nhập / đăng xuất / đổi user / hết phiên / tab khác thay đổi phiên.
 *
 * @returns {{
 *   user: object|null,
 *   roles: string[],
 *   isAuthenticated: boolean,
 *   hasRole: (role: string) => boolean,
 *   hasAnyRole: (roles: string[]) => boolean,
 *   logout: () => Promise<void>,
 * }}
 */
export function useAuth() {
  const user = useSyncExternalStore(subscribeSession, getStoredUser, () => null);
  const isAuthenticated = useSyncExternalStore(
    subscribeSession,
    () => !!getAccessToken(),
    () => false
  );
  const roles = user?.roles ?? NO_ROLES;

  const hasRole = useCallback((role) => roles.includes(role), [roles]);
  const hasAnyRole = useCallback((list) => list.some((r) => roles.includes(r)), [roles]);

  // logoutApi luôn xoá phiên cục bộ (finally) kể cả khi API lỗi, nên ở đây nuốt lỗi:
  // người dùng bấm "Đăng xuất" thì luôn được đăng xuất.
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      /* phiên cục bộ đã được xoá */
    }
  }, []);

  return useMemo(
    () => ({ user, roles, isAuthenticated, hasRole, hasAnyRole, logout }),
    [user, roles, isAuthenticated, hasRole, hasAnyRole, logout]
  );
}

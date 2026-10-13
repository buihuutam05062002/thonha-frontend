import { useCallback, useMemo, useSyncExternalStore } from "react";
import { logout as logoutApi } from "../api/authApi";
import { getAccessToken, getStoredUser, subscribeSession } from "../api/session";

const NO_ROLES = [];

/**

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

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {/*hello*/
    }
  }, []);

  return useMemo(
    () => ({ user, roles, isAuthenticated, hasRole, hasAnyRole, logout }),
    [user, roles, isAuthenticated, hasRole, hasAnyRole, logout]
  );
}

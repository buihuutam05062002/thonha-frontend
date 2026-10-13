import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function RequireAuth({ roles, redirectTo = "/" }) {
  const { isAuthenticated, hasAnyRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  if (roles?.length && !hasAnyRole(roles)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
}

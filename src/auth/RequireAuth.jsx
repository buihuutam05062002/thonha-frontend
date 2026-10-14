import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

/**
 * Route guard dạng layout route:
 *
 *   <Route element={<RequireAuth roles={["ADMIN"]} />}>
 *     <Route path="users" element={<UserManagement />} />
 *   </Route>
 *
 * - Chưa đăng nhập (hoặc phiên hết hạn / đăng xuất ở tab khác) -> /auth, nhớ trang đang vào để quay lại sau khi đăng nhập.
 * - Đã đăng nhập nhưng không có role nào trong `roles` -> `redirectTo`.
 * - Bỏ `roles` nếu chỉ cần đăng nhập.
 *
 * Lưu ý: đây chỉ là lớp UX. Quyền thật vẫn do backend kiểm tra ở từng API.
 */
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

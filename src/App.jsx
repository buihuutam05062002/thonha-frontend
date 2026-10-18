import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import CustomerApp from "./areas/customer/CustomerApp.jsx";
import WorkerArea from "./areas/worker/WorkerArea.jsx";
import AdminArea from "./areas/admin/AdminArea.jsx";
import AuthPage from "./pages/auth/AuthPage.jsx";
import { useAuth } from "./auth/useAuth";
import ConfirmProvider from "./components/ui/confirm/ConfirmProvider.jsx";
import ErrorBoundary from "./components/error/ErrorBoundary.jsx";

function AuthRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  // Đã đăng nhập (kể cả vừa đăng nhập xong) -> về trang đang định vào, mặc định là trang chủ.
  // Landing ở "/" tự chuyển ADMIN về /admin và thợ về /worker.
  if (isAuthenticated) {
    const from = location.state?.from;
    const target = from ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}` : "/";
    return <Navigate to={target} replace />;
  }
  return <AuthPage />;
}

// Bắt lỗi render theo từng trang; đổi route thì tự thoát khỏi trạng thái lỗi.
function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKeys={[pathname]}>{children}</ErrorBoundary>;
}

export default function App() {

  return (
    <ConfirmProvider>
      <BrowserRouter>
        <RouteErrorBoundary>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/worker/*" element={<WorkerArea />} />
          <Route path="/admin/*" element={<AdminArea />} />
          <Route path="/*" element={<CustomerApp />} />
        </Routes>
        </RouteErrorBoundary>
      </BrowserRouter>
    </ConfirmProvider>
  );
}

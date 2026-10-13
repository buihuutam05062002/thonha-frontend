import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import CustomerApp from "./areas/customer/CustomerApp.jsx";
import WorkerArea from "./areas/worker/WorkerArea.jsx";
import AdminArea from "./areas/admin/AdminArea.jsx";
import AuthPage from "./pages/auth/AuthPage.jsx";
import { useAuth } from "./auth/useAuth";
import ConfirmProvider from "./components/ui/confirm/ConfirmProvider.jsx";

function AuthRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from;
    const target = from ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}` : "/";
    return <Navigate to={target} replace />;
  }
  return <AuthPage />;
}

export default function App() {
  return (
    <ConfirmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/worker/*" element={<WorkerArea />} />
          <Route path="/admin/*" element={<AdminArea />} />
          <Route path="/*" element={<CustomerApp />} />
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  );
}

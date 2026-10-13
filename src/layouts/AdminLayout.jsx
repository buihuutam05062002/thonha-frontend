import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar/Sidebar";
import { useAuth } from "../auth/useAuth";
import "./AdminLayout.css";

export default function AdminLayout() {
  const { user: stored } = useAuth();
  const user = {
    name: stored?.fullName || "Admin",
    role: (stored?.roles || []).join(", ") || "ADMIN",
    avatar: stored?.avatarUrl || "",
  };

  return (
    <div className="admin-layout">
      <Sidebar user={user} />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

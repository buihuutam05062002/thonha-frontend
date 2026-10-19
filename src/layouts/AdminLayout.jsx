import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar/Sidebar";
import { useAuth } from "../auth/useAuth";

export default function AdminLayout() {
  const { user: stored } = useAuth();
  const user = {
    name: stored?.fullName || "Admin",
    role: (stored?.roles || []).join(", ") || "ADMIN",
    avatar: stored?.avatarUrl || "",
  };

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <Sidebar user={user} />
      <main className="flex min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

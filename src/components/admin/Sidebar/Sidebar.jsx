import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileCheck, Users, LayoutGrid, ClipboardList,
  MessageCircle, CircleAlert, FileDown, Percent, LogOut,
  Bell, Search, ChevronLeft, ChevronRight, Wallet,
} from "lucide-react";
import { useAuth } from "../../../auth/useAuth";
import { fetchComplaintStats } from "../../../api/complaintApi";
import { useUserTopics } from "../../../hooks/useUserTopics";
import { cn } from "../ui/cn";

import logo from "../../../assets/logo.jpg";

// `soon: true` = trang chưa được xây dựng: hiển thị mờ, không bấm được (tránh dẫn tới trang trống).
// Khi làm xong trang nào thì thêm <Route> trong AdminArea.jsx và bỏ `soon` ở đây.
const MENU = [
  { label: "Tổng quan", to: "/admin/overview", icon: LayoutDashboard },
  { label: "Duyệt hồ sơ", to: "/admin/profiles", icon: FileCheck },
  { label: "Người dùng", to: "/admin/users", icon: Users },
  { label: "Ví thợ", to: "/admin/wallets", icon: Wallet },
  { label: "Hoa hồng", to: "/admin/commissions", icon: Percent },
  { label: "Danh mục", to: "/admin/categories", icon: LayoutGrid },
  { label: "Thống kê", to: "/admin/statistics", icon: ClipboardList },
  { label: "Hội thoại", to: "/admin/conversations", icon: MessageCircle, soon: true },
  { label: "Khiếu nại", to: "/admin/complaints", icon: CircleAlert, badge: "complaints" },
  { label: "Xuất file", to: "/admin/export", icon: FileDown, soon: true },
];

export default function Sidebar({ user = { name: "Admin", role: "Admin", avatar: "" } }) {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const adminId = authUser?.id;

  // Số khiếu nại chờ xử lý hiện trên menu. Sidebar là nơi duy nhất giữ kết nối WebSocket của admin cho kênh
  // khiếu nại; có tin mới thì phát sự kiện "complaints:changed" để trang Khiếu nại (nếu đang mở) tự tải lại.
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const refreshPending = () => {
    fetchComplaintStats()
      .then((s) => setPendingComplaints(s.PENDING ?? 0))
      .catch(() => { /* số đếm chỉ để tham khảo, lỗi thì giữ số cũ */ });
  };

  useEffect(() => {
    refreshPending();
    // trang Khiếu nại vừa tải số liệu mới (sau khi nhận xử lý / kết luận) -> dùng luôn, không gọi lại API
    const onStats = (e) => setPendingComplaints(e.detail?.PENDING ?? 0);
    window.addEventListener("complaints:stats", onStats);
    return () => window.removeEventListener("complaints:stats", onStats);
  }, []);

  useUserTopics(adminId, ["complaints"], (msg) => {
    refreshPending();
    window.dispatchEvent(new CustomEvent("complaints:changed", { detail: msg }));
  });

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? MENU.filter((m) => m.label.toLowerCase().includes(q)) : MENU;
  }, [query]);

  const handleLogout = async () => {
    await logout(); // gọi API thu hồi refresh token rồi xoá phiên cục bộ
    navigate("/auth", { replace: true });
  };

  const hideText = collapsed ? "hidden" : "max-[720px]:hidden";
  const linkBase =
    "relative flex h-10 w-full cursor-pointer items-center gap-3.5 rounded-xl border-0 bg-transparent px-3.5 text-left text-[13px] text-ink no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  const centered = collapsed ? "justify-center" : "max-[720px]:justify-center";

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col gap-16px rounded-r-[20px] border-r-[1px] border-line bg-white pb-16px pt-6 transition-[width] duration-200",
        collapsed ? "w-[76px] px-3.5" : "w-[280px] px-16px max-[720px]:w-[76px] max-[720px]:px-3.5",
      )}
    >
      <button
        type="button"
        className="absolute -right-2.5 top-1/2 grid h-8 w-5 cursor-pointer place-items-center rounded-lg border-[1px] border-line bg-white p-0 text-subtle hover:bg-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand max-[720px]:hidden"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn("flex items-center gap-2.5 px-2", centered)}>
        <img src={logo} alt="" width={60} />
        <span className={cn("text-xl font-bold text-navy", hideText)}>Thợ Nhà</span>
      </div>

      {!collapsed && (
        <label className="flex h-9 items-center gap-2 rounded-full border-[1px] border-line px-3.5 text-subtle focus-within:border-brand max-[720px]:hidden">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="Tìm chức năng"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-ink outline-none"
          />
        </label>
      )}

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto" aria-label="Menu chính">
        {items.map(({ label, to, icon: Icon, soon, badge }) =>
          soon ? (
            <span
              key={to}
              className={cn(linkBase, "cursor-not-allowed opacity-50", centered)}
              aria-disabled="true"
              title={collapsed ? `${label} (sắp có)` : "Sắp có"}
            >
              <Icon size={16} aria-hidden="true" />
              <span className={hideText}>{label}</span>
              <small className={cn("ml-auto rounded-lg bg-slate-100 px-1.5 text-[10px]", hideText)}>Sắp có</small>
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(linkBase, centered, isActive ? "bg-brand-soft font-semibold text-brand-dark hover:text-brand-dark" : "hover:bg-slate-100 hover:text-ink")
              }
            >
              <Icon size={16} aria-hidden="true" />
              <span className={hideText}>{label}</span>
              {badge === "complaints" && pendingComplaints > 0 && (
                <span
                  title={`${pendingComplaints} khiếu nại chờ xử lý`}
                  className={cn(
                    "inline-grid place-items-center rounded-full bg-red-600 font-bold text-white",
                    collapsed
                      ? "absolute right-1.5 top-0.5 h-4 min-w-4 px-1 text-[10px]"
                      : "ml-auto h-5 min-w-5 px-1.5 text-[11px] max-[720px]:absolute max-[720px]:right-1.5 max-[720px]:top-0.5 max-[720px]:h-4 max-[720px]:min-w-4 max-[720px]:px-1 max-[720px]:text-[10px]",
                  )}
                >
                  {pendingComplaints > 99 ? "99+" : pendingComplaints}
                </span>
              )}
            </NavLink>
          ),
        )}
        {items.length === 0 && <p className="m-0 px-3.5 text-xs text-subtle">Không có chức năng phù hợp</p>}
      </nav>

      <div className="flex flex-col gap-1">
        <div className={cn("flex items-center gap-2.5 px-1.5 pb-12px pt-2", centered)}>
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-[34px] w-[34px] shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand-dark">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </span>
          )}
          <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5 text-xs", hideText)}>
            <strong className="truncate text-ink">{user.name}</strong>
            <span className="self-start rounded-md bg-brand-soft px-2 text-[10px] font-semibold text-brand-dark">{user.role}</span>
          </div>
          <button
            type="button"
            className={cn(
              "cursor-pointer rounded-lg border-0 bg-transparent p-1 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              hideText,
            )}
            aria-label="Thông báo"
          >
            <Bell size={18} />
          </button>
        </div>

        <button
          type="button"
          className={cn(linkBase, "text-red-600 hover:bg-red-50", centered)}
          onClick={handleLogout}
          title={collapsed ? "Đăng xuất" : undefined}
        >
          <LogOut size={16} aria-hidden="true" />
          <span className={hideText}>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

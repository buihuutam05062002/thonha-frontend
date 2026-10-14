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
import "./Sidebar.css";

import logo from "../../../assets/logo.jpg";

// `soon: true` = trang chưa được xây dựng: hiển thị mờ, không bấm được (tránh dẫn tới trang trống).
// Khi làm xong trang nào thì thêm <Route> trong AdminArea.jsx và bỏ `soon` ở đây.
const MENU = [
  { label: "Duyệt hồ sơ", to: "/admin/profiles", icon: FileCheck },
  { label: "Người dùng", to: "/admin/users", icon: Users },
  { label: "Ví thợ", to: "/admin/wallets", icon: Wallet },
  { label: "Hoa hồng", to: "/admin/commissions", icon: Percent },
  { label: "Tổng quan", to: "/admin/overview", icon: LayoutDashboard, soon: true },
  { label: "Danh mục", to: "/admin/categories", icon: LayoutGrid, soon: true },
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

  return (
    <aside className={`sb ${collapsed ? "sb-collapsed" : ""}`}>
      <button
        className="sb-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="sb-brand">
        <img src={logo} alt="" width={60} />
        <span className="sb-text sb-brand-name">Thợ Nhà</span>
      </div>

      {!collapsed && (
        <label className="sb-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="Tìm chức năng"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      )}

      <nav className="sb-nav" aria-label="Menu chính">
        {items.map(({ label, to, icon: Icon, soon, badge }) =>
          soon ? (
            <span
              key={to}
              className="sb-link sb-disabled"
              aria-disabled="true"
              title={collapsed ? `${label} (sắp có)` : "Sắp có"}
            >
              <Icon size={16} aria-hidden="true" />
              <span className="sb-text">{label}</span>
              <small className="sb-text sb-soon">Sắp có</small>
            </span>
          ) : (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `sb-link ${isActive ? "active" : ""}`}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="sb-text">{label}</span>
            {badge === "complaints" && pendingComplaints > 0 && (
              <span className="sb-count" title={`${pendingComplaints} khiếu nại chờ xử lý`}>
                {pendingComplaints > 99 ? "99+" : pendingComplaints}
              </span>
            )}
          </NavLink>
          )
        )}
        {items.length === 0 && <p className="sb-none">Không có chức năng phù hợp</p>}
      </nav>

      <div className="sb-bottom">
        <div className="sb-user">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="sb-avatar" />
          ) : (
            <span className="sb-avatar sb-avatar-fallback">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </span>
          )}
          <div className="sb-text sb-user-info">
            <strong>{user.name}</strong>
            <span className="sb-badge">{user.role}</span>
          </div>
          <button className="sb-icon-btn sb-text" aria-label="Thông báo">
            <Bell size={18} />
          </button>
        </div>

        <button className="sb-link sb-logout" onClick={handleLogout} title={collapsed ? "Đăng xuất" : undefined}>
          <LogOut size={16} aria-hidden="true" />
          <span className="sb-text">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

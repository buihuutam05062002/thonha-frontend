import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchUserById, ROLES, USER_STATUSES } from "../../../api/userApi";
import { formatDateTime } from "../../../utils/format";

const roleLabel = (v) => ROLES.find((r) => r.value === v)?.label ?? v;
const statusLabel = (v) => USER_STATUSES.find((s) => s.value === v)?.label ?? v;

export default function UserDetailModal({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setUser(null);
    setError("");
    fetchUserById(userId)
      .then((u) => !cancelled && setUser(u))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = user && [
    ["Mã người dùng", user.id],
    ["Họ tên", user.fullName],
    ["Tên đăng nhập", user.username || "-"],
    ["Email", user.email || "-"],
    ["Số điện thoại", user.phoneNumber || "-"],
    ["Vai trò", (user.roles ?? []).map(roleLabel).join(", ") || "-"],
    ["Trạng thái", statusLabel(user.status)],
    ["Ngày tạo", formatDateTime(user.createdAt)],
    ["Cập nhật lần cuối", formatDateTime(user.updatedAt)],
  ];

  return (
    <div className="um-modal-backdrop" onClick={onClose}>
      <div
        className="um-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="um-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="um-modal-header">
          <h2 id="um-modal-title">Chi tiết người dùng</h2>
          <button className="um-modal-close" onClick={onClose} aria-label="Đóng"><X size={22} aria-hidden="true" /></button>
        </header>

        {!user && !error && <p className="um-empty">Đang tải...</p>}
        {error && <p className="um-empty um-error">{error}</p>}
        {user && (
          <div className="um-detail">
            {user.avatarUrl && <img className="um-avatar" src={user.avatarUrl} alt={user.fullName} />}
            <dl>
              {rows.map(([label, value]) => (
                <div key={label} className="um-detail-row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

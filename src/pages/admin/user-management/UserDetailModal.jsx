import { useEffect, useState } from "react";
import { fetchUserById, ROLES, USER_STATUSES } from "../../../api/userApi";
import { formatDateTime } from "../../../utils/format";
import { Empty, Modal } from "../../../components/admin/ui";

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
    <Modal title="Chi tiết người dùng" onClose={onClose}>
      {!user && !error && <Empty className="py-6">Đang tải...</Empty>}
      {error && <Empty error className="py-6">{error}</Empty>}
      {user && (
        <div>
          {user.avatarUrl && <img className="mx-auto mb-12px block h-20 w-20 rounded-full object-cover" src={user.avatarUrl} alt={user.fullName} />}
          <dl className="m-0">
            {rows.map(([label, value]) => (
              <div key={label} className="flex gap-12px border-b border-line py-2 text-sm max-[560px]:flex-col max-[560px]:gap-0.5">
                <dt className="shrink-0 basis-[140px] font-normal text-subtle max-[560px]:basis-auto">{label}</dt>
                <dd className="m-0 min-w-0 flex-1 break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Modal>
  );
}

import { USER_STATUSES } from "../../../api/userApi";

// const formatId = (id) => `ND-${String(id).padStart(6, "0")}`;
const statusLabel = (v) => USER_STATUSES.find((s) => s.value === v)?.label ?? v;
const statusClass = (v) => String(v ?? "").toLowerCase();

export default function UserTable({ users, loading, error, onView, onToggleLock }) {
  return (
    <div className="um-table-wrap">
      <table className="um-table">
        <thead>
          <tr>
            <th>Mã người dùng</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={7} className="um-empty">Đang tải...</td></tr>
          )}
          {!loading && error && (
            <tr><td colSpan={7} className="um-empty um-error">{error}</td></tr>
          )}
          {!loading && !error && users.length === 0 && (
            <tr><td colSpan={7} className="um-empty">Không tìm thấy người dùng phù hợp</td></tr>
          )}
          {!loading && !error && users.map((u) => {
            const locked = u.userStatus === "LOCKED";
            return (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phoneNumber}</td>
                <td>{[...(u.roles ?? [])].join(", ")}</td>
                <td>
                  <span className={`um-status ${statusClass(u.userStatus)}`}>
                    {statusLabel(u.userStatus)}
                  </span>
                </td>
                <td className="um-actions">
                  <button onClick={() => onView(u)}>Xem</button>
                  {u.userStatus !== "DELETED" && (
                    <>
                      <span aria-hidden="true">|</span>
                      <button onClick={() => onToggleLock(u)}>
                        {locked ? "Mở khóa" : "Khóa"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

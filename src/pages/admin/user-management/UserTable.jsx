import { USER_STATUSES } from "../../../api/userApi";
import { Button, StatusBadge, Table, Td, Th } from "../../../components/admin/ui";

const statusLabel = (v) => USER_STATUSES.find((s) => s.value === v)?.label ?? v;
const STATUS_TONE = { ACTIVE: "success", INACTIVE: "pending", LOCKED: "danger", DELETED: "neutral" };

function MessageRow({ error, children }) {
  return (
    <tr>
      <Td colSpan={7} className={`py-6 text-center ${error ? "text-red-600" : "text-subtle"}`}>{children}</Td>
    </tr>
  );
}

export default function UserTable({ users, loading, error, onView, onToggleLock }) {
  return (
    <div className="min-w-0 rounded-2xl border-[1px] border-line bg-white p-2.5">
      <Table>
        <thead>
          <tr>
            <Th>Mã người dùng</Th>
            <Th>Họ tên</Th>
            <Th>Email</Th>
            <Th>Số điện thoại</Th>
            <Th>Vai trò</Th>
            <Th>Trạng thái</Th>
            <Th>Hành động</Th>
          </tr>
        </thead>
        <tbody>
          {loading && <MessageRow>Đang tải...</MessageRow>}
          {!loading && error && <MessageRow error>{error}</MessageRow>}
          {!loading && !error && users.length === 0 && <MessageRow>Không tìm thấy người dùng phù hợp</MessageRow>}
          {!loading && !error && users.map((u) => {
            const locked = u.userStatus === "LOCKED";
            return (
              <tr key={u.id}>
                <Td>{u.id}</Td>
                <Td><b>{u.name}</b></Td>
                <Td>{u.email}</Td>
                <Td>{u.phoneNumber}</Td>
                <Td>{[...(u.roles ?? [])].join(", ")}</Td>
                <Td>
                  <StatusBadge tone={STATUS_TONE[u.userStatus]} className={u.userStatus === "DELETED" ? "line-through" : ""}>
                    {statusLabel(u.userStatus)}
                  </StatusBadge>
                </Td>
                <Td nowrap>
                  <Button variant="ghost" size="sm" onClick={() => onView(u)}>Xem</Button>
                  {u.userStatus !== "DELETED" && (
                    <Button variant="ghost" size="sm" onClick={() => onToggleLock(u)}>{locked ? "Mở khóa" : "Khóa"}</Button>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

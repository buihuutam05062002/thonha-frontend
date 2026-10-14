import { useCallback, useEffect, useState } from "react";
import { fetchUsers, updateUserStatus } from "../../../api/userApi";
import { useConfirm } from "../../../components/ui/confirm/confirmContext";
import UserFilters from "./UserFilters";
import UserTable from "./UserTable";
import Pagination from "./Pagination";
import UserDetailModal from "./UserDetailModal";
import "./UserManagement.css";

const PAGE_SIZE = 20;
const EMPTY_FILTERS = { keyword: "", role: "", userStatus: "" };

export default function UserManagement({ onView }) {
  const confirm = useConfirm();
  const [filters, setFilters] = useState(EMPTY_FILTERS); // giá trị đang nhập
  const [applied, setApplied] = useState(EMPTY_FILTERS); // giá trị đã bấm Tìm kiếm
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewingId, setViewingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchUsers({ ...applied, page, size: PAGE_SIZE });
      setData({ content: res.content, totalPages: res.totalPages });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (next) => {
    setPage(0);
    setApplied(next);
  };

  const handleToggleLock = async (user) => {
    const locked = user.userStatus === "LOCKED";
    const action = locked ? "mở khóa" : "khóa";
    const ok = await confirm({
      title: `${locked ? "Mở khóa" : "Khóa"} tài khoản?`,
      message: `Bạn muốn ${action} tài khoản ${user.name}?`,
      confirmText: locked ? "Mở khóa" : "Khóa",
      danger: !locked,
    });
    if (!ok) return;
    setActionError("");
    try {
      const updated = await updateUserStatus(user.id, locked ? "ACTIVE" : "LOCKED");
      setData((d) => ({
        ...d,
        content: d.content.map((u) => (u.id === updated.id ? updated : u)),
      }));
    } catch (e) {
      setActionError(e.message);
    }
  };

  return (
    <section className="um-page">
      <header className="um-header">
        <h1>Quản lý người dùng</h1>
      </header>

      <div className="um-panel">
        <UserFilters filters={filters} onChange={setFilters} onSearch={handleSearch} />
        {actionError && (
          <div className="um-action-error" role="alert">
            {actionError}{" "}
            <button type="button" onClick={() => setActionError("")}>Đóng</button>
          </div>
        )}
        <UserTable
          users={data.content}
          loading={loading}
          error={error}
          onView={onView ?? ((u) => setViewingId(u.id))}
          onToggleLock={handleToggleLock}
        />
        <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
      </div>

      {viewingId != null && (
        <UserDetailModal userId={viewingId} onClose={() => setViewingId(null)} />
      )}
    </section>
  );
}

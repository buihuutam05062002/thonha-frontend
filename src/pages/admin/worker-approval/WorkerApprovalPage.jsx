import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  fetchWorkerProfiles, fetchWorkerProfileDetail, fetchWorkerProfileStats,
  approveWorkerProfile, rejectWorkerProfile,
} from "../../../api/workerApprovalApi";
import PendingTable from "./PendingTable";
import ProfileDetail from "./ProfileDetail";
import Pagination from "../user-management/Pagination";
import "../user-management/UserManagement.css"; // dùng chung style phân trang
import "./WorkerApprovalPage.css";

const TABS = [
  { value: "PENDING", label: "Chờ duyệt", key: "pending" },
  { value: "APPROVED", label: "Đã duyệt", key: "approved" },
  { value: "REJECTED", label: "Đã từ chối", key: "rejected" },
];

export default function WorkerApprovalPage() {
  const [status, setStatus] = useState("PENDING");
  const [keywordInput, setKeywordInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [filters, setFilters] = useState({ keyword: "", city: "" });
  const [page, setPage] = useState(0);

  const [list, setList] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  };
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const loadStats = useCallback(async () => {
    try { setStats(await fetchWorkerProfileStats()); } catch { /* số đếm không quan trọng bằng danh sách */ }
  }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await fetchWorkerProfiles({ status, ...filters, page });
      setList(res);
      setSelectedId((cur) => (res.content.some((p) => p.id === cur) ? cur : res.content[0]?.id ?? null));
    } catch (e) {
      setListError(e.message);
    } finally {
      setListLoading(false);
    }
  }, [status, filters, page]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    fetchWorkerProfileDetail(selectedId)
      .then((res) => { if (!cancelled) setDetail(res); })
      .catch((e) => { if (!cancelled) { setDetail(null); setDetailError(e.message); } })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const changeStatus = (value) => { setStatus(value); setPage(0); setSelectedId(null); };

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(0);
    setFilters({ keyword: keywordInput, city: cityInput });
  };

  const resetFilters = () => {
    setKeywordInput(""); setCityInput(""); setPage(0);
    setFilters({ keyword: "", city: "" });
  };

  const afterDecision = async (message) => {
    showNotice("success", message);
    setDetail(null);
    setSelectedId(null); // loadList sẽ tự chọn hồ sơ kế tiếp
    await Promise.all([loadList(), loadStats()]);
  };

  const handleApprove = async (id) => {
    setBusy(true);
    try {
      await approveWorkerProfile(id);
      await afterDecision("Đã duyệt hồ sơ. Thợ có thể bắt đầu nhận việc.");
      return true;
    } catch (e) {
      showNotice("error", e.message);
      loadList(); loadStats(); 
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id, reason) => {
    setBusy(true);
    try {
      await rejectWorkerProfile(id, reason);
      await afterDecision(detail?.approvalStatus === "APPROVED" ? "Đã thu hồi hồ sơ. Thợ không còn nhận việc." : "Đã từ chối hồ sơ và lưu lý do.");
      return true;
    } catch (e) {
      showNotice("error", e.message);
      loadList(); loadStats();
      return false;
    } finally {
      setBusy(false);
    }
  };

  const hasFilter = filters.keyword || filters.city;

  return (
    <section className="wa-page">
      <header className="wa-header">
        <h1>Duyệt hồ sơ thợ</h1>
        <p>{stats.pending > 0 ? `Có ${stats.pending} hồ sơ đang chờ bạn xét duyệt` : "Không còn hồ sơ nào chờ duyệt"}</p>
      </header>

      {notice && (
        <div className={`wa-notice wa-notice-${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} aria-label="Đóng thông báo"><X size={18} aria-hidden="true" /></button>
        </div>
      )}

      <div className="wa-panel">
        <div className="wa-list">
          <div className="wa-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={status === t.value}
                className={status === t.value ? "active" : ""}
                onClick={() => changeStatus(t.value)}
              >
                {t.label} <span className="wa-count">{stats[t.key]}</span>
              </button>
            ))}
          </div>

          <form className="wa-filters" onSubmit={applyFilters}>
            <div className="wa-search">
              <Search size={14} aria-hidden="true" />
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại"
                aria-label="Từ khóa"
              />
            </div>
            <input
              className="wa-city"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Tỉnh/thành"
              aria-label="Tỉnh/thành"
            />
            <button type="submit" className="wa-btn">Tìm</button>
            {(hasFilter || keywordInput || cityInput) && (
              <button type="button" className="wa-btn wa-btn-ghost" onClick={resetFilters}>Xóa lọc</button>
            )}
          </form>

          <PendingTable
            profiles={list.content}
            loading={listLoading}
            error={listError}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <Pagination page={page} totalPages={list.totalPages} onChange={(p) => { setPage(p); setSelectedId(null); }} />
        </div>

        <ProfileDetail
          profile={detail}
          loading={detailLoading}
          error={detailError}
          busy={busy}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </section>
  );
}

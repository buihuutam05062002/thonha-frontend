import { useCallback, useEffect, useState } from "react";
import { Clock, Search } from "lucide-react";
import { notify as showNotice } from "../../../utils/notify";
import {
  COMPLAINT_REASON_LABELS, complaintReasonLabel, complaintStatusLabel,
  fetchComplaint, fetchComplaints, fetchComplaintStats, resolveComplaint, takeComplaint,
} from "../../../api/complaintApi";
import { formatRelative } from "../../../utils/format";
// import , { STATUS_CLASS } from "./ComplaintDetail";
import ComplaintDetail, { STATUS_TONE } from "./ComplaintDetail";
import { Pagination } from "@/components/admin/ui";
import { StatusBadge } from "../../../components/admin/ui";


const EMPTY_PAGE = { content: [], totalPages: 0, totalElements: 0 };
const EMPTY_STATS = { PENDING: 0, PROCESSING: 0, RESOLVED: 0, REJECTED: 0, ALL: 0 };

const TABS = [
  { value: "PENDING", label: "Chờ xử lý", key: "PENDING" },
  { value: "PROCESSING", label: "Đang xử lý", key: "PROCESSING" },
  { value: "RESOLVED", label: "Đã giải quyết", key: "RESOLVED" },
  { value: "REJECTED", label: "Từ chối", key: "REJECTED" },
  { value: "", label: "Tất cả", key: "ALL" },
];

export default function ComplaintPage() {
  const [status, setStatus] = useState("PENDING");
  const [keywordInput, setKeywordInput] = useState("");
  const [filters, setFilters] = useState({ keyword: "", reason: "" });
  const [page, setPage] = useState(0);

  const [list, setList] = useState(EMPTY_PAGE);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [stats, setStats] = useState(EMPTY_STATS);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [reloadKey, setReloadKey] = useState(0); // tăng lên để tải lại danh sách, số đếm và chi tiết sau khi xử lý

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const onChanged = (e) => {
      if (e.detail?.type === "COMPLAINT_CREATED") showNotice("success", e.detail.message || "Có khiếu nại mới.");
      reload();
    };
    window.addEventListener("complaints:changed", onChanged);
    return () => window.removeEventListener("complaints:changed", onChanged);
  }, [reload]);

  // danh sách
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError("");
    fetchComplaints({ status, reason: filters.reason, keyword: filters.keyword, page })
      .then((res) => { if (!cancelled) setList(res); })
      .catch((e) => { if (!cancelled) { setList(EMPTY_PAGE); setListError(e.message); } })
      .finally(() => { if (!cancelled) setListLoading(false); });
    return () => { cancelled = true; };
  }, [status, filters, page, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    fetchComplaintStats()
      .then((res) => {
        if (cancelled) return;
        const next = { ...EMPTY_STATS, ...res };
        setStats(next);
        window.dispatchEvent(new CustomEvent("complaints:stats", { detail: next }));
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [reloadKey]);

 
  useEffect(() => {
    if (selectedId == null && list.content.length > 0) setSelectedId(list.content[0].id);
  }, [list, selectedId]);

  useEffect(() => {
    if (selectedId == null) { setDetail(null); return undefined; }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    fetchComplaint(selectedId)
      .then((res) => { if (!cancelled) setDetail(res); })
      .catch((e) => { if (!cancelled) { setDetail(null); setDetailError(e.message); } })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId, reloadKey]);

  const resetSelection = () => {
    setSelectedId(null);
    setDetail(null);
    setList(EMPTY_PAGE);

  const changeStatus = (value) => {
    if (value === status) return;
    resetSelection();
    setPage(0);
    setStatus(value);
  };

  const applyFilters = (e) => {
    e.preventDefault();
    resetSelection();
    setPage(0);
    setFilters((f) => ({ ...f, keyword: keywordInput }));
  };

  const changeReason = (reason) => {
    resetSelection();
    setPage(0);
    setFilters((f) => ({ ...f, reason }));
  };

  const resetFilters = () => {
    resetSelection();
    setKeywordInput("");
    setPage(0);
    setFilters({ keyword: "", reason: "" });
  };

  const handleTake = async () => {
    try {
      await takeComplaint(selectedId);
    } catch (e) {
      reload();
      throw e;
    }
    showNotice("success", `Đã nhận xử lý khiếu nại #${selectedId}.`);
    reload();
  };

  const handleResolve = async (payload) => {
    try {
      await resolveComplaint(selectedId, payload);
    } catch (e) {
      reload();
      throw e;
    }
    showNotice("success", `Đã kết luận khiếu nại #${selectedId}.`);
    reload();
  };

  const hasFilter = filters.keyword || filters.reason;
  const shownDetail = detail?.complaint?.id === selectedId ? detail : null;

  return (
    <section className="wa-page">
      <header className="wa-header">
        <h1>Khiếu nại</h1>
        <p>Tiếp nhận và xử lý khiếu nại, tranh chấp giữa khách và thợ</p>
      </header>

      <div className="wa-panel">
        <div className="wa-list">
          <div className="wa-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={status === t.value}
                className={status === t.value ? "active" : ""}
                onClick={() => changeStatus(t.value)}
              >
                {t.label} <span className="wa-count">{stats[t.key] ?? 0}</span>
              </button>
            ))}
          </div>

          <form className="wa-filters" onSubmit={applyFilters}>
            <div className="wa-search">
              <Search size={14} aria-hidden="true" />
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Mã đơn, tên hoặc SĐT người gửi"
                aria-label="Từ khóa"
              />
            </div>
            <select
              className="cp-select"
              value={filters.reason}
              onChange={(e) => changeReason(e.target.value)}
              aria-label="Lý do khiếu nại"
            >
              <option value="">Mọi lý do</option>
              {Object.entries(COMPLAINT_REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button type="submit" className="wa-btn">Tìm</button>
            {(hasFilter || keywordInput) && (
              <button type="button" className="wa-btn wa-btn-ghost" onClick={resetFilters}>Xóa lọc</button>
            )}
          </form>

          <ComplaintList
            items={list.content}
            loading={listLoading}
            error={listError}
            selectedId={selectedId}
            onSelect={(id) => { if (id !== selectedId) { setDetail(null); setSelectedId(id); } }}
          />

          <Pagination page={page} totalPages={list.totalPages} onChange={(p) => { setPage(p); resetSelection(); }} />
        </div>

        <ComplaintDetail
          key={selectedId ?? "none"}
          data={shownDetail}
          loading={detailLoading}
          error={detailError}
          onTake={handleTake}
          onResolve={handleResolve}
        />
      </div>
    </section>
  );
}

function ComplaintList({ items, loading, error, selectedId, onSelect }) {
  if (loading && items.length === 0) {
    return (
      <ul className="wa-cards" aria-busy="true">
        {[0, 1, 2, 3].map((i) => <li key={i} className="wa-card wa-skeleton" />)}
      </ul>
    );
  }
  if (error) return <p className="wa-empty wa-error" role="alert">{error}</p>;
  if (items.length === 0) return <p className="wa-empty">Không có khiếu nại nào phù hợp</p>;

  return (
    <ul className={`wa-cards ${loading ? "is-loading" : ""}`}>
      {items.map((c) => {
        const active = c.id === selectedId;
        return (
          <li key={c.id}>
            <button
              type="button"
              className={`wa-card ${active ? "active" : ""}`}
              onClick={() => onSelect(c.id)}
              aria-current={active ? "true" : undefined}
            >
              <div className="wa-card-body">
                <div className="cp-card-top">
                  <strong className="wa-card-name">#{c.id} | {c.requestCode}</strong>
                  <StatusBadge tone={STATUS_TONE[c.status]}>{complaintStatusLabel(c)}</StatusBadge>                </div>
                <span className="cp-reason">{complaintReasonLabel(c)}</span>
                <p className="cp-card-desc">{c.description}</p>
                <div className="wa-meta">
                  <span>{c.complainantRole === "WORKER" ? "Thợ" : "Khách"}: {c.complainantName}</span>
                  <span><Clock size={12} /> {formatRelative(c.createdAt)}</span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}}
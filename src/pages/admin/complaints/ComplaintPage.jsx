import { useCallback, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { notify as showNotice } from "../../../utils/notify";
import {
  COMPLAINT_REASON_LABELS, complaintReasonLabel, complaintStatusLabel,
  fetchComplaint, fetchComplaints, fetchComplaintStats, resolveComplaint, takeComplaint,
} from "../../../api/complaintApi";
import { formatRelative } from "../../../utils/format";
import ComplaintDetail, { STATUS_TONE } from "./ComplaintDetail";
import {
  Button, Empty, FilterBar, ListCard, ListCardSkeleton, ListCards, ListPane, PageShell,
  Pagination, PillSelect, SearchBox, SplitPanel, StatusBadge, Tabs,
} from "../../../components/admin/ui";

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

  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const onChanged = (e) => {
      if (e.detail?.type === "COMPLAINT_CREATED") showNotice("success", e.detail.message || "Có khiếu nại mới.");
      reload();
    };
    window.addEventListener("complaints:changed", onChanged);
    return () => window.removeEventListener("complaints:changed", onChanged);
  }, [reload]);

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
  };

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
  const tabItems = TABS.map((t) => ({ value: t.value, key: t.key, label: t.label, count: stats[t.key] ?? 0 }));

  return (
    <PageShell
      title="Khiếu nại"
      subtitle={stats.PENDING > 0 ? `Có ${stats.PENDING} khiếu nại đang chờ xử lý` : "Tiếp nhận và xử lý khiếu nại, tranh chấp giữa khách và thợ"}
    >
      <SplitPanel>
        <ListPane>
          <Tabs items={tabItems} value={status} onChange={changeStatus} label="Trạng thái khiếu nại" />

          <FilterBar onSubmit={applyFilters}>
            <SearchBox
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Mã đơn, tên hoặc SĐT người gửi"
              aria-label="Từ khóa"
            />
            <PillSelect value={filters.reason} onChange={(e) => changeReason(e.target.value)} aria-label="Lý do khiếu nại">
              <option value="">Mọi lý do</option>
              {Object.entries(COMPLAINT_REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </PillSelect>
            <Button type="submit">Tìm</Button>
            {(hasFilter || keywordInput) && <Button variant="ghost" className="underline" onClick={resetFilters}>Xóa lọc</Button>}
          </FilterBar>

          <ComplaintList
            items={list.content}
            loading={listLoading}
            error={listError}
            selectedId={selectedId}
            onSelect={(id) => { if (id !== selectedId) { setDetail(null); setSelectedId(id); } }}
          />

          <Pagination page={page} totalPages={list.totalPages} onChange={(p) => { setPage(p); resetSelection(); }} />
        </ListPane>

        <ComplaintDetail
          key={selectedId ?? "none"}
          data={shownDetail}
          loading={detailLoading}
          error={detailError}
          onTake={handleTake}
          onResolve={handleResolve}
        />
      </SplitPanel>
    </PageShell>
  );
}

function ComplaintList({ items, loading, error, selectedId, onSelect }) {
  if (loading && items.length === 0) return <ListCardSkeleton />;
  if (error) return <Empty error>{error}</Empty>;
  if (items.length === 0) return <Empty>Không có khiếu nại nào phù hợp</Empty>;

  return (
    <ListCards loading={loading}>
      {items.map((c) => (
        <ListCard key={c.id} active={c.id === selectedId} onClick={() => onSelect(c.id)}>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <strong className="min-w-0 truncate text-sm text-ink">#{c.id} | {c.requestCode}</strong>
              <StatusBadge tone={STATUS_TONE[c.status]}>{complaintStatusLabel(c)}</StatusBadge>
            </div>
            <span className="text-xs font-semibold text-brand-dark">{complaintReasonLabel(c)}</span>
            <p className="m-0 line-clamp-2 text-[13px] text-ink">{c.description}</p>
            <div className="flex flex-wrap gap-x-12px gap-y-1 text-[11.5px] text-subtle">
              <span>{c.complainantRole === "WORKER" ? "Thợ" : "Khách"}: {c.complainantName}</span>
              <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" /> {formatRelative(c.createdAt)}</span>
            </div>
          </div>
        </ListCard>
      ))}
    </ListCards>
  );
}
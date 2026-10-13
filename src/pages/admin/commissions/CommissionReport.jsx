import { useEffect, useState } from "react";
import { fetchCommissionSettlements, fetchCommissionSummary, PAYMENT_METHODS } from "../../../api/commissionApi";
import { formatDateTime, formatPercent, formatVnd, toIsoDate } from "../../../utils/format";
import Pagination from "../user-management/Pagination";

const PAGE_SIZE = 10;
const EMPTY_PAGE = { content: [], totalPages: 0, totalElements: 0 };
const EMPTY_SUMMARY = { orders: 0, grossAmount: 0, commissionAmount: 0, workerAmount: 0 };

const startOfToday = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const PRESETS = [
  { key: "today", label: "Hôm nay", range: () => { const t = toIsoDate(startOfToday()); return { from: t, to: t }; } },
  { key: "7d", label: "7 ngày qua", range: () => ({ from: toIsoDate(addDays(startOfToday(), -6)), to: toIsoDate(startOfToday()) }) },
  {
    key: "month", label: "Tháng này",
    range: () => { const t = startOfToday(); return { from: toIsoDate(new Date(t.getFullYear(), t.getMonth(), 1)), to: toIsoDate(t) }; },
  },
  {
    key: "lastMonth", label: "Tháng trước",
    range: () => {
      const t = startOfToday();
      return { from: toIsoDate(new Date(t.getFullYear(), t.getMonth() - 1, 1)), to: toIsoDate(new Date(t.getFullYear(), t.getMonth(), 0)) };
    },
  },
  { key: "all", label: "Tất cả", range: () => ({ from: "", to: "" }) },
];

export default function CommissionReport() {
  const [presetKey, setPresetKey] = useState("month");
  const [input, setInput] = useState(() => PRESETS[2].range());
  const [applied, setApplied] = useState(() => PRESETS[2].range());
  const [rangeError, setRangeError] = useState("");
  const [page, setPage] = useState(0);

  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [rows, setRows] = useState(EMPTY_PAGE);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError("");
    fetchCommissionSummary(applied)
      .then((res) => { if (!cancelled) setSummary(res); })
      .catch((e) => { if (!cancelled) { setSummary(EMPTY_SUMMARY); setSummaryError(e.message); } })
      .finally(() => { if (!cancelled) setSummaryLoading(false); });
    return () => { cancelled = true; };
  }, [applied]);

  useEffect(() => {
    let cancelled = false;
    setRowsLoading(true);
    setRowsError("");
    fetchCommissionSettlements({ ...applied, page, size: PAGE_SIZE })
      .then((res) => { if (!cancelled) setRows(res); })
      .catch((e) => { if (!cancelled) { setRows(EMPTY_PAGE); setRowsError(e.message); } })
      .finally(() => { if (!cancelled) setRowsLoading(false); });
    return () => { cancelled = true; };
  }, [applied, page]);

  const applyPreset = (p) => {
    const range = p.range();
    setPresetKey(p.key);
    setInput(range);
    setApplied(range);
    setRangeError("");
    setPage(0);
  };

  const applyCustom = (e) => {
    e.preventDefault();
    if (input.from && input.to && input.from > input.to) {
      setRangeError("'Từ ngày' không được sau 'Đến ngày'");
      return;
    }
    setRangeError("");
    setPresetKey("custom");
    setApplied({ from: input.from, to: input.to });
    setPage(0);
  };

  const effectiveRate = Number(summary.grossAmount) > 0
    ? (Number(summary.commissionAmount) / Number(summary.grossAmount)) * 100
    : null;

  return (
    <>
      <div className="cm-card">
        <div className="cm-presets">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`cm-pill ${presetKey === p.key ? "active" : ""}`}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <form className="cm-range" onSubmit={applyCustom} noValidate>
          <label>
            Từ ngày
            <input type="date" value={input.from} max={input.to || undefined} onChange={(e) => setInput({ ...input, from: e.target.value })} />
          </label>
          <label>
            Đến ngày
            <input type="date" value={input.to} min={input.from || undefined} onChange={(e) => setInput({ ...input, to: e.target.value })} />
          </label>
          <button type="submit" className="wa-btn">Áp dụng</button>
        </form>
        {rangeError && <p className="cm-error" role="alert">{rangeError}</p>}
      </div>

      {summaryError ? (
        <p className="cm-card wa-empty wa-error" role="alert">{summaryError}</p>
      ) : (
        <div className={`cm-stats ${summaryLoading ? "is-loading" : ""}`} aria-busy={summaryLoading}>
          <StatCard label="Đơn hoàn thành" value={Number(summary.orders).toLocaleString("vi-VN")} />
          <StatCard label="Tổng doanh thu" value={formatVnd(summary.grossAmount)} />
          <StatCard
            label="Hoa hồng thu được" value={formatVnd(summary.commissionAmount)} highlight
            sub={effectiveRate != null ? `Bình quân ${formatPercent(effectiveRate)} doanh thu` : null}
          />
          <StatCard label="Thợ nhận" value={formatVnd(summary.workerAmount)} />
        </div>
      )}

      <div className="cm-card">
        <h2 className="cm-title">Chi tiết các đơn đã chốt</h2>
        <SettlementTable rows={rows.content} loading={rowsLoading} error={rowsError} />
        <Pagination page={page} totalPages={rows.totalPages} onChange={setPage} />
        {rows.totalElements > 0 && <p className="cm-count">Tổng cộng {rows.totalElements.toLocaleString("vi-VN")} đơn</p>}
      </div>
    </>
  );
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`cm-stat ${highlight ? "cm-stat-hl" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function SettlementTable({ rows, loading, error }) {
  if (loading && rows.length === 0) {
    return <div className="cm-skeleton" aria-busy="true" />;
  }
  if (error) return <p className="wa-empty wa-error" role="alert">{error}</p>;
  if (rows.length === 0) return <p className="wa-empty">Chưa có đơn nào được chốt trong khoảng thời gian này</p>;

  return (
    <div className={`cm-table-wrap ${loading ? "is-loading" : ""}`}>
      <table className="cm-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Thợ</th>
            <th className="num">Giá trị đơn</th>
            <th className="num">Tỷ lệ</th>
            <th className="num">Hoa hồng</th>
            <th className="num">Thợ nhận</th>
            <th>Thanh toán</th>
            <th>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><b>{r.requestCode || `#${r.requestId}`}</b></td>
              <td>{r.workerName || "-"}</td>
              <td className="num">{formatVnd(r.amount)}</td>
              <td className="num">{formatPercent(r.commissionRate)}</td>
              <td className="num cm-comm">{formatVnd(r.commissionAmount)}</td>
              <td className="num">{formatVnd(r.workerAmount)}</td>
              <td>{PAYMENT_METHODS[r.paymentMethod] ?? r.paymentMethod}</td>
              <td className="nowrap">{formatDateTime(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useEffect, useState } from "react";
import { fetchAdminStatistics } from "../../../api/statisticsApi";
import { formatPercent, formatVnd, toIsoDate } from "../../../utils/format";
import "../worker-approval/WorkerApprovalPage.css"; 
import "../commissions/Commission.css"; 
import "./Statistics.css";

const MAX_DAYS = 366;

const startOfToday = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const daysBetween = (from, to) => Math.round((new Date(to) - new Date(from)) / 86400000) + 1;

const PRESETS = [
  { key: "7d", label: "7 ngày qua", range: () => ({ from: toIsoDate(addDays(startOfToday(), -6)), to: toIsoDate(startOfToday()) }) },
  { key: "30d", label: "30 ngày qua", range: () => ({ from: toIsoDate(addDays(startOfToday(), -29)), to: toIsoDate(startOfToday()) }) },
  { key: "90d", label: "90 ngày qua", range: () => ({ from: toIsoDate(addDays(startOfToday(), -89)), to: toIsoDate(startOfToday()) }) },
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
];

const STATUS_LABELS = {
  PENDING_MATCH: "Chờ ghép thợ",
  MATCHING: "Đang ghép thợ",
  MATCHED: "Đã ghép thợ",
  ON_THE_WAY: "Đang di chuyển",
  IN_PROGRESS: "Đang sửa chữa",
  COMPLETED: "Hoàn thành",
  NOT_FOUND: "Không tìm thấy thợ",
  CANCELLED: "Đã hủy",
};

const COMPLAINT_LABELS = [
  { key: "PENDING", label: "Chờ xử lý" },
  { key: "PROCESSING", label: "Đang xử lý" },
  { key: "RESOLVED", label: "Đã giải quyết" },
  { key: "REJECTED", label: "Từ chối" },
];

const num = (v) => Number(v || 0).toLocaleString("vi-VN");
const shortDate = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };

/** Trang Thống kê của admin: số liệu tổng hợp theo khoảng ngày, biểu đồ theo ngày, top danh mục / thợ. */
export default function StatisticsPage() {
  const [presetKey, setPresetKey] = useState("30d");
  const [input, setInput] = useState(() => PRESETS[1].range());
  const [applied, setApplied] = useState(() => PRESETS[1].range());
  const [rangeError, setRangeError] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchAdminStatistics(applied)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) { setData(null); setError(e.message); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [applied]);

  const applyPreset = (p) => {
    const range = p.range();
    setPresetKey(p.key);
    setInput(range);
    setApplied(range);
    setRangeError("");
  };

  const applyCustom = (e) => {
    e.preventDefault();
    if (!input.from || !input.to) {
      setRangeError("Vui lòng chọn đủ 'Từ ngày' và 'Đến ngày'");
      return;
    }
    if (input.from > input.to) {
      setRangeError("'Từ ngày' không được sau 'Đến ngày'");
      return;
    }
    if (daysBetween(input.from, input.to) > MAX_DAYS) {
      setRangeError(`Khoảng ngày tối đa là ${MAX_DAYS} ngày`);
      return;
    }
    setRangeError("");
    setPresetKey("custom");
    setApplied({ from: input.from, to: input.to });
  };

  return (
    <section className="wa-page">
      <header className="wa-header">
        <h1>Thống kê</h1>
        <p>Theo dõi người dùng, yêu cầu sửa chữa, doanh thu và khiếu nại của hệ thống</p>
      </header>

      <div className="cm-panel">
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

        {error && <p className="cm-card wa-empty wa-error" role="alert">{error}</p>}
        {!error && !data && loading && <div className="cm-skeleton" aria-busy="true" />}
        {!error && data && <Content data={data} loading={loading} />}
      </div>
    </section>
  );
}

function Content({ data, loading }) {
  const { users, requests, revenue, complaints, reviews, daily, topCategories, topWorkers } = data;
  const effectiveRate = Number(revenue.grossAmount) > 0
    ? (Number(revenue.commissionAmount) / Number(revenue.grossAmount)) * 100
    : null;
  const statusRows = Object.entries(requests.byStatus)
    .map(([key, count]) => ({ key, label: STATUS_LABELS[key] ?? key, count }))
    .filter((r) => r.count > 0);

  return (
    <div className={`st-content ${loading ? "is-loading" : ""}`} aria-busy={loading}>
      <div className="cm-stats">
        <StatCard label="Tổng doanh thu" value={formatVnd(revenue.grossAmount)} sub={`${num(revenue.orders)} đơn đã chốt`} />
        <StatCard
          label="Hoa hồng thu được" value={formatVnd(revenue.commissionAmount)} highlight
          sub={effectiveRate != null ? `Bình quân ${formatPercent(effectiveRate)} doanh thu` : null}
        />
        <StatCard label="Yêu cầu sửa chữa" value={num(requests.total)} sub={`Hoàn thành ${formatPercent(requests.completionRate)}`} />
        <StatCard
          label="Đánh giá trung bình"
          value={reviews.count > 0 ? `${reviews.averageRating.toFixed(2)} / 5` : "-"}
          sub={`${num(reviews.count)} lượt đánh giá`}
        />
      </div>

      <div className="cm-stats">
        <StatCard label="Khách hàng" value={num(users.totalCustomers)} sub={`+${num(users.newCustomers)} mới trong kỳ`} />
        <StatCard label="Thợ đã duyệt" value={num(users.approvedWorkers)} sub={`+${num(users.newWorkerProfiles)} hồ sơ mới trong kỳ`} />
        <StatCard label="Hồ sơ thợ chờ duyệt" value={num(users.pendingWorkerProfiles)} />
        <StatCard label="Khiếu nại chờ xử lý" value={num(complaints.PENDING)} sub={`${num(complaints.ALL)} khiếu nại tổng cộng`} />
      </div>

      <div className="cm-card">
        <h2 className="cm-title">Yêu cầu sửa chữa theo ngày</h2>
        <p className="cm-sub">Số yêu cầu mới tạo mỗi ngày</p>
        <BarChart days={daily} valueOf={(d) => d.requests} format={num} unit="yêu cầu" />
      </div>

      <div className="cm-card">
        <h2 className="cm-title">Doanh thu theo ngày</h2>
        <p className="cm-sub">Doanh thu của các đơn đã chốt, tính theo ngày chốt</p>
        <BarChart days={daily} valueOf={(d) => Number(d.grossAmount)} format={formatVnd} unit="" />
      </div>

      <div className="st-grid">
        <div className="cm-card">
          <h2 className="cm-title">Yêu cầu theo trạng thái</h2>
          <HBars rows={statusRows} empty="Chưa có yêu cầu nào trong kỳ" />
        </div>
        <div className="cm-card">
          <h2 className="cm-title">Danh mục được đặt nhiều nhất</h2>
          <HBars
            rows={topCategories.map((c) => ({ key: c.name, label: c.name, count: c.count }))}
            empty="Chưa có yêu cầu nào trong kỳ"
          />
        </div>
        <div className="cm-card">
          <h2 className="cm-title">Khiếu nại theo trạng thái</h2>
          <p className="cm-sub">Toàn hệ thống, không phụ thuộc khoảng ngày</p>
          <HBars
            rows={COMPLAINT_LABELS.map((c) => ({ key: c.key, label: c.label, count: complaints[c.key] ?? 0 }))}
            empty="Chưa có khiếu nại nào"
          />
        </div>
      </div>

      <div className="cm-card">
        <h2 className="cm-title">Thợ có doanh thu cao nhất</h2>
        {topWorkers.length === 0 ? (
          <p className="wa-empty">Chưa có đơn nào được chốt trong khoảng thời gian này</p>
        ) : (
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Thợ</th>
                  <th className="num">Số đơn</th>
                  <th className="num">Doanh thu</th>
                  <th className="num">Hoa hồng</th>
                </tr>
              </thead>
              <tbody>
                {topWorkers.map((w, i) => (
                  <tr key={w.workerId}>
                    <td>{i + 1}</td>
                    <td><b>{w.fullName}</b></td>
                    <td className="num">{num(w.orders)}</td>
                    <td className="num">{formatVnd(w.grossAmount)}</td>
                    <td className="num cm-comm">{formatVnd(w.commissionAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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

function BarChart({ days, valueOf, format, unit }) {
  const max = Math.max(0, ...days.map(valueOf));
  if (max === 0) return <p className="wa-empty">Chưa có số liệu trong khoảng thời gian này</p>;
  const mid = days[Math.floor((days.length - 1) / 2)];
  return (
    <div className="st-chart">
      <div className="st-bars" role="img" aria-label="Biểu đồ cột theo ngày">
        {days.map((d) => {
          const v = valueOf(d);
          return (
            <div
              key={d.date}
              className="st-bar-col"
              title={`${shortDate(d.date)}: ${format(v)}${unit ? ` ${unit}` : ""}`}
            >
              <span className="st-bar" style={{ height: `${(v / max) * 100}%` }} />
            </div>
          );
        })}
      </div>
      <div className="st-axis">
        <span>{shortDate(days[0].date)}</span>
        {days.length > 2 && <span>{shortDate(mid.date)}</span>}
        <span>{shortDate(days[days.length - 1].date)}</span>
      </div>
      <p className="cm-muted">Cao nhất: {format(max)}{unit ? ` ${unit}` : ""} / ngày</p>
    </div>
  );
}

function HBars({ rows, empty }) {
  const max = Math.max(0, ...rows.map((r) => r.count));
  if (max === 0) return <p className="wa-empty">{empty}</p>;
  return (
    <ul className="st-hbars">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="st-hbar-head">
            <span>{r.label}</span>
            <b>{num(r.count)}</b>
          </div>
          <div className="st-hbar-track">
            <span style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

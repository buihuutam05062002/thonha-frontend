import { useEffect, useState } from "react";
import { fetchAdminStatistics } from "../../../api/statisticsApi";
import { formatPercent, formatVnd, toIsoDate } from "../../../utils/format";
import {
  Card, DateRangeFilter, Empty, PageShell, Skeleton, StatCard, StatGrid, Table, Td, Th, cn,
} from "../../../components/admin/ui";

const MAX_DAYS = 366;

const startOfToday = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

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
  const [applied, setApplied] = useState(() => PRESETS[1].range()); // khớp nút "30 ngày qua"
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

  return (
    <PageShell title="Thống kê" subtitle="Theo dõi người dùng, yêu cầu sửa chữa, doanh thu và khiếu nại của hệ thống">
      <DateRangeFilter presets={PRESETS} initialKey="30d" requireRange maxDays={MAX_DAYS} onApply={setApplied} />

      {error && <Card><Empty error>{error}</Empty></Card>}
      {!error && !data && loading && <Skeleton />}
      {!error && data && <Content data={data} loading={loading} />}
    </PageShell>
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
    <div className={cn("flex min-w-0 flex-col gap-16px transition-opacity", loading && "opacity-60")} aria-busy={loading}>
      <StatGrid>
        <StatCard label="Tổng doanh thu" value={formatVnd(revenue.grossAmount)} sub={`${num(revenue.orders)} đơn đã chốt`} />
        <StatCard
          highlight label="Hoa hồng thu được" value={formatVnd(revenue.commissionAmount)}
          sub={effectiveRate != null ? `Bình quân ${formatPercent(effectiveRate)} doanh thu` : null}
        />
        <StatCard label="Yêu cầu sửa chữa" value={num(requests.total)} sub={`Hoàn thành ${formatPercent(requests.completionRate)}`} />
        <StatCard
          label="Đánh giá trung bình"
          value={reviews.count > 0 ? `${reviews.averageRating.toFixed(2)} / 5` : "-"}
          sub={`${num(reviews.count)} lượt đánh giá`}
        />
      </StatGrid>

      <StatGrid>
        <StatCard label="Khách hàng" value={num(users.totalCustomers)} sub={`+${num(users.newCustomers)} mới trong kỳ`} />
        <StatCard label="Thợ đã duyệt" value={num(users.approvedWorkers)} sub={`+${num(users.newWorkerProfiles)} hồ sơ mới trong kỳ`} />
        <StatCard label="Hồ sơ thợ chờ duyệt" value={num(users.pendingWorkerProfiles)} />
        <StatCard label="Khiếu nại chờ xử lý" value={num(complaints.PENDING)} sub={`${num(complaints.ALL)} khiếu nại tổng cộng`} />
      </StatGrid>

      <Card title="Yêu cầu sửa chữa theo ngày" subtitle="Số yêu cầu mới tạo mỗi ngày">
        <BarChart days={daily} valueOf={(d) => d.requests} format={num} unit="yêu cầu" />
      </Card>

      <Card title="Doanh thu theo ngày" subtitle="Doanh thu của các đơn đã chốt, tính theo ngày chốt">
        <BarChart days={daily} valueOf={(d) => Number(d.grossAmount)} format={formatVnd} unit="" />
      </Card>

      <div className="grid grid-cols-3 gap-12px max-[1100px]:grid-cols-1">
        <Card title="Yêu cầu theo trạng thái">
          <HBars rows={statusRows} empty="Chưa có yêu cầu nào trong kỳ" />
        </Card>
        <Card title="Danh mục được đặt nhiều nhất">
          <HBars
            rows={topCategories.map((c) => ({ key: c.name, label: c.name, count: c.count }))}
            empty="Chưa có yêu cầu nào trong kỳ"
          />
        </Card>
        <Card title="Khiếu nại theo trạng thái" subtitle="Toàn hệ thống, không phụ thuộc khoảng ngày">
          <HBars
            rows={COMPLAINT_LABELS.map((c) => ({ key: c.key, label: c.label, count: complaints[c.key] ?? 0 }))}
            empty="Chưa có khiếu nại nào"
          />
        </Card>
      </div>

      <Card title="Thợ có doanh thu cao nhất">
        {topWorkers.length === 0 ? (
          <Empty>Chưa có đơn nào được chốt trong khoảng thời gian này</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Thợ</Th>
                <Th num>Số đơn</Th>
                <Th num>Doanh thu</Th>
                <Th num>Hoa hồng</Th>
              </tr>
            </thead>
            <tbody>
              {topWorkers.map((w, i) => (
                <tr key={w.workerId}>
                  <Td>{i + 1}</Td>
                  <Td><b>{w.fullName}</b></Td>
                  <Td num>{num(w.orders)}</Td>
                  <Td num>{formatVnd(w.grossAmount)}</Td>
                  <Td num className="font-bold text-brand-dark">{formatVnd(w.commissionAmount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

/** Biểu đồ cột theo ngày bằng CSS thuần (không thêm thư viện). Di chuột / chạm vào cột để xem số liệu. */
function BarChart({ days, valueOf, format, unit }) {
  const max = Math.max(0, ...days.map(valueOf));
  if (max === 0) return <Empty>Chưa có số liệu trong khoảng thời gian này</Empty>;
  const mid = days[Math.floor((days.length - 1) / 2)];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-40 items-end gap-0.5 border-b border-line" role="img" aria-label="Biểu đồ cột theo ngày">
        {days.map((d) => {
          const v = valueOf(d);
          return (
            <div
              key={d.date}
              className="group flex h-full min-w-[2px] flex-[1_1_0] items-end"
              title={`${shortDate(d.date)}: ${format(v)}${unit ? ` ${unit}` : ""}`}
            >
              <span className="block min-h-0.5 w-full rounded-t-[3px] bg-brand/70 transition-colors group-hover:bg-brand" style={{ height: `${(v / max) * 100}%` }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11.5px] text-subtle">
        <span>{shortDate(days[0].date)}</span>
        {days.length > 2 && <span>{shortDate(mid.date)}</span>}
        <span>{shortDate(days[days.length - 1].date)}</span>
      </div>
      <p className="m-0 text-xs text-subtle">Cao nhất: {format(max)}{unit ? ` ${unit}` : ""} / ngày</p>
    </div>
  );
}

/** Thanh ngang so sánh số lượng giữa các nhóm. */
function HBars({ rows, empty }) {
  const max = Math.max(0, ...rows.map((r) => r.count));
  if (max === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex justify-between gap-2 text-[13px]">
            <span className="min-w-0 break-words">{r.label}</span>
            <b>{num(r.count)}</b>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-brand" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

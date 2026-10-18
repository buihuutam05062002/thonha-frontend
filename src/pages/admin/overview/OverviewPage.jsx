import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { fetchAdminStatistics } from "../../../api/statisticsApi";
import { formatPercent, formatVnd, toIsoDate } from "../../../utils/format";
import { Button, Card, PageShell, Skeleton, StatCard, StatGrid, cn } from "../../../components/admin/ui";

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const num = (v) => Number(v || 0).toLocaleString("vi-VN");
const shortDate = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };

export default function OverviewPage() {
  const [today, setToday] = useState(null);
  const [week, setWeek] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const t = toIsoDate(now);
    setLoading(true);
    setError("");
    Promise.all([
      fetchAdminStatistics({ from: t, to: t }),
      fetchAdminStatistics({ from: toIsoDate(addDays(now, -6)), to: t }),
    ])
      .then(([a, b]) => { if (!cancelled) { setToday(a); setWeek(b); } })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return (
    <PageShell title="Tổng quan" subtitle="Tình hình hoạt động của hệ thống hôm nay và 7 ngày gần nhất">
      {error && (
        <Card role="alert" className="py-10 text-center text-sm text-red-600">
          {error}{" "}
          <Button variant="ghost" onClick={() => setReloadKey((k) => k + 1)}>Thử lại</Button>
        </Card>
      )}
      {!error && loading && !week && <Skeleton />}
      {!error && today && week && <Content today={today} week={week} />}
    </PageShell>
  );
}

function Content({ today, week }) {
  const { users, complaints } = week;
  const todos = [
    { label: "Hồ sơ thợ chờ duyệt", count: users.pendingWorkerProfiles, to: "/admin/profiles" },
    { label: "Khiếu nại chờ xử lý", count: complaints.PENDING ?? 0, to: "/admin/complaints" },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-16px">
      <StatGrid>
        <StatCard label="Yêu cầu mới hôm nay" value={num(today.requests.total)} sub={`${num(today.requests.completed)} đã hoàn thành`} />
        <StatCard label="Doanh thu hôm nay" value={formatVnd(today.revenue.grossAmount)} sub={`${num(today.revenue.orders)} đơn đã chốt`} />
        <StatCard highlight label="Hoa hồng hôm nay" value={formatVnd(today.revenue.commissionAmount)} />
        <StatCard label="Khách hàng mới hôm nay" value={num(today.users.newCustomers)} sub={`${num(today.users.totalCustomers)} khách hàng tổng cộng`} />
      </StatGrid>

      <Card title="Cần xử lý">
        <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 max-[560px]:grid-cols-1">
          {todos.map((t) => (
            <li key={t.to}>
              <Link
                to={t.to}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-3.5 py-3.5 no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  t.count > 0
                    ? "bg-brand-soft text-brand-dark hover:bg-brand-line/60 hover:text-brand-dark"
                    : "bg-slate-100 text-subtle hover:bg-slate-200 hover:text-subtle",
                )}
              >
                <strong className="min-w-7 text-[22px]">{num(t.count)}</strong>
                <span className="flex-1 text-[13px]">{t.label}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <StatGrid>
        <StatCard label="Yêu cầu 7 ngày qua" value={num(week.requests.total)} sub={`Hoàn thành ${formatPercent(week.requests.completionRate)}`} />
        <StatCard label="Doanh thu 7 ngày qua" value={formatVnd(week.revenue.grossAmount)} sub={`${num(week.revenue.orders)} đơn đã chốt`} />
        <StatCard label="Thợ đã duyệt" value={num(users.approvedWorkers)} sub={`+${num(users.newWorkerProfiles)} hồ sơ mới trong 7 ngày`} />
        <StatCard
          label="Đánh giá trung bình"
          value={week.reviews.count > 0 ? `${week.reviews.averageRating.toFixed(2)} / 5` : "-"}
          sub={`${num(week.reviews.count)} lượt đánh giá`}
        />
      </StatGrid>

      <Card title="Yêu cầu mới 7 ngày qua">
        <WeekBars days={week.daily} />
      </Card>

      <div className="grid grid-cols-2 gap-3.5 max-[1100px]:grid-cols-1">
        <Card title="Danh mục được đặt nhiều nhất">
          <TopCategories rows={week.topCategories} />
          <MoreLink to="/admin/categories">Quản lý danh mục</MoreLink>
        </Card>
        <Card title="Thợ có doanh thu cao nhất">
          {week.topWorkers.length === 0 ? (
            <Empty>Chưa có đơn nào được chốt trong 7 ngày qua</Empty>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {week.topWorkers.map((w, i) => (
                <li key={w.workerId} className="flex justify-between gap-2 text-[13px]">
                  <span>{i + 1}. <b>{w.fullName}</b></span>
                  <span className="font-bold text-brand-dark">{formatVnd(w.grossAmount)}</span>
                </li>
              ))}
            </ul>
          )}
          <MoreLink to="/admin/statistics">Xem thống kê chi tiết</MoreLink>
        </Card>
      </div>
    </div>
  );
}

function Empty({ children }) {
  return <p className="m-0 py-10 text-center text-sm text-subtle">{children}</p>;
}

function MoreLink({ to, children }) {
  return (
    <Link
      to={to}
      className="mt-3.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-dark no-underline hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children} <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}

function WeekBars({ days }) {
  const max = Math.max(0, ...days.map((d) => d.requests));
  if (max === 0) return <Empty>Chưa có yêu cầu nào trong 7 ngày qua</Empty>;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-[180px] items-end gap-2.5 border-b border-line" role="img" aria-label="Số yêu cầu mới theo ngày">
        {days.map((d) => (
          <div key={d.date} className="flex h-full min-w-0 flex-1 flex-col items-stretch justify-end gap-1" title={`${shortDate(d.date)}: ${num(d.requests)} yêu cầu`}>
            <span className="text-center text-xs font-semibold text-brand-dark">{num(d.requests)}</span>
            <span className="block min-h-0.5 rounded-t-md bg-brand/70 transition-colors hover:bg-brand" style={{ height: `${(d.requests / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2.5 text-[11.5px] text-subtle">
        {days.map((d) => <span key={d.date} className="flex-1 text-center">{shortDate(d.date)}</span>)}
      </div>
    </div>
  );
}

function TopCategories({ rows }) {
  const max = Math.max(0, ...rows.map((r) => r.count));
  if (max === 0) return <Empty>Chưa có yêu cầu nào trong 7 ngày qua</Empty>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="mb-1 flex justify-between gap-2 text-[13px]">
            <span className="min-w-0 break-words">{r.name}</span>
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

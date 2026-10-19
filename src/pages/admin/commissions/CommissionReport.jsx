import { useEffect, useState } from "react";
import { fetchCommissionSettlements, fetchCommissionSummary, PAYMENT_METHODS } from "../../../api/commissionApi";
import { formatDateTime, formatPercent, formatVnd, toIsoDate } from "../../../utils/format";
import {
  Card, DateRangeFilter, Empty, Pagination, Skeleton, StatCard, StatGrid, Table, Td, Th, cn,
} from "../../../components/admin/ui";

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

/** Báo cáo hoa hồng: tổng hợp theo khoảng ngày + danh sách từng đơn đã chốt. */
export default function CommissionReport() {
  const [applied, setApplied] = useState(() => PRESETS[2].range()); // khớp nút "Tháng này"
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

  const onApply = (range) => {
    setApplied(range);
    setPage(0);
  };

  const effectiveRate = Number(summary.grossAmount) > 0
    ? (Number(summary.commissionAmount) / Number(summary.grossAmount)) * 100
    : null;

  return (
    <>
      <DateRangeFilter presets={PRESETS} initialKey="month" onApply={onApply} />

      {summaryError ? (
        <Card><Empty error>{summaryError}</Empty></Card>
      ) : (
        <div className={cn("transition-opacity", summaryLoading && "opacity-60")} aria-busy={summaryLoading}>
          <StatGrid>
            <StatCard label="Đơn hoàn thành" value={Number(summary.orders).toLocaleString("vi-VN")} />
            <StatCard label="Tổng doanh thu" value={formatVnd(summary.grossAmount)} />
            <StatCard
              highlight label="Hoa hồng thu được" value={formatVnd(summary.commissionAmount)}
              sub={effectiveRate != null ? `Bình quân ${formatPercent(effectiveRate)} doanh thu` : null}
            />
            <StatCard label="Thợ nhận" value={formatVnd(summary.workerAmount)} />
          </StatGrid>
        </div>
      )}

      <Card title="Chi tiết các đơn đã chốt">
        <SettlementTable rows={rows.content} loading={rowsLoading} error={rowsError} />
        <Pagination page={page} totalPages={rows.totalPages} onChange={setPage} />
        {rows.totalElements > 0 && (
          <p className="m-0 mt-2.5 text-right text-xs text-subtle">Tổng cộng {rows.totalElements.toLocaleString("vi-VN")} đơn</p>
        )}
      </Card>
    </>
  );
}

function SettlementTable({ rows, loading, error }) {
  if (loading && rows.length === 0) return <Skeleton />;
  if (error) return <Empty error>{error}</Empty>;
  if (rows.length === 0) return <Empty>Chưa có đơn nào được chốt trong khoảng thời gian này</Empty>;

  return (
    <div className={cn("transition-opacity", loading && "opacity-60")}>
      <Table>
        <thead>
          <tr>
            <Th>Mã đơn</Th>
            <Th>Thợ</Th>
            <Th num>Giá trị đơn</Th>
            <Th num>Tỷ lệ</Th>
            <Th num>Hoa hồng</Th>
            <Th num>Thợ nhận</Th>
            <Th>Thanh toán</Th>
            <Th>Thời gian</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td><b>{r.requestCode || `#${r.requestId}`}</b></Td>
              <Td>{r.workerName || "-"}</Td>
              <Td num>{formatVnd(r.amount)}</Td>
              <Td num>{formatPercent(r.commissionRate)}</Td>
              <Td num className="font-bold text-brand-dark">{formatVnd(r.commissionAmount)}</Td>
              <Td num>{formatVnd(r.workerAmount)}</Td>
              <Td>{PAYMENT_METHODS[r.paymentMethod] ?? r.paymentMethod}</Td>
              <Td nowrap>{formatDateTime(r.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

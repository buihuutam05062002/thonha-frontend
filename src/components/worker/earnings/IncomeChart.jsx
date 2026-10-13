import { formatMoneyShort, formatVnd } from "../../../utils/format";
import { parseIsoDate } from "../../../utils/dateRange";

const DAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const NET = "#F5820D"; // thực nhận
const COMMISSION = "#E5E7EB"; // hoa hồng
const CHART_HEIGHT = 160;

const num = (v) => Number(v) || 0;
const pad = (n) => String(n).padStart(2, "0");

function axisLabel(date, days) {
  if (days <= 7) return DAY[date.getDay()];
  if (days <= 31) return String(date.getDate());
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

function labelStep(days) {
  if (days <= 16) return 1;
  if (days <= 31) return 2;
  return Math.ceil(days / 8);
}

/**
 * @param {{date:string, grossAmount:number, commissionAmount:number, workerAmount:number, orders:number}[]} daily
 */
export function IncomeChart({ daily }) {
  const days = daily.length;
  const max = Math.max(...daily.map((d) => num(d.grossAmount)), 1);
  const step = labelStep(days);
  const gap = days > 60 ? 0 : days > 31 ? 1 : days > 14 ? 3 : 6;
  const total = daily.reduce((s, d) => s + num(d.workerAmount), 0);

  return (
    <div>
      <div
        className="d-flex align-items-end"
        style={{ height: CHART_HEIGHT, gap }}
        role="img"
        aria-label={`Biểu đồ thu nhập theo ngày, ${days} ngày, tổng thực nhận ${formatVnd(total)}`}
      >
        {daily.map((d) => {
          const date = parseIsoDate(d.date);
          const gross = num(d.grossAmount);
          const net = num(d.workerAmount);
          const commission = num(d.commissionAmount);
          const tip = `${date ? date.toLocaleDateString("vi-VN") : d.date}: ${d.orders} đơn | doanh thu ${formatVnd(gross)} | hoa hồng ${formatVnd(commission)} | thực nhận ${formatVnd(net)}`;
          return (
            <div key={d.date} className="flex-fill h-100 d-flex flex-column justify-content-end" style={{ minWidth: 0 }} title={tip}>
              {gross > 0 && days <= 16 && (
                <span className="text-muted text-center text-nowrap" style={{ fontSize: 10 }}>
                  {formatMoneyShort(gross)}
                </span>
              )}
              {gross > 0 ? (
                <div
                  style={{
                    height: `${Math.max((gross / max) * 100, 3)}%`,
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "4px 4px 0 0",
                    overflow: "hidden",
                    minHeight: 3,
                  }}
                >
                  {net + commission > 0 ? (
                    <>
                      <div style={{ flex: commission, background: COMMISSION }} />
                      <div style={{ flex: net, background: NET }} />
                    </>
                  ) : (
                    <div style={{ flex: 1, background: "#FBC98A" }} />
                  )}
                </div>
              ) : (
                <div style={{ height: 2, background: "#EEE" }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="d-flex" style={{ gap, height: 18, marginTop: 4 }} aria-hidden="true">
        {daily.map((d, i) => {
          const date = parseIsoDate(d.date);
          return (
            <div key={d.date} className="flex-fill position-relative" style={{ minWidth: 0 }}>
              {date && i % step === 0 && (
                <span
                  className="position-absolute text-muted text-nowrap"
                  style={{ left: "50%", transform: "translateX(-50%)", fontSize: 11 }}
                >
                  {axisLabel(date, days)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="d-flex gap-3 mt-2 small text-muted" aria-hidden="true">
        <span className="d-inline-flex align-items-center gap-1">
          <span className="d-inline-block rounded-1" style={{ width: 10, height: 10, background: NET }} /> Thực nhận
        </span>
        <span className="d-inline-flex align-items-center gap-1">
          <span className="d-inline-block rounded-1" style={{ width: 10, height: 10, background: COMMISSION }} /> Hoa hồng đã trừ
        </span>
      </div>
    </div>
  );
}

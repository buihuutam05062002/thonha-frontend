import { Card } from "react-bootstrap";
import { formatMoneyShort, formatVnd } from "../../../utils/format";

const DAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function WeeklyIncome({ data, total }) {
  const max = Math.max(...data.map((d) => Number(d.amount)), 1);
  const todayKey = new Date().toDateString();

  return (
    <Card className="border-0 shadow-sm rounded-4 mb-4">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-baseline mb-3">
          <h6 className="fw-bold mb-0 text-dark">Thu nhập 7 ngày</h6>
          <span className="fw-bold" style={{ color: "#F5820D" }}>{formatVnd(total)}</span>
        </div>
        <div className="d-flex align-items-end gap-2" style={{ height: 120 }} role="img"
             aria-label={`Thu nhập 7 ngày gần nhất, tổng ${formatVnd(total)}`}>
          {data.map((d) => {
            const date = new Date(`${d.date}T00:00:00`);
            const isToday = date.toDateString() === todayKey;
            const h = Math.max((Number(d.amount) / max) * 100, d.amount > 0 ? 6 : 2);
            return (
              <div key={d.date} className="flex-fill text-center d-flex flex-column justify-content-end h-100"
                   title={`${date.toLocaleDateString("vi-VN")}: ${formatVnd(d.amount)} (${d.orders} đơn)`}>
                <span className="text-muted" style={{ fontSize: 10 }}>
                  {d.amount > 0 ? formatMoneyShort(d.amount) : ""}
                </span>
                <div style={{
                  height: `${h}%`, borderRadius: 6,
                  background: isToday ? "#F5820D" : d.amount > 0 ? "#FBC98A" : "#EEE",
                }} />
              </div>
            );
          })}
        </div>
        <div className="d-flex gap-2 mt-2">
          {data.map((d) => (
            <span key={d.date} className="flex-fill text-center text-muted" style={{ fontSize: 11 }}>
              {DAY[new Date(`${d.date}T00:00:00`).getDay()]}
            </span>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

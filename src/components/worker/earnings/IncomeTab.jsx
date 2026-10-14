import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Col, Row, Spinner } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseApiError } from "../../../api/apiError";
import { getWorkerIncome } from "../../../api/earningsApi";
import {
  addDays,
  formatIsoDate,
  formatRangeLabel,
  monthRange,
  rangeDays,
  validateCustomRange,
  weekRange,
} from "../../../utils/dateRange";
import { formatVnd, toIsoDate } from "../../../utils/format";
import { IncomeChart } from "./IncomeChart";

const ACCENT = "#F5820D";
const KINDS = [
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
  { key: "custom", label: "Khoảng ngày" },
];

function Metric({ label, value, hint, tone }) {
  return (
    <Card className="border-0 shadow-sm rounded-4 h-100">
      <Card.Body className="p-3">
        <div className="text-muted small">{label}</div>
        <div className="fw-bold text-break" style={{ fontSize: "clamp(1.05rem, 4.2vw, 1.5rem)", color: tone }}>
          {value}
        </div>
        {hint && <div className="text-muted" style={{ fontSize: 11 }}>{hint}</div>}
      </Card.Body>
    </Card>
  );
}

/** Tab "Thu nhập": chọn tuần / tháng / khoảng ngày; tổng doanh thu, hoa hồng đã trừ, thực nhận, số đơn và biểu đồ theo ngày. */
export function IncomeTab({ active }) {
  const [kind, setKind] = useState("week");
  const [offset, setOffset] = useState(0); // 0 = tuần/tháng hiện tại, -1 = kỳ trước...
  const [custom, setCustom] = useState(() => {
    const today = new Date();
    return { from: toIsoDate(addDays(today, -6)), to: toIsoDate(today) };
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const seq = useRef(0); // bỏ qua kết quả của lần gọi cũ khi người dùng đã đổi khoảng

  const range = useMemo(() => {
    if (kind === "week") return weekRange(new Date(), offset);
    if (kind === "month") return monthRange(new Date(), offset);
    return custom;
  }, [kind, offset, custom]);

  const customError = kind === "custom" ? validateCustomRange(range.from, range.to) : null;

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await getWorkerIncome(range);
      if (mine !== seq.current) return;
      setData(res);
    } catch (e) {
      if (mine === seq.current) setError(parseApiError(e).message || "Không tải được thu nhập.");
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [range]);

  // chỉ tải khi tab đang mở (và tải lại mỗi lần quay lại tab để số liệu không cũ)
  useEffect(() => {
    if (!active || customError) return;
    load();
  }, [active, customError, load]);

  const chooseKind = (next) => {
    setKind(next);
    setOffset(0);
  };

  const summary = data?.summary;
  const daysWithOrders = (data?.daily ?? []).filter((d) => d.orders > 0);
  const shown = data && data.from === range.from && data.to === range.to; // dữ liệu có khớp khoảng đang chọn không

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="btn-group" role="group" aria-label="Kiểu khoảng thời gian">
          {KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              className={`btn btn-sm ${kind === k.key ? "text-white" : "btn-outline-secondary"}`}
              style={kind === k.key ? { background: ACCENT, borderColor: ACCENT } : undefined}
              aria-pressed={kind === k.key}
              onClick={() => chooseKind(k.key)}
            >
              {k.label}
            </button>
          ))}
        </div>

        {kind !== "custom" && (
          <div className="d-flex align-items-center gap-1 ms-auto">
            <button type="button" className="btn btn-light btn-sm border-0" aria-label="Kỳ trước" onClick={() => setOffset((o) => o - 1)}>
              <ChevronLeft size={18} />
            </button>
            <span className="fw-semibold small text-center" style={{ minWidth: 130 }} aria-live="polite">
              {formatRangeLabel(kind, range)}
            </span>
            <button
              type="button"
              className="btn btn-light btn-sm border-0"
              aria-label="Kỳ sau"
              disabled={offset >= 0}
              onClick={() => setOffset((o) => Math.min(o + 1, 0))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {kind === "custom" && (
        <div className="mb-3">
          <div className="d-flex flex-wrap align-items-end gap-3">
            <label className="small fw-semibold">
              Từ ngày
              <input
                type="date"
                className="form-control form-control-sm mt-1"
                value={custom.from}
                max={custom.to || toIsoDate(new Date())}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              />
            </label>
            <label className="small fw-semibold">
              Đến ngày
              <input
                type="date"
                className="form-control form-control-sm mt-1"
                value={custom.to}
                min={custom.from || undefined}
                max={toIsoDate(new Date())}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              />
            </label>
          </div>
          {customError && <p className="text-danger small mt-2 mb-0" role="alert">{customError}</p>}
        </div>
      )}

      {error && (
        <div className="alert alert-danger small" role="alert">
          {error}{" "}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={load}>Thử lại</button>
        </div>
      )}

      {!summary && loading && <div className="text-center py-5"><Spinner animation="border" style={{ color: ACCENT }} /></div>}

      {summary && (
        <div style={{ opacity: loading || !shown ? 0.6 : 1, transition: "opacity .15s" }} aria-busy={loading}>
          <Row className="g-3 mb-3">
            <Col xs={6} md={3}><Metric label="Tổng doanh thu" value={formatVnd(summary.grossAmount)} /></Col>
            <Col xs={6} md={3}><Metric label="Hoa hồng đã trừ" value={formatVnd(summary.commissionAmount)} /></Col>
            <Col xs={6} md={3}><Metric label="Thực nhận" value={formatVnd(summary.workerAmount)} tone="#16A34A" /></Col>
            <Col xs={6} md={3}>
              <Metric
                label="Số đơn"
                value={summary.orders}
                hint={summary.orders > 0 ? `TB ${formatVnd(Number(summary.workerAmount) / summary.orders)}/đơn` : undefined}
              />
            </Col>
          </Row>

          <Card className="border-0 shadow-sm rounded-4 mb-3">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-baseline mb-3">
                <h6 className="fw-bold mb-0 text-dark">Thu nhập theo ngày</h6>
                <span className="text-muted small">
                  {formatIsoDate(data.from)} - {formatIsoDate(data.to)} | {rangeDays(data.from, data.to)} ngày
                </span>
              </div>
              <IncomeChart daily={data.daily} />
              {summary.orders === 0 && (
                <p className="text-muted small text-center mt-3 mb-0">Chưa có đơn hoàn thành trong khoảng thời gian này.</p>
              )}
            </Card.Body>
          </Card>

          {daysWithOrders.length > 0 && (
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-3 p-md-4">
                <h6 className="fw-bold text-dark mb-3">Chi tiết theo ngày</h6>
                <div className="table-responsive" style={{ maxHeight: 320 }}>
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr className="text-muted small">
                        <th scope="col">Ngày</th>
                        <th scope="col" className="text-end">Đơn</th>
                        <th scope="col" className="text-end">Doanh thu</th>
                        <th scope="col" className="text-end">Hoa hồng</th>
                        <th scope="col" className="text-end">Thực nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...daysWithOrders].reverse().map((d) => (
                        <tr key={d.date}>
                          <td>{formatIsoDate(d.date)}</td>
                          <td className="text-end">{d.orders}</td>
                          <td className="text-end">{formatVnd(d.grossAmount)}</td>
                          <td className="text-end text-muted">{formatVnd(d.commissionAmount)}</td>
                          <td className="text-end fw-semibold">{formatVnd(d.workerAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

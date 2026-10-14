import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Spinner, Button, Form, Badge } from "react-bootstrap";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { parseApiError } from "../../../api/apiError";
import { useConfirm } from "../../ui/confirm/confirmContext";
import {
  SCHEDULE_MAX_DAYS_AHEAD,
  createScheduleSlot,
  deleteScheduleSlot,
  getSchedule,
  updateScheduleSlot,
} from "../../../api/scheduleApi";

const ACCENT = "#F5820D";
const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const STATUS = {
  AVAILABLE: { label: "Rảnh", bg: "success" },
  DAY_OFF: { label: "Bận / nghỉ", bg: "secondary" },
  BOOKED: { label: "Đã có đơn", bg: "warning" },
};

// Ngày theo giờ máy người dùng, định dạng YYYY-MM-DD (không dùng toISOString để khỏi lệch múi giờ)
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const hhmm = (t) => String(t).slice(0, 5);

/** Quản lý lịch làm việc theo tuần: thêm / đổi trạng thái / xóa khung giờ rảnh và bận. */
export function ScheduleModal({ onClose }) {
  const confirm = useConfirm();
  const today = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), []);
  const maxDate = useMemo(() => addDays(today, SCHEDULE_MAX_DAYS_AHEAD), [today]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ date: iso(today), start: "08:00", end: "12:00", status: "AVAILABLE" });

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSlots(await getSchedule(iso(days[0]), iso(days[6])));
      setLoadError(null);
    } catch (e) {
      setLoadError(parseApiError(e).message || "Không tải được lịch làm việc.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  async function run(fn) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(parseApiError(e).message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  const add = (e) => {
    e.preventDefault();
    run(() => createScheduleSlot({ workDate: form.date, startTime: form.start, endTime: form.end, status: form.status }));
  };
  const dayOff = () => run(() => createScheduleSlot({ workDate: form.date, startTime: "00:00", endTime: "23:59", status: "DAY_OFF" }));
  const toggle = (s) => run(() => updateScheduleSlot(s.id, {
    workDate: s.workDate, startTime: hhmm(s.startTime), endTime: hhmm(s.endTime),
    status: s.status === "AVAILABLE" ? "DAY_OFF" : "AVAILABLE",
  }));
  const remove = async (s) => {
    const ok = await confirm({
      title: "Xóa khung giờ?",
      message: `${hhmm(s.startTime)} - ${hhmm(s.endTime)}`,
      confirmText: "Xóa",
      danger: true,
    });
    if (ok) run(() => deleteScheduleSlot(s.id));
  };

  const canPrev = addDays(weekStart, -1) >= startOfWeek(today);
  const canNext = addDays(weekStart, 7) <= maxDate;
  const weekLabel = `${days[0].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${days[6].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`;

  return (
    <Modal show onHide={onClose} centered scrollable size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">Lịch làm việc</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={add} className="border rounded-3 p-3 mb-3">
          <div className="fw-semibold small mb-2">Thêm khung giờ</div>
          <div className="row g-2 align-items-end">
            <div className="col-6 col-md-3">
              <Form.Label className="small text-muted mb-1">Ngày</Form.Label>
              <Form.Control type="date" size="sm" min={iso(today)} max={iso(maxDate)} value={form.date} required
                            onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="col-3 col-md-2">
              <Form.Label className="small text-muted mb-1">Từ</Form.Label>
              <Form.Control type="time" size="sm" value={form.start} required onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </div>
            <div className="col-3 col-md-2">
              <Form.Label className="small text-muted mb-1">Đến</Form.Label>
              <Form.Control type="time" size="sm" value={form.end} required onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </div>
            <div className="col-6 col-md-3">
              <Form.Label className="small text-muted mb-1">Trạng thái</Form.Label>
              <Form.Select size="sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="AVAILABLE">Rảnh</option>
                <option value="DAY_OFF">Bận / nghỉ</option>
              </Form.Select>
            </div>
            <div className="col-6 col-md-2 d-grid">
              <Button type="submit" size="sm" disabled={busy} style={{ background: ACCENT, borderColor: ACCENT }}>Thêm</Button>
            </div>
          </div>
          <Button variant="link" size="sm" className="p-0 mt-2" disabled={busy} onClick={dayOff}>
            Nghỉ cả ngày {form.date ? new Date(form.date + "T00:00").toLocaleDateString("vi-VN") : ""}
          </Button>
          {error && <p className="text-danger small mt-2 mb-0">{error}</p>}
        </Form>

        <div className="d-flex align-items-center justify-content-between mb-2">
          <Button variant="light" size="sm" disabled={!canPrev} onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Tuần trước"><ChevronLeft size={16} /></Button>
          <span className="fw-semibold small">Tuần {weekLabel}</span>
          <Button variant="light" size="sm" disabled={!canNext} onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Tuần sau"><ChevronRight size={16} /></Button>
        </div>

        {loading && <div className="text-center py-3"><Spinner animation="border" size="sm" style={{ color: ACCENT }} /></div>}
        {loadError && <p className="text-danger small">{loadError} <button type="button" className="btn btn-link btn-sm p-0" onClick={load}>Thử lại</button></p>}

        {!loading && !loadError && days.map((d) => {
          const key = iso(d);
          const list = slots.filter((s) => s.workDate === key);
          const isToday = key === iso(today);
          return (
            <div key={key} className="d-flex gap-3 py-2 border-bottom">
              <div style={{ width: 84 }} className="flex-shrink-0">
                <div className="fw-semibold small" style={{ color: isToday ? ACCENT : undefined }}>{WEEKDAYS[d.getDay()]}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>{d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</div>
              </div>
              <div className="flex-grow-1">
                {list.length === 0 && <span className="text-muted small">Chưa có khung giờ</span>}
                {list.map((s) => {
                  const st = STATUS[s.status] ?? STATUS.DAY_OFF;
                  const locked = s.status === "BOOKED";
                  return (
                    <div key={s.id} className="d-flex align-items-center gap-2 mb-1">
                      <span className="small fw-semibold">{hhmm(s.startTime)} - {hhmm(s.endTime)}</span>
                      <Badge bg={st.bg}>{st.label}</Badge>
                      {!locked && (
                        <>
                          <button type="button" className="btn btn-link btn-sm p-0 ms-auto" disabled={busy} onClick={() => toggle(s)}>
                            Đổi sang {s.status === "AVAILABLE" ? "bận" : "rảnh"}
                          </button>
                          <button type="button" className="btn btn-link btn-sm p-0 text-danger" disabled={busy} onClick={() => remove(s)} aria-label="Xóa khung giờ">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
}

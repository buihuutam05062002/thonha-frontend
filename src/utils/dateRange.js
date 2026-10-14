import { toIsoDate } from "./format";

/** Khoảng ngày tối đa backend chấp nhận cho một lần xem thu nhập. */
export const MAX_RANGE_DAYS = 366;

const DAY_MS = 86400000;

/** "2026-10-05" -> Date (giờ máy), hoặc null nếu sai định dạng / ngày không tồn tại. */
export function parseIsoDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const ok = d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]);
  return ok ? d : null;
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

/** Số ngày của khoảng [from, to] (gồm cả hai đầu); 0 nếu không hợp lệ. */
export function rangeDays(from, to) {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  if (!a || !b) return 0;
  return Math.round((b - a) / DAY_MS) + 1;
}

/** Tuần (thứ Hai -> Chủ nhật) chứa `ref`, dịch `offset` tuần (-1 = tuần trước). */
export function weekRange(ref = new Date(), offset = 0) {
  const monday = addDays(ref, -((ref.getDay() + 6) % 7) + offset * 7);
  return { from: toIsoDate(monday), to: toIsoDate(addDays(monday, 6)) };
}

/** Tháng dương lịch chứa `ref`, dịch `offset` tháng. */
export function monthRange(ref = new Date(), offset = 0) {
  const first = new Date(ref.getFullYear(), ref.getMonth() + offset, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return { from: toIsoDate(first), to: toIsoDate(last) };
}

/** Lỗi (tiếng Việt) của khoảng ngày tự chọn, hoặc null nếu hợp lệ. */
export function validateCustomRange(from, to, today = new Date()) {
  if (!from || !to) return "Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.";
  if (!parseIsoDate(from) || !parseIsoDate(to)) return "Ngày không hợp lệ.";
  if (to < from) return "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
  if (to > toIsoDate(today)) return "Không chọn được ngày trong tương lai.";
  if (rangeDays(from, to) > MAX_RANGE_DAYS) return `Chỉ xem được tối đa ${MAX_RANGE_DAYS} ngày một lần.`;
  return null;
}

/** "2026-10-05" -> "05/10/2026" */
export function formatIsoDate(s) {
  const d = parseIsoDate(s);
  return d ? d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
}

/** Nhãn hiển thị của khoảng đang xem. */
export function formatRangeLabel(kind, { from, to }) {
  const a = parseIsoDate(from);
  if (kind === "month" && a) return `Tháng ${a.getMonth() + 1}/${a.getFullYear()}`;
  if (kind === "week" && a) {
    return `${String(a.getDate()).padStart(2, "0")}/${String(a.getMonth() + 1).padStart(2, "0")} - ${formatIsoDate(to)}`;
  }
  return `${formatIsoDate(from)} - ${formatIsoDate(to)}`;
}

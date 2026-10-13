import { toIsoDate } from "./format";

export const MAX_RANGE_DAYS = 366;

const DAY_MS = 86400000;

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

export function rangeDays(from, to) {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  if (!a || !b) return 0;
  return Math.round((b - a) / DAY_MS) + 1;
}

export function weekRange(ref = new Date(), offset = 0) {
  const monday = addDays(ref, -((ref.getDay() + 6) % 7) + offset * 7);
  return { from: toIsoDate(monday), to: toIsoDate(addDays(monday, 6)) };
}

export function monthRange(ref = new Date(), offset = 0) {
  const first = new Date(ref.getFullYear(), ref.getMonth() + offset, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return { from: toIsoDate(first), to: toIsoDate(last) };
}

export function validateCustomRange(from, to, today = new Date()) {
  if (!from || !to) return "Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.";
  if (!parseIsoDate(from) || !parseIsoDate(to)) return "Ngày không hợp lệ.";
  if (to < from) return "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
  if (to > toIsoDate(today)) return "Không chọn được ngày trong tương lai.";
  if (rangeDays(from, to) > MAX_RANGE_DAYS) return `Chỉ xem được tối đa ${MAX_RANGE_DAYS} ngày một lần.`;
  return null;
}

export function formatIsoDate(s) {
  const d = parseIsoDate(s);
  return d ? d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
}

export function formatRangeLabel(kind, { from, to }) {
  const a = parseIsoDate(from);
  if (kind === "month" && a) return `Tháng ${a.getMonth() + 1}/${a.getFullYear()}`;
  if (kind === "week" && a) {
    return `${String(a.getDate()).padStart(2, "0")}/${String(a.getMonth() + 1).padStart(2, "0")} - ${formatIsoDate(to)}`;
  }
  return `${formatIsoDate(from)} - ${formatIsoDate(to)}`;
}

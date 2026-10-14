/** Định dạng tiền / phần trăm / ngày giờ dùng chung toàn dự án (locale vi-VN, tiền VND không có số lẻ). */

const vnd = new Intl.NumberFormat("vi-VN");
const pct = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

/** 850000 -> "850.000đ" (số âm giữ dấu: -50000 -> "-50.000đ") */
export const formatVnd = (v) => `${vnd.format(Math.round(Number(v) || 0))}đ`;

/** Dùng cho sổ cái: 500000 -> "+500.000đ", -50000 -> "-50.000đ" */
export function formatSignedVnd(v) {
  const n = Math.round(Number(v) || 0);
  if (n === 0) return "0đ";
  return `${n > 0 ? "+" : "-"}${vnd.format(Math.abs(n))}đ`;
}

/** Rút gọn cho ô thống kê: 850000 -> "850K", 1250000 -> "1,25M" */
export function formatMoneyShort(v) {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return `${vnd.format(Math.round(n / 10_000) / 100)}M`;
  if (n >= 1_000) return `${vnd.format(Math.round(n / 1_000))}K`;
  return String(n);
}

/** 12.5 -> "12,5%", 10 -> "10%" */
export const formatPercent = (v) => `${pct.format(Number(v) || 0)}%`;

/**
 * "12/10/2026, 14:05:03". Giá trị rỗng hoặc không hợp lệ trả `fallback` (mặc định "-").
 */
export function formatDateTime(v, fallback = "-") {
  if (!v) return fallback;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : d.toLocaleString("vi-VN", { hour12: false });
}

/**
 * "Vừa xong", "5 phút trước", "3 giờ trước", "2 ngày trước"...
 * Quá `maxDays` ngày thì hiện ngày đầy đủ. Giá trị rỗng trả `fallback` (mặc định "-").
 */
export function formatRelative(v, { fallback = "-", maxDays = 30 } = {}) {
  if (!v) return fallback;
  const min = Math.floor((Date.now() - new Date(v).getTime()) / 60000);
  if (min < 1) return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < maxDays) return `${day} ngày trước`;
  return new Date(v).toLocaleDateString("vi-VN");
}

/** "14:05 - Hôm nay", "14:05 - Hôm qua", "14:05 - 10/10/2026". Giá trị rỗng trả "". */
export function formatDayTime(v) {
  if (!v) return "";
  const d = new Date(v);
  const now = new Date();
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const yesterday = new Date(now.getTime() - 86400000);
  if (sameDay(d, now)) return `${time} - Hôm nay`;
  if (sameDay(d, yesterday)) return `${time} - Hôm qua`;
  return `${time} - ${d.toLocaleDateString("vi-VN")}`;
}

/** Backend giới hạn số tiền tối đa 12 chữ số (Digits integer = 12). */
export const MAX_MONEY_DIGITS = 12;

/** "5.000a" -> 5000: chỉ giữ chữ số, 0 nghĩa là để trống. */
export function parseMoneyInput(text) {
  const digits = String(text ?? "").replace(/\D/g, "").slice(0, MAX_MONEY_DIGITS);
  return digits ? Number(digits) : 0;
}

export const formatMoneyInput = (n) => (n ? vnd.format(n) : "");

/** Ngày theo giờ máy người dùng, dạng YYYY-MM-DD (không dùng toISOString để khỏi lệch múi giờ). */
export const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

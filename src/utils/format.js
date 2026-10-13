
const vnd = new Intl.NumberFormat("vi-VN");
const pct = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

export const formatVnd = (v) => `${vnd.format(Math.round(Number(v) || 0))}đ`;

export function formatSignedVnd(v) {
  const n = Math.round(Number(v) || 0);
  if (n === 0) return "0đ";
  return `${n > 0 ? "+" : "-"}${vnd.format(Math.abs(n))}đ`;
}

export function formatMoneyShort(v) {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return `${vnd.format(Math.round(n / 10_000) / 100)}M`;
  if (n >= 1_000) return `${vnd.format(Math.round(n / 1_000))}K`;
  return String(n);
}

export const formatPercent = (v) => `${pct.format(Number(v) || 0)}%`;


export function formatDateTime(v, fallback = "-") {
  if (!v) return fallback;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : d.toLocaleString("vi-VN", { hour12: false });
}


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

export const MAX_MONEY_DIGITS = 12;

export function parseMoneyInput(text) {
  const digits = String(text ?? "").replace(/\D/g, "").slice(0, MAX_MONEY_DIGITS);
  return digits ? Number(digits) : 0;
}

export const formatMoneyInput = (n) => (n ? vnd.format(n) : "");

export const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

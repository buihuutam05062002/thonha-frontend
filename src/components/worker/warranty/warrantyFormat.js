const pad = (n) => String(n).padStart(2, "0");

export const TIME_SLOTS = [
  { value: "08:00", label: "08:00 - 10:00 (Sáng)" },
  { value: "10:00", label: "10:00 - 12:00 (Trưa)" },
  { value: "14:00", label: "14:00 - 16:00 (Chiều)" },
  { value: "16:00", label: "16:00 - 18:00 (Chiều tối)" },
];

export const RESOLUTION_OPTIONS = [
  {
    value: "TECHNICAL_ERROR",
    title: "Lỗi thao tác kỹ thuật cũ",
    hint: "Bảo hành miễn phí 100% cho khách",
  },
  {
    value: "COMPONENT_FAULT",
    title: "Lỗi linh kiện từ NSX",
    hint: "Đã đổi linh kiện mới cho khách",
  },
  {
    value: "CUSTOMER_USAGE",
    title: "Lỗi phát sinh mới / Do khách dùng sai",
    hint: "Khách đã thỏa thuận thanh toán thêm",
  },
];

export const RESOLUTION_LABELS = Object.fromEntries(
  RESOLUTION_OPTIONS.map((o) => [o.value, o.title]),
);

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "08:00 - 10:00" label of the slot that starts at the given datetime
export function slotRangeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const start = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const slot = TIME_SLOTS.find((s) => s.value === start);
  return slot ? slot.label.replace(/ \(.*\)$/, "") : start;
}

export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

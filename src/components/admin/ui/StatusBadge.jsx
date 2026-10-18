import { cn } from "./cn";

// Màu trạng thái giữ nguyên ngữ nghĩa: vàng = chờ, xanh dương = đang xử lý, xanh lá = thành công, đỏ = lỗi / từ chối.
const TONES = {
  pending: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-700",
  neutral: "bg-slate-100 text-subtle",
};

export default function StatusBadge({ tone = "neutral", className, children }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full px-12px py-[3px] text-[11.5px] font-semibold", TONES[tone], className)}>
      {children}
    </span>
  );
}

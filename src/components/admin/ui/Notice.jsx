import { X } from "lucide-react";
import { cn } from "./cn";

const TYPES = {
  success: "bg-green-50 text-green-800",
  error: "bg-red-50 text-red-700",
};

export default function Notice({ type = "success", children, onClose }) {
  return (
    <div role={type === "error" ? "alert" : "status"} className={cn("flex items-center justify-between gap-3.5 rounded-xl px-16px py-2.5 text-[13px] font-medium", TYPES[type])}>
      <span>{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Đóng thông báo" className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-current">
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="m-0 mt-2 rounded-xl bg-red-50 px-2.5 py-2 text-[12.5px] text-red-700">
      {children}
    </p>
  );
}

/** Ghi chú nhấn mạnh (màu vàng nhạt), dùng cho cảnh báo không phải lỗi. */
export function Note({ children, className }) {
  return <p className={cn("m-0 rounded-xl bg-amber-50 px-2.5 py-2 text-[12.5px] text-amber-800", className)}>{children}</p>;
}

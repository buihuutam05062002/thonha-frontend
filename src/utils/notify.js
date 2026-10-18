import { toast } from "react-toastify";

/**
 * Thông báo dạng toast, giữ nguyên chữ ký showNotice(type, text) cũ:
 * type = "success" | "error".
 * toastId = nội dung -> cùng một thông báo lặp lại thì không chồng nhiều cái.
 * Lỗi giữ lâu hơn (5 giây) để người dùng kịp đọc.
 */
export function notify(type, text) {
  if (!text) return;
  if (type === "error") toast.error(text, { toastId: text, autoClose: 5000 });
  else toast.success(text, { toastId: text });
}

export const notifySuccess = (text) => notify("success", text);

/** Dùng trong catch: notifyError(e) lấy e.message, có câu dự phòng. */
export const notifyError = (e, fallback = "Có lỗi xảy ra, vui lòng thử lại") =>
  notify("error", e?.message || fallback);

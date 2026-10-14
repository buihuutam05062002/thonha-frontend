import { createContext, useContext } from "react";

export const ConfirmContext = createContext(null);

/**
 * Hộp thoại xác nhận dùng chung, thay cho window.confirm.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Xoá địa chỉ?", message: "...", danger: true }))) return;
 *
 * Nhận object { title, message, confirmText, cancelText, danger } hoặc chỉ một chuỗi message.
 * Trả về Promise<boolean>: true khi bấm xác nhận, false khi bấm Huỷ / nhấn Esc / bấm ra ngoài.
 */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm phải được dùng bên trong <ConfirmProvider>");
  return confirm;
}

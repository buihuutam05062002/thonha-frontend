import { createContext, useContext } from "react";

export const ConfirmContext = createContext(null);


export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm phải được dùng bên trong <ConfirmProvider>");
  return confirm;
}

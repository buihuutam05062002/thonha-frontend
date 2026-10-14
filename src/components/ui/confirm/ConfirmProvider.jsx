import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ConfirmContext } from "./confirmContext";

const ACCENT = "bg-[#F5820D] hover:bg-[#d96f06]";
const DANGER = "bg-red-600 hover:bg-red-700";

function ConfirmDialog({ title, message, confirmText, cancelText, danger, onResult }) {
  const ref = useRef(null);
  const titleId = useId();
  const messageId = useId();

  // <dialog> mở bằng showModal() cho sẵn: khoá thao tác phần còn lại của trang, bẫy focus, phím Esc,
  // và nằm ở "top layer" nên luôn hiện trên cả modal Bootstrap đang mở bên dưới.
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
      // Esc: chặn việc <dialog> tự đóng, để state do provider quản lý
      onCancel={(e) => {
        e.preventDefault();
        onResult(false);
      }}
      // bấm vào vùng nền mờ (chính phần tử <dialog>, vì nội dung bên trong phủ kín) = Huỷ
      onClick={(e) => {
        if (e.target === e.currentTarget) onResult(false);
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border-0 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/40"
    >
      <div className="p-5">
        <h2 id={titleId} className="m-0 text-base font-semibold">
          {title}
        </h2>
        {message && (
          <p id={messageId} className="mb-0 mt-2 whitespace-pre-line text-sm text-gray-600">
            {message}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
        {cancelText !== null && (
          <button
            type="button"
            // Focus mặc định vào "Huỷ": nhấn Enter nhầm sẽ không thực hiện thao tác nguy hiểm
            autoFocus
            onClick={() => onResult(false)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
        )}
        <button
          type="button"
          autoFocus={cancelText === null}
          onClick={() => onResult(true)}
          className={`cursor-pointer rounded-lg border-0 px-4 py-2 text-sm font-semibold text-white ${danger ? DANGER : ACCENT}`}
        >
          {confirmText}
        </button>
      </div>
    </dialog>
  );
}

function normalize(options) {
  const o = typeof options === "string" ? { message: options } : options ?? {};
  return {
    title: o.title ?? "Xác nhận",
    message: o.message ?? "",
    confirmText: o.confirmText ?? "Đồng ý",
    cancelText: o.cancelText === undefined ? "Huỷ" : o.cancelText, // null = chỉ có nút xác nhận (dạng thông báo)
    danger: !!o.danger,
  };
}

let nextId = 1;

export default function ConfirmProvider({ children }) {
  const [current, setCurrent] = useState(null);
  const pendingRef = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        pendingRef.current?.resolve(false); // đang có hộp thoại khác thì coi như đã huỷ
        const next = { id: nextId++, options: normalize(options), resolve };
        pendingRef.current = next;
        setCurrent(next);
      }),
    []
  );

  const settle = useCallback((result) => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    setCurrent(null);
    pending.resolve(result);
  }, []);

  // Provider bị gỡ khi đang mở hộp thoại: không để Promise treo vô thời hạn
  useEffect(() => () => pendingRef.current?.resolve(false), []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {current && <ConfirmDialog key={current.id} {...current.options} onResult={settle} />}
    </ConfirmContext.Provider>
  );
}

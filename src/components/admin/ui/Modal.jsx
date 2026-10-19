import { useEffect, useId } from "react";
import { X } from "lucide-react";

/** Hộp thoại có tiêu đề và nút đóng. Esc hoặc bấm nền để đóng. */
export default function Modal({ title, onClose, children }) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-16px" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white px-6 pb-6 pt-20px"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-12px flex items-center justify-between">
          <h2 id={titleId} className="m-0 text-xl font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

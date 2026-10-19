import { useEffect, useId } from "react";
import Button from "./Button";

/** Hộp xác nhận cho thao tác không hoàn tác được. Esc hoặc bấm nền để hủy (trừ lúc đang xử lý). */
export default function ConfirmDialog({ icon, title, lines = [], confirmLabel, danger, busy, onConfirm, onCancel }) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-ink/[.55] p-16px"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} className="flex w-full max-w-[420px] flex-col items-center gap-2.5 rounded-[18px] bg-white p-6 text-center">
        {icon}
        <h3 id={titleId} className="m-0 text-lg font-bold text-ink">{title}</h3>
        {lines.map((l, i) => <p key={i} className="m-0 text-[13.5px] text-subtle">{l}</p>)}
        <div className="mt-1.5 flex w-full gap-2.5">
          <Button variant="neutral" size="lg" className="flex-1" disabled={busy} onClick={onCancel}>Hủy</Button>
          <Button variant={danger ? "danger" : "success"} size="lg" className="flex-1" disabled={busy} onClick={onConfirm}>
            {busy ? "Đang xử lý..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

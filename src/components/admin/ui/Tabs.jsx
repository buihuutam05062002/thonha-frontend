import { cn } from "./cn";

/**
 * Hàng nút dạng viên thuốc.
 * - Mặc định là tab (role="tablist"), có thể kèm số đếm `count`.
 * - `toggle`: nhóm nút chọn một giá trị (vd: khoảng ngày nhanh), dùng aria-pressed.
 */
export default function Tabs({ items, value, onChange, toggle = false, label }) {
  return (
    <div className="flex flex-wrap gap-1.5" role={toggle ? "group" : "tablist"} aria-label={label}>
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.key ?? t.value}
            type="button"
            role={toggle ? undefined : "tab"}
            aria-selected={toggle ? undefined : active}
            aria-pressed={toggle ? active : undefined}
            onClick={() => onChange(t.value)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-3.5 py-[7px] text-[13px] transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              active ? "bg-brand font-semibold text-white" : "bg-slate-100 text-ink hover:bg-brand-soft hover:text-brand-dark",
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cn("min-w-5 rounded-full px-[7px] text-center text-[11px]", active ? "bg-white/30" : "bg-black/10")}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

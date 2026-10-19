import { Fragment } from "react";
import { Search } from "lucide-react";
import { cn } from "./cn";

/** Khung hai cột: danh sách bên trái, chi tiết bên phải. Dưới 1100px xếp dọc. */
export function SplitPanel({ children }) {
  return (
    <div className="grid grid-cols-[minmax(340px,1fr)_minmax(340px,1.05fr)] items-start gap-20px max-[1100px]:grid-cols-1">
      {children}
    </div>
  );
}

export function ListPane({ children }) {
  return <div className="min-w-0 rounded-2xl border-[1px] border-line bg-white p-16px">{children}</div>;
}

/** Cột chi tiết, dính theo màn hình khi cuộn. */
export function DetailPane({ children }) {
  return (
    <aside className="sticky top-3 max-h-[calc(100vh-24px)] min-w-0 overflow-y-auto rounded-2xl border-[1px] border-line bg-white p-20px max-[1100px]:static max-[1100px]:max-h-none">
      {children}
    </aside>
  );
}

/** Cột chi tiết khi chưa có nội dung: đang tải, lỗi hoặc chưa chọn. */
export function DetailMessage({ error, busy, children }) {
  return (
    <aside
      role={error ? "alert" : undefined}
      aria-busy={busy || undefined}
      className={cn(
        "min-w-0 rounded-2xl border-[1px] border-line bg-white px-12px py-10 text-center text-sm",
        error ? "text-red-600" : "text-subtle",
      )}
    >
      {children}
    </aside>
  );
}

export function ListCards({ loading, children }) {
  return <ul className={cn("m-0 flex list-none flex-col gap-2 p-0", loading && "pointer-events-none opacity-60")}>{children}</ul>;
}

export function ListCardSkeleton({ count = 4 }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-busy="true">
      {Array.from({ length: count }, (_, i) => <li key={i} className="h-[92px] animate-pulse rounded-[14px] bg-slate-100" />)}
    </ul>
  );
}

export function ListCard({ active, className, ...rest }) {
  return (
    <li>
      <button
        type="button"
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full min-w-0 cursor-pointer gap-2.5 rounded-[14px] border-[1px] p-12px text-left transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          active ? "border-brand bg-brand-soft ring-2 ring-brand/20" : "border-line bg-white hover:border-brand-line",
          className,
        )}
        {...rest}
      />
    </li>
  );
}

/** Thanh lọc phía trên danh sách. */
export function FilterBar({ first, children, ...rest }) {
  return <form className={cn("mb-3.5 flex flex-wrap gap-2", !first && "mt-12px")} {...rest}>{children}</form>;
}

export function SearchBox({ className, ...inputProps }) {
  return (
    <div className={cn("flex min-w-0 flex-[2_1_180px] items-center gap-1.5 rounded-full bg-slate-100 px-12px text-subtle focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand", className)}>
      <Search size={14} aria-hidden="true" />
      <input className="h-8 w-full min-w-0 border-0 bg-transparent text-[13px] text-ink outline-none" {...inputProps} />
    </div>
  );
}

export function DetailHeader({ title, sub, aside }) {
  return (
    <div className="mb-16px flex items-center justify-between gap-2">
      <h2 className="m-0 text-xl font-bold text-ink">
        {title} {sub && <small className="text-[13px] font-medium text-subtle">{sub}</small>}
      </h2>
      {aside}
    </div>
  );
}

export function DetailSection({ title, sub, children }) {
  return (
    <section className="mt-3.5 border-t border-line pt-3.5">
      <h3 className="m-0 mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-brand-dark">
        {title} {sub && <small className="font-normal text-subtle">{sub}</small>}
      </h3>
      {children}
    </section>
  );
}

/** Cặp nhãn - giá trị. rows = [[nhãn, nội dung], ...] */
export function Fields({ rows }) {
  return (
    <dl className="m-0 mb-1.5 grid grid-cols-[110px_1fr] gap-y-1.5 text-[13px] max-[420px]:grid-cols-1">
      {rows.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="mt-1.5 font-normal text-subtle first:mt-0">{k}</dt>
          <dd className="m-0 min-w-0 break-words font-medium text-ink">{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

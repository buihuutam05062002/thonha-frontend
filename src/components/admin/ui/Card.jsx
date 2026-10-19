import { cn } from "./cn";

export default function Card({ title, subtitle, action, className, children, ...rest }) {
  return (
    <div className={cn("min-w-0 rounded-2xl border-[1px] border-line bg-white p-16px", className)} {...rest}>
      {(title || action) && (
        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3.5">
          <div>
            {title && <h2 className="m-0 text-[15px] font-bold text-ink">{title}</h2>}
            {subtitle && <p className="m-0 mt-1 text-[12.5px] text-subtle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

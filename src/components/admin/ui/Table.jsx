import { cn } from "./cn";

export default function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] text-ink [&_tbody_tr:last-child_td]:border-b-0">{children}</table>
    </div>
  );
}

export function Th({ num, className, ...rest }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap bg-brand-soft px-2.5 py-2 text-xs font-semibold text-brand-dark first:rounded-l-xl last:rounded-r-xl",
        num ? "text-right" : "text-left",
        className,
      )}
      {...rest}
    />
  );
}

export function Td({ num, nowrap, className, ...rest }) {
  return (
    <td
      className={cn(
        "border-b border-line px-2.5 py-2.5 align-middle",
        num && "text-right",
        (num || nowrap) && "whitespace-nowrap",
        className,
      )}
      {...rest}
    />
  );
}

import { cn } from "./cn";

export default function StatCard({ label, value, sub, highlight }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-2xl border-[1px] px-16px py-3.5",
        highlight ? "border-brand bg-brand text-white" : "border-line bg-white text-ink",
      )}
    >
      <span className={cn("text-xs", highlight ? "text-white/85" : "text-subtle")}>{label}</span>
      <strong className="break-words text-xl leading-tight max-[560px]:text-[17px]">{value}</strong>
      {sub && <small className={cn("text-[11.5px]", highlight ? "text-white/85" : "text-brand-dark")}>{sub}</small>}
    </div>
  );
}

export function StatGrid({ children }) {
  return <div className="grid grid-cols-4 gap-3.5 max-[960px]:grid-cols-2">{children}</div>;
}

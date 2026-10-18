import { cn } from "./cn";

export default function Switch({ checked, label, className, ...rest }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        "relative h-[22px] w-[38px] shrink-0 cursor-pointer rounded-full border-0 p-0 align-middle transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-green-500" : "bg-slate-300",
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          "absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white transition-transform",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}

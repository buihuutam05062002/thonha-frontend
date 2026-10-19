import { cn } from "./cn";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  soft: "bg-brand-soft text-brand-dark hover:bg-brand-line/60",
  ghost: "bg-transparent text-brand-dark hover:bg-brand-soft",
  success: "bg-green-600 text-white hover:bg-green-700",
  danger: "bg-red-500 text-white hover:bg-red-600",
  neutral: "bg-slate-200 text-ink hover:bg-slate-300",
};

const SIZES = {
  md: "h-8 px-[18px] text-xs",
  sm: "h-7 px-2.5 text-xs",
  lg: "h-10 px-20px text-[13.5px]",
};

export default function Button({ variant = "primary", size = "md", className, type = "button", ...rest }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-full border-0 font-semibold transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "disabled:cursor-not-allowed disabled:opacity-50",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}

import { cn } from "./cn";

const VARIANTS = {
  brand: "bg-brand-soft text-brand-dark",
  muted: "bg-slate-100 text-subtle",
  action: "cursor-pointer bg-slate-100 text-left text-ink hover:bg-brand-soft hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
};

/** Nhãn nhỏ. variant="action" render thành nút bấm được. */
export default function Chip({ variant = "brand", className, ...rest }) {
  const cls = cn("rounded-full border-0 px-2.5 py-0.5 text-[11.5px] font-medium", VARIANTS[variant], className);
  return variant === "action" ? <button type="button" className={cls} {...rest} /> : <span className={cls} {...rest} />;
}

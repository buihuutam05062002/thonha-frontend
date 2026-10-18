import { cn } from "./cn";

const SIZES = { md: "h-11 w-11 text-base", lg: "h-[60px] w-[60px] text-[22px]" };

/** Ảnh đại diện tròn; không có ảnh thì hiện chữ cái đầu của tên. */
export default function Avatar({ src, name, size = "md", className }) {
  const base = cn("shrink-0 rounded-full", SIZES[size], className);
  if (src) return <img src={src} alt="" className={cn(base, "object-cover")} />;
  return (
    <span className={cn(base, "grid place-items-center bg-brand-soft font-bold text-brand-dark")}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

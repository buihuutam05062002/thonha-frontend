import { cn } from "./cn";

export const CONTROL =
  "rounded-xl border-[1px] border-line bg-white px-2.5 py-2 text-[13.5px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand";

export function Field({ label, wide, children }) {
  return (
    <label className={cn("flex flex-col gap-1 text-xs text-subtle", wide && "col-span-full")}>
      {label}
      {children}
    </label>
  );
}

export const Input = ({ className, ...rest }) => <input className={cn(CONTROL, className)} {...rest} />;
export const Select = ({ className, ...rest }) => <select className={cn(CONTROL, className)} {...rest} />;
export const Textarea = ({ className, ...rest }) => <textarea className={cn(CONTROL, className)} {...rest} />;

/** Ô chọn dạng viên thuốc, dùng trong thanh lọc của danh sách. */
export const PillSelect = ({ className, ...rest }) => (
  <select
    className={cn(
      "h-8 min-w-0 flex-[1_1_140px] cursor-pointer rounded-full border-0 bg-slate-100 px-12px text-[13px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      className,
    )}
    {...rest}
  />
);

/** Ô nhập dạng viên thuốc, dùng trong thanh lọc của danh sách. */
export const PillInput = ({ className, ...rest }) => (
  <input
    className={cn(
      "h-8 min-w-0 flex-[1_1_100px] rounded-full border-0 bg-slate-100 px-12px text-[13px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      className,
    )}
    {...rest}
  />
);

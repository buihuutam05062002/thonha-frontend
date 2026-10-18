import { cn } from "./cn";

/** Dòng thông báo trống / lỗi nằm giữa một khối. */
export default function Empty({ error, className, children, ...rest }) {
  return (
    <p
      role={error ? "alert" : undefined}
      className={cn("m-0 px-12px py-10 text-center text-sm", error ? "text-red-600" : "text-subtle", className)}
      {...rest}
    >
      {children}
    </p>
  );
}

import { cn } from "./cn";

function getPages(current, total) {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set([0, total - 1, current - 1, current, current + 1]);
  if (current < 3) [0, 1, 2].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("...");
    result.push(p);
  });
  return result;
}

const BASE =
  "h-7 min-w-7 cursor-pointer rounded-full border-0 px-2.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-default disabled:opacity-50";

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-20px flex items-center justify-end gap-1.5" aria-label="Phân trang">
      <button type="button" className={cn(BASE, "bg-brand-soft text-brand-dark hover:bg-brand-line/60")} disabled={page === 0} onClick={() => onChange(page - 1)}>
        Trước
      </button>
      {getPages(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-2 text-xs text-subtle">...</span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            className={cn(BASE, p === page ? "bg-brand font-semibold text-white" : "bg-brand-soft text-brand-dark hover:bg-brand-line/60")}
            onClick={() => onChange(p)}
          >
            {p + 1}
          </button>
        ),
      )}
      <button type="button" className={cn(BASE, "bg-brand-soft text-brand-dark hover:bg-brand-line/60")} disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Sau
      </button>
    </nav>
  );
}

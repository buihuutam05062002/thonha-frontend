import { Pagination } from "react-bootstrap";

export function pageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const set = new Set([0, total - 1, current - 1, current, current + 1]);
  if (current < 3) [0, 1, 2].forEach((p) => set.add(p));
  if (current > total - 4) [total - 3, total - 2, total - 1].forEach((p) => set.add(p));
  const sorted = [...set].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Paginator({ page, totalPages, onChange, disabled = false }) {
  if (totalPages <= 1) return null;
  return (
    <Pagination className="justify-content-center flex-wrap mt-3 mb-0" size="sm" aria-label="Phân trang">
      <Pagination.Prev disabled={disabled || page <= 0} onClick={() => onChange(page - 1)}>
        Trước
      </Pagination.Prev>
      {pageItems(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <Pagination.Ellipsis key={`gap-${i}`} disabled />
        ) : (
          <Pagination.Item key={p} active={p === page} disabled={disabled} onClick={() => onChange(p)}>
            {p + 1}
          </Pagination.Item>
        )
      )}
      <Pagination.Next disabled={disabled || page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Sau
      </Pagination.Next>
    </Pagination>
  );
}

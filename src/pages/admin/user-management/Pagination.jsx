// current: bắt đầu từ 0. Kết quả dạng: Trước 1 2 3 ... 271 Sau
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

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="um-pagination" aria-label="Phân trang">
      <button disabled={page === 0} onClick={() => onChange(page - 1)}>
        Trước
      </button>
      {getPages(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="um-page-gap">...</span>
        ) : (
          <button
            key={p}
            className={p === page ? "active" : ""}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p + 1}
          </button>
        )
      )}
      <button disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Sau
      </button>
    </nav>
  );
}

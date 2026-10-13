import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Spinner } from "react-bootstrap";
import { Star } from "lucide-react";
import { parseApiError } from "../../../api/apiError";
import { getWorkerReviewSummary, getWorkerReviews } from "../../../api/earningsApi";
import { StarRating } from "../../ui/StarRating";
import { formatRelative } from "../../../utils/format";
import { Paginator } from "./Paginator";

const ACCENT = "#F5820D";
const PAGE_SIZE = 10;
const STARS = [5, 4, 3, 2, 1];

function Summary({ summary }) {
  const total = summary.totalReviews;
  const avg = summary.averageRating == null ? null : Number(summary.averageRating);
  return (
    <Card className="border-0 shadow-sm rounded-4 mb-3">
      <Card.Body className="p-3 p-md-4 d-flex flex-column flex-sm-row gap-4 align-items-sm-center">
        <div className="text-center flex-shrink-0" style={{ minWidth: 120 }}>
          <div className="fw-bold text-dark" style={{ fontSize: "2.5rem", lineHeight: 1 }}>
            {avg == null ? "-" : avg.toFixed(1)}
          </div>
          <div className="d-flex justify-content-center my-2">
            <StarRating rating={avg == null ? 0 : Math.round(avg)} />
          </div>
          <div className="text-muted small">{total > 0 ? `${total} đánh giá` : "Chưa có đánh giá"}</div>
        </div>

        <div className="flex-grow-1" role="list" aria-label="Phân bố số sao">
          {STARS.map((star) => {
            const count = summary.distribution?.[star] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} role="listitem" className="d-flex align-items-center gap-2 mb-1"
                   aria-label={`${star} sao: ${count} đánh giá`}>
                <span className="small text-muted text-nowrap" style={{ width: 34 }}>{star} <Star size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" className="ms-1" style={{ verticalAlign: "-1px" }} /></span>
                <div className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: 8, background: "#F3F4F6" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: ACCENT }} />
                </div>
                <span className="small text-muted text-end" style={{ width: 34 }}>{count}</span>
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
}

function ReviewItem({ review }) {
  return (
    <Card className="border-0 shadow-sm rounded-4">
      <Card.Body className="p-3">
        <div className="d-flex align-items-start gap-3">
          <div
            className="rounded-circle bg-warning bg-opacity-10 fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 38, height: 38, color: ACCENT }}
            aria-hidden="true"
          >
            {review.customerName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-grow-1 min-width-0">
            <div className="d-flex flex-wrap justify-content-between gap-1">
              <span className="fw-semibold text-dark small">{review.customerName}</span>
              <span className="text-muted" style={{ fontSize: 11 }}>{formatRelative(review.createdAt, { fallback: "", maxDays: 7 })}</span>
            </div>
            <div className="d-flex align-items-center gap-2 my-1">
              <StarRating rating={review.rating} />
              <span className="visually-hidden">{review.rating} trên 5 sao</span>
              {review.requestCode && <span className="text-muted" style={{ fontSize: 11 }}>Đơn #{review.requestCode}</span>}
            </div>
            {review.comment ? (
              <p className="mb-0 small text-dark" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{review.comment}</p>
            ) : (
              <p className="mb-0 small text-muted fst-italic">Khách không để lại nhận xét.</p>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export function ReviewsTab({ active }) {
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const [sum, res] = await Promise.all([getWorkerReviewSummary(), getWorkerReviews({ page, size: PAGE_SIZE })]);
      if (mine !== seq.current) return;
      if (res.content.length === 0 && page > 0 && res.totalPages > 0) {
        setPage(res.totalPages - 1);
        return;
      }
      setSummary(sum);
      setData(res);
    } catch (e) {
      if (mine === seq.current) setError(parseApiError(e).message || "Không tải được đánh giá.");
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  const list = data?.content ?? [];

  return (
    <div>
      {error && (
        <div className="alert alert-danger small" role="alert">
          {error}{" "}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={load}>Thử lại</button>
        </div>
      )}

      {!data && loading && <div className="text-center py-5"><Spinner animation="border" style={{ color: ACCENT }} /></div>}

      {summary && data && (
        <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }} aria-busy={loading}>
          <Summary summary={summary} />
          {list.length === 0 ? (
            <div className="bg-white rounded-4 shadow-sm text-center text-muted small p-4">
              Chưa có nhận xét nào. Nhận xét sẽ xuất hiện sau khi khách đánh giá đơn đã hoàn thành.
            </div>
          ) : (
            <>
              <h6 className="fw-bold text-dark mb-3">Nhận xét từ khách hàng</h6>
              <div className="d-flex flex-column gap-2">
                {list.map((r) => <ReviewItem key={r.id} review={r} />)}
              </div>
              <Paginator page={page} totalPages={data.totalPages} onChange={setPage} disabled={loading} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

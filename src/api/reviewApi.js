import axiosClient from "./axiosClient";

/**
 * Đánh giá thợ sau khi hoàn thành
 *
 * Backend endpoints:
 * - POST /api/v1/reviews                     (khách) { requestId, rating: 1..5, comment? }
 * - GET  /api/v1/reviews/by-request/{id}     (khách chủ yêu cầu / thợ phụ trách) -> review hoặc null
 *
 * Mỗi yêu cầu chỉ đánh giá một lần. Thợ nhận { type: "REVIEW_RECEIVED" } ở /topic/user/{id}/matching.
 */

export const REVIEW_MAX_COMMENT = 1000;

export async function getReviewByRequest(requestId) {
  return (await axiosClient.get(`/reviews/by-request/${requestId}`)) ?? null;
}

export function createReview(requestId, rating, comment) {
  const body = { requestId, rating };
  if (comment && comment.trim()) body.comment = comment.trim();
  return axiosClient.post("/reviews", body);
}

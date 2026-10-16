import axiosClient from "./axiosClient";

/**
 * Báo giá
 *
 * Backend endpoints:
 * - POST  /api/v1/quotations                    (thợ)  { requestId, totalAmount, note? }
 * - GET   /api/v1/quotations/by-request/{id}    (khách chủ yêu cầu / thợ phụ trách)
 * - PATCH /api/v1/quotations/{id}/accept        (khách)
 * - PATCH /api/v1/quotations/{id}/reject        (khách)
 *
 * Realtime: khách nhận { type: "NEW_QUOTATION" } ở /topic/user/{id}/requests,
 *           thợ nhận { type: "QUOTATION_ACCEPTED" | "QUOTATION_REJECTED" } ở /topic/user/{id}/matching.
 */

export const QUOTATION_MIN_AMOUNT = 1000;
export const WARRANTY_MAX_DAYS = 3650;

export const WARRANTY_QUICK_DAYS = [7, 14, 30, 90, 365];

export async function getQuotationsByRequest(requestId) {
  return (await axiosClient.get(`/quotations/by-request/${requestId}`)) ?? [];
}

export function createQuotation(requestId, totalAmount, warrantyDays, note) {
  const days =
    warrantyDays === "" || warrantyDays == null ? 0 : Number(warrantyDays);
  const body = {
    requestId,
    totalAmount: Number(totalAmount),
    warrantyDays: days,
  };
  if (note && note.trim()) body.note = note.trim();
  return axiosClient.post("/quotations", body);
}

export const acceptQuotation = (id) => axiosClient.patch(`/quotations/${id}/accept`);
export const rejectQuotation = (id) => axiosClient.patch(`/quotations/${id}/reject`);

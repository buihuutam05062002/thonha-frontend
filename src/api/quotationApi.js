import axiosClient from "./axiosClient";

/**
 *
 * Backend endpoints:
 * - POST  /api/v1/quotations                    (thợ)  { requestId, totalAmount, note? }
 * - GET   /api/v1/quotations/by-request/{id}    (khách chủ yêu cầu / thợ phụ trách)
 * - PATCH /api/v1/quotations/{id}/accept        (khách)
 * - PATCH /api/v1/quotations/{id}/reject        (khách)
 *
 */

export const QUOTATION_MIN_AMOUNT = 1000;

export async function getQuotationsByRequest(requestId) {
  return (await axiosClient.get(`/quotations/by-request/${requestId}`)) ?? [];
}

export function createQuotation(requestId, totalAmount, note) {
  const body = { requestId, totalAmount: Number(totalAmount) };
  if (note && note.trim()) body.note = note.trim();
  return axiosClient.post("/quotations", body);
}

export const acceptQuotation = (id) => axiosClient.patch(`/quotations/${id}/accept`);
export const rejectQuotation = (id) => axiosClient.patch(`/quotations/${id}/reject`);

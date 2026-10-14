import axiosClient from "./axiosClient";

/**
 * Thanh toán online (chuyển khoản QR qua SePay) - phía khách hàng.
 *
 * Backend endpoints:
 * - GET  /api/v1/repair-requests/{id}/payment                  thanh toán đang chờ / đã thành công (data = null nếu chưa có)
 * - POST /api/v1/repair-requests/{id}/payment/bank-transfer    tạo (hoặc lấy lại) mã QR cho báo giá đã chấp nhận
 *
 * PaymentResponse: { paymentId, requestId, amount, status: PENDING_PAYMENT|SUCCESS|..., method: BANK_TRANSFER|CASH,
 *   paymentCode, qrUrl, bankName, bankAccount, accountHolder, createdAt }
 */

export const getPayment = (requestId) => axiosClient.get(`/repair-requests/${requestId}/payment`);

export const createBankTransferPayment = (requestId) =>
  axiosClient.post(`/repair-requests/${requestId}/payment/bank-transfer`);

import axiosClient from "./axiosClient";

/**
 * Thanh toán phía khách hàng — chỉ xem trạng thái.
 * Khách trả tiền trực tiếp cho thợ (tiền mặt hoặc chuyển khoản riêng), hệ thống không tạo QR cho khách.
 *
 * Backend endpoint:
 * - GET /api/v1/repair-requests/{id}/payment   thanh toán đã ghi nhận (data = null nếu thợ chưa chốt giá và hoàn thành đơn)
 *
 * PaymentResponse: { paymentId, requestId, amount, status: SUCCESS, method: CASH|BANK_TRANSFER, createdAt, ... }
 */
export const getPayment = (requestId) => axiosClient.get(`/repair-requests/${requestId}/payment`);

import axiosClient from "./axiosClient";

/**
 * Hoa hồng (quyền ADMIN).
 * - GET /api/v1/admin/commission-policies   -> { defaultRatePercent, defaultFromConfig, categoryPolicies[] }
 * - PUT /api/v1/admin/commission-policies   { categoryId?: number, ratePercent, active? }
 *       categoryId bỏ trống = tỷ lệ mặc định toàn hệ thống. Chỉ áp dụng cho đơn hoàn thành từ lúc lưu.
 * - GET /api/v1/admin/commissions?from=YYYY-MM-DD&to=YYYY-MM-DD&page=&size=   (từ ngày - đến ngày, gồm cả ngày `to`)
 * - GET /api/v1/admin/commissions/summary?from=&to=
 */

export const PAYMENT_METHODS = { CASH: "Tiền mặt", BANK_TRANSFER: "Chuyển khoản" };

export const fetchCommissionOverview = () => axiosClient.get("/admin/commission-policies");

export const saveCommissionPolicy = ({ categoryId, ratePercent, active }) =>
  axiosClient.put("/admin/commission-policies", {
    categoryId: categoryId ?? null,
    ratePercent,
    active, // undefined = để backend mặc định là bật
  });

export const fetchCommissionSummary = ({ from, to } = {}) =>
  axiosClient.get("/admin/commissions/summary", {
    params: { from: from || undefined, to: to || undefined },
  });

export const fetchCommissionSettlements = ({ from, to, page = 0, size = 10 } = {}) =>
  axiosClient.get("/admin/commissions", {
    params: { from: from || undefined, to: to || undefined, page, size },
  });

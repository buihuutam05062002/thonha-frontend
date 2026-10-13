import axiosClient from "./axiosClient";

/**
 * Hoa hồng (quyền ADMIN).
 * - GET /api/v1/admin/commission-policies   
 * - PUT /api/v1/admin/commission-policies   
 *       categoryId bỏ trống 
 * - GET /api/v1/admin/commissions?from=YYYY-MM-DD&to=YYYY-MM-DD&page=&size=  
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

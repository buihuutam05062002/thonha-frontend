import axiosClient from "./axiosClient";

/**
 * Thống kê tổng hợp (quyền ADMIN).
 * - GET /api/v1/admin/statistics?from=YYYY-MM-DD&to=YYYY-MM-DD   (gồm cả ngày `to`; bỏ trống = 30 ngày gần nhất, tối đa 366 ngày)
 *   -> {
 *        from, to,
 *        users:      { totalCustomers, approvedWorkers, pendingWorkerProfiles, newCustomers, newWorkerProfiles },
 *        requests:   { total, completed, cancelled, completionRate, byStatus: { PENDING_MATCH: n, ... } },
 *        revenue:    { orders, grossAmount, commissionAmount, workerAmount },
 *        complaints: { PENDING, PROCESSING, RESOLVED, REJECTED, ALL },
 *        reviews:    { averageRating, count },
 *        daily:      [{ date, requests, orders, grossAmount, commissionAmount }],   // đủ mọi ngày trong khoảng
 *        topCategories: [{ name, count }],
 *        topWorkers:    [{ workerId, fullName, orders, grossAmount, commissionAmount }]
 *      }
 */
export const fetchAdminStatistics = ({ from, to } = {}) =>
  axiosClient.get("/admin/statistics", {
    params: { from: from || undefined, to: to || undefined },
  });

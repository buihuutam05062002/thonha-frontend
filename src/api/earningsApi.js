import axiosClient from "./axiosClient";

/**
 *
 * Backend endpoints (quyền WORKER):
 * - GET /api/v1/worker/income?from=YYYY-MM-DD&to=YYYY-MM-DD  
 * - GET /api/v1/worker/requests?status=A,B&keyword=&page=&size=    
 *     (chi tiết một đơn: workerApi.getWorkerRequestDetail)
 * - GET /api/v1/worker/reviews?page=&size=                           
 * - GET /api/v1/worker/reviews/summary
 */

export const getWorkerIncome = ({ from, to } = {}) =>
  axiosClient.get("/worker/income", { params: { from: from || undefined, to: to || undefined } });

/**
 * @param {string[]} [statuses] giá trị RepairStatus của BE; rỗng = tất cả
 * @param {string} [keyword] tìm theo mã đơn
 * @returns {Promise<{content: object[], totalPages: number, totalElements: number}>}
 */
export async function searchWorkerOrders({ statuses = [], keyword = "", page = 0, size = 10 } = {}) {
  const res = await axiosClient.get("/worker/requests", {
    // Gửi dạng "A,B" vì axios mặc định gửi mảng là status[]=A, Spring không đọc được
    params: { status: statuses.length ? statuses.join(",") : undefined, keyword: keyword || undefined, page, size },
  });
  return pageOf(res);
}

export async function getWorkerReviews({ page = 0, size = 10 } = {}) {
  return pageOf(await axiosClient.get("/worker/reviews", { params: { page, size } }));
}

export const getWorkerReviewSummary = () => axiosClient.get("/worker/reviews/summary");

function pageOf(res) {
  return {
    content: res?.content ?? [],
    totalPages: res?.totalPages ?? 0,
    totalElements: res?.totalElements ?? 0,
  };
}

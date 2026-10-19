import axiosClient from "./axiosClient";

/**
 * Repair Request API
 *
 * Backend endpoints:
 * - POST   /api/v1/repair-requests            (multipart/form-data: part "data" + "files")
 * - GET    /api/v1/repair-requests
 * - GET    /api/v1/repair-requests/{id}
 * - PATCH  /api/v1/repair-requests/{id}/cancel
 *
 * Payload (part "data"):
 * {
 *   categoryId: number,
 *   description: string,
 *   priorityLevel: "LOW" | "MEDIUM" | "HIGH" | "URGENT",
 *   addressId?: number,
 *   addressText: string,
 *   lat?: number,
 *   lng?: number
 * }
 *
 * Mọi hàm đọc dữ liệu đều trả về object đã qua transformRequest()
 * (có thêm categoryName, addressText, attachmentUrls cho UI).
 */

const LEGACY_PRIORITY = { NORMAL: "MEDIUM" };

export async function createRepairRequest(data, files = []) {
  const formData = new FormData();

  const payload = {
    categoryId: data.categoryId,
    description: data.description,
    priorityLevel: LEGACY_PRIORITY[data.priorityLevel] ?? data.priorityLevel,
    addressId: data.addressId ?? null,
    addressText: data.addressText,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
  };

  formData.append(
    "data",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );

  files.forEach((file) => {
    if (file) formData.append("files", file);
  });

  const created = await axiosClient.post("/repair-requests", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000, // upload ảnh/video chậm hơn request thường; timeout ngắn dễ khiến khách bấm gửi lại và tạo yêu cầu trùng
  });
  return transformRequest(created);
}

/**
 * Lịch sử yêu cầu của tôi, có phân trang (BE: GET /repair-requests/my).
 * @param {string[]} [statuses] giá trị RepairStatus của BE; rỗng = tất cả
 * @param {string} [keyword]    tìm theo mã đơn
 * @returns {Promise<{content: object[], totalPages: number, totalElements: number}>}
 */
export async function searchMyRepairRequests({ statuses = [], keyword = "", page = 0, size = 10 } = {}) {
  const res = await axiosClient.get("/repair-requests/my", {
    // Gửi dạng "A,B" vì axios mặc định gửi mảng là status[]=A, Spring không đọc được
    params: { status: statuses.length ? statuses.join(",") : undefined, keyword: keyword || undefined, page, size },
  });
  return {
    content: (res?.content ?? []).map(transformRequest),
    totalPages: res?.totalPages ?? 0,
    totalElements: res?.totalElements ?? 0,
  };
}

export async function getRepairRequestById(id) {
  const request = await axiosClient.get(`/repair-requests/${id}`);
  return transformRequest(request);
}

export async function cancelRepairRequest(id) {
  const request = await axiosClient.patch(`/repair-requests/${id}/cancel`);
  return transformRequest(request);
}

/**
 * Vị trí gần nhất của thợ đang trên đường tới (BE: GET /{id}/worker-location).
 * @returns {Promise<{lat:number,lng:number,updatedAt:number}|null>}
 */
export async function getWorkerLocation(id) {
  return (await axiosClient.get(`/repair-requests/${id}/worker-location`)) ?? null;
}

export function transformRequest(request) {
  if (!request) return request;
  return {
    ...request,
    categoryName: request.categoryName ?? request.category?.name,
    addressText: request.addressText ?? request.address?.fullAddress,
    attachmentUrls: (request.attachments ?? []).map((a) => a.url).filter(Boolean),
  };
}

export async function fetchMySummary() {
  return (await axiosClient.get("/repair-requests/my/summary")) ?? { pendingQuotations: [], awaitingReview: [] };
}

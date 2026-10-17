import axiosClient from "./axiosClient";

/**
 * Worker Profile API
 * 
 * Backend endpoints:
 * - POST   /api/v1/worker/profile (multipart/form-data)
 * - GET    /api/v1/worker/profile
 * - PATCH  /api/v1/worker/availability
 * - PUT    /api/v1/worker/location
 * - PUT    /api/v1/worker/profile (nộp lại hồ sơ bị từ chối)
 * - GET    /api/v1/worker/requests/{id}
 * - PATCH  /api/v1/worker/requests/{id}/status
 * 
 * Register payload (data part):
 * {
 *   provinceCity: string,
 *   operatingArea: string,
 *   experienceYears: number,
 *   categoryIds: number[],
 *   agreePolicy: boolean
 * }
 * Files: cccdFront, cccdBack, certificates[], degrees[]
 */

/**
 * Register worker profile
 * @param {Object} data - Worker profile data
 * @param {string} data.provinceCity - Province/City
 * @param {string} data.operatingArea - Operating area
 * @param {number} data.experienceYears - Years of experience
 * @param {number[]} data.categoryIds - Service category IDs
 * @param {boolean} [data.agreePolicy=true] - Agreement to policy
 * @param {Object} files - Required documents
 * @param {File} files.cccdFront - CCCD front image (required)
 * @param {File} files.cccdBack - CCCD back image (required)
 * @param {File[]} [files.certificates] - Certificate images
 * @param {File[]} [files.degrees] - Degree images
 * @returns {Promise<Object>} Created worker profile
 */
export async function registerWorkerProfile(data, files) {
  const formData = new FormData();
  
  const payload = {
    provinceCity: data.provinceCity,
    operatingArea: data.operatingArea,
    experienceYears: Number(data.experienceYears),
    categoryIds: data.categoryIds,
    agreePolicy: data.agreePolicy ?? true,
  };
  
  formData.append(
    "data",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );
  
  formData.append("cccdFront", files.cccdFront);
  formData.append("cccdBack", files.cccdBack);
  
  if (files.certificates?.length) {
    files.certificates.forEach((f) => formData.append("certificates", f));
  }
  if (files.degrees?.length) {
    files.degrees.forEach((f) => formData.append("degrees", f));
  }
  
  return axiosClient.post("/worker/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * Nộp lại hồ sơ đã bị từ chối. Giấy tờ không chọn lại thì BE giữ bản cũ.
 * @param {Object} data - giống registerWorkerProfile
 * @param {Object} [files] - cccdFront?, cccdBack?, certificates?, degrees?
 */
export async function resubmitWorkerProfile(data, files = {}) {
  const formData = new FormData();
  const payload = {
    provinceCity: data.provinceCity,
    operatingArea: data.operatingArea,
    experienceYears: Number(data.experienceYears),
    categoryIds: data.categoryIds,
    agreePolicy: data.agreePolicy ?? true,
  };
  formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (files.cccdFront) formData.append("cccdFront", files.cccdFront);
  if (files.cccdBack) formData.append("cccdBack", files.cccdBack);
  (files.certificates || []).forEach((f) => formData.append("certificates", f));
  (files.degrees || []).forEach((f) => formData.append("degrees", f));

  return axiosClient.put("/worker/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * Get current user's worker profile
 * @returns {Promise<Object|null>} Worker profile or null if not found
 */
export async function getMyWorkerProfile() {
  try {
    return await axiosClient.get("/worker/profile");
  } catch (error) {
    if (error.status === 404 || error.code === "WORKER_NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

/**
 * Update worker availability status
 * @param {boolean} available - True for online/ready, false for offline
 * @returns {Promise<Object>} Updated worker profile
 */
export async function updateWorkerAvailability(available) {
  return axiosClient.patch("/worker/availability", { available });
}

/**
 * Gửi vị trí GPS hiện tại của thợ (backend lưu vào Redis để ghép thợ theo khoảng cách).
 * Chỉ có tác dụng khi thợ đang ở trạng thái sẵn sàng.
 * @param {number} lat
 * @param {number} lng
 */
export async function updateWorkerLocation(lat, lng) {
  return axiosClient.put("/worker/location", { lat, lng });
}

/**
 * Dữ liệu tổng hợp cho dashboard: thống kê, yêu cầu đang chờ phản hồi, đơn gần đây, thu nhập 7 ngày.
 * @returns {Promise<{summary:Object, incomingRequests:Array, recentOrders:Array, weeklyIncome:Array}>}
 */
export async function getWorkerDashboard() {
  return axiosClient.get("/worker/dashboard");
}

/**
 * Thợ chấp nhận / từ chối yêu cầu được hệ thống gửi tới.
 * @param {number} requestId
 * @param {number} matchingLogId
 * @param {"ACCEPTED"|"REJECTED"} result
 * @param {string} [note]
 */
export async function respondToMatching(requestId, matchingLogId, result, note) {
  return axiosClient.post(`/repair-requests/${requestId}/matching-response`, {
    matchingLogId,
    result,
    note,
  });
}

/**
 * Chi tiết yêu cầu mà thợ đang/đã phụ trách (địa chỉ, mô tả, ảnh đính kèm...).
 * @param {number} requestId
 */
export async function getWorkerRequestDetail(requestId) {
  return axiosClient.get(`/worker/requests/${requestId}`);
}

/**
 * Thợ chuyển trạng thái đơn sang bước kế tiếp.
 * @param {number} requestId
 * @param {"ON_THE_WAY"|"IN_PROGRESS"|"COMPLETED"} status
 */
export async function updateRequestStatus(requestId, status) {
  return axiosClient.patch(`/worker/requests/${requestId}/status`, { status });
}

// Alias for backward compatibility
export const registerWorker = registerWorkerProfile;
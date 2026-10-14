import axiosClient from "./axiosClient";

/**
 * Khiếu nại / tranh chấp.
 *
 * Phía khách / thợ (đăng nhập bất kỳ, quyền theo từng đơn kiểm tra ở BE):
 * - POST /api/v1/complaints        (multipart: part "data" { requestId, reason, description } + "files" tối đa 5 ảnh)
 * - GET  /api/v1/complaints/my?requestId=      (requestId tùy chọn)
 *
 * Phía admin (quyền ADMIN):
 * - GET  /api/v1/admin/complaints?status=&reason=&keyword=&page=&size=
 * - GET  /api/v1/admin/complaints/stats             { PENDING, PROCESSING, RESOLVED, REJECTED, ALL }
 * - GET  /api/v1/admin/complaints/{id}
 * - POST /api/v1/admin/complaints/{id}/take         nhận xử lý (PENDING -> PROCESSING)
 * - POST /api/v1/admin/complaints/{id}/resolve      { status: RESOLVED | REJECTED, resolution }
 *
 * Kênh WebSocket báo tiến trình cho người gửi: /topic/user/{id}/complaints
 * (type: COMPLAINT_PROCESSING | COMPLAINT_RESOLVED | COMPLAINT_REJECTED).
 * Admin cũng nghe kênh này của chính mình để biết có khiếu nại mới (type: COMPLAINT_CREATED).
 */

export const COMPLAINT_STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  REJECTED: "Từ chối",
};

export const COMPLAINT_REASON_LABELS = {
  POOR_QUALITY: "Chất lượng kém",
  OVERCHARGED: "Tính phí sai",
  LATE_ARRIVAL: "Đến trễ",
  NO_SHOW: "Thợ không đến",
  RUDE_BEHAVIOR: "Thái độ không tốt",
  OTHER: "Lý do khác",
};

export const complaintStatusLabel = (c) => c.statusLabel || COMPLAINT_STATUS_LABELS[c.status] || c.status;
export const complaintReasonLabel = (c) => c.reasonLabel || COMPLAINT_REASON_LABELS[c.reason] || c.reason;

// ---------------------------------------------------------------- khách / thợ
export async function createComplaint({ requestId, reason, description, files = [] }) {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([JSON.stringify({ requestId, reason, description: description?.trim() })], { type: "application/json" }),
  );
  files.forEach((file) => {
    if (file) formData.append("files", file);
  });
  return axiosClient.post("/complaints", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
}

/** Khiếu nại mình đã gửi, mới nhất trước. Truyền requestId để chỉ lấy của một đơn. */
export const fetchMyComplaints = ({ requestId } = {}) =>
  axiosClient.get("/complaints/my", { params: { requestId: requestId ?? undefined } });

// ---------------------------------------------------------------- admin
export const fetchComplaints = ({ status, reason, keyword, page = 0, size = 8 } = {}) =>
  axiosClient.get("/admin/complaints", {
    params: {
      status: status || undefined,
      reason: reason || undefined,
      keyword: keyword?.trim() || undefined,
      page,
      size,
    },
  });

export const fetchComplaintStats = () => axiosClient.get("/admin/complaints/stats");

export const fetchComplaint = (id) => axiosClient.get(`/admin/complaints/${id}`);

export const takeComplaint = (id) => axiosClient.post(`/admin/complaints/${id}/take`);

export const resolveComplaint = (id, { status, resolution }) =>
  axiosClient.post(`/admin/complaints/${id}/resolve`, { status, resolution: resolution.trim() });

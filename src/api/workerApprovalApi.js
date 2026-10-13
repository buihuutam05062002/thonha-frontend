import axiosClient from "./axiosClient";

export const STATUSES = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Đã từ chối" },
];

export const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label ?? v;

export const DOC_LABELS = {
  CCCD_FRONT: "CCCD mặt trước",
  CCCD_BACK: "CCCD mặt sau",
  CERTIFICATE: "Chứng chỉ nghề",
  DEGREE: "Bằng cấp",
};

export const docLabel = (t) => DOC_LABELS[t] ?? t;

export async function fetchWorkerProfiles({ status, keyword, city, page = 0, size = 8 } = {}) {
  return axiosClient.get("/admin/worker-profiles", {
    params: {
      status: status || undefined,
      keyword: keyword?.trim() || undefined,
      city: city?.trim() || undefined,
      page,
      size,
      sort: status === "PENDING" ? "id,asc" : status ? "reviewedAt,desc" : "id,desc",
    },
  });
}

export const fetchWorkerProfileStats = () => axiosClient.get("/admin/worker-profiles/stats");
export const fetchWorkerProfileDetail = (id) => axiosClient.get(`/admin/worker-profiles/${id}`);
export const approveWorkerProfile = (id) => axiosClient.patch(`/admin/worker-profiles/${id}/approve`);
export const rejectWorkerProfile = (id, reason) =>
  axiosClient.patch(`/admin/worker-profiles/${id}/reject`, { reason });

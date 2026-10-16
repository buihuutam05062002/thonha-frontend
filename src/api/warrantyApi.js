import axiosClient from "./axiosClient";


/**
 * @param {{requestId:number, quotationId:number, description:string}} data
 * @param {File[]} files 
 */
export function createWarrantyClaim(data, files = []) {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob(
      [JSON.stringify({ ...data, description: data.description?.trim() })],
      { type: "application/json" },
    ),
  );
  files.forEach((file) => file && formData.append("files", file));
  return axiosClient.post("/warranty-claims", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
}

export const getMyWarrantyClaims = ({ requestId } = {}) =>
  axiosClient.get("/warranty-claims/my", {
    params: { requestId: requestId ?? undefined },
  });

export function getWarranties({ tab = "PENDING", keyword = "" } = {}) {
  return axiosClient.get("/worker/warranties", { params: { tab, keyword } });
}

export function getWarrantyCounts() {
  return axiosClient.get("/worker/warranties/counts");
}

export function getWarranty(claimId) {
  return axiosClient.get(`/worker/warranties/${claimId}`);
}

export function acceptWarranty(claimId, payload) {
  return axiosClient.post(`/worker/warranties/${claimId}/accept`, payload);
}

export function rejectWarranty(claimId, reason) {
  return axiosClient.post(`/worker/warranties/${claimId}/reject`, { reason });
}

export function completeWarranty(claimId, payload, files = []) {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  files.forEach((file) => formData.append("files", file));
  return axiosClient.post(`/worker/warranties/${claimId}/complete`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

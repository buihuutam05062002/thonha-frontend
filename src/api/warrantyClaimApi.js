import axiosClient from "./axiosClient";

export async function fetchMyWarrantyClams({ requestId } = {}) {
  const res = await axiosClient.get("/warranty-claims/my", {
    params: { requestId: requestId ?? undefined },
  });
  return res ?? [];
}

export function createWarrantyClaim(
  { requestId, quotationId, description },
  files = [],
) {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([JSON.stringify({ requestId, quotationId, description })], {
      type: "application/json",
    }),
  );
  files.forEach((f) => f && formData.append("files", f));
  return axiosClient.post("/warranty-claims", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
}
export async function fetchMyWarrantyClaims({ requestId } = {}) {
  const res = await axiosClient.get("/warranty-claims/my", {
    params: { requestId: requestId ?? undefined },
  });
  return res ?? [];
}

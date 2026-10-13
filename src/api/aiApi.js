import axiosClient from "./axiosClient";

/**
 * AI API
 *
 * - POST /api/v1/ai/classify-incident (multipart/form-data: "description" + "files")
 *
 * Trả về:
 * {
 *   categoryId: number | null,  
 *   categoryName: string | null,
 *   confidence: number,     
 *   summary: string,
 *   reason: string
 * }
 */
export async function classifyIncident(description, files = []) {
  const formData = new FormData();
  formData.append("description", description ?? "");
  files.forEach((file) => {
    if (file) formData.append("files", file);
  });

  return axiosClient.post("/ai/classify-incident", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000, // AI đọc ảnh có thể chậm hơn request thường
  });
}

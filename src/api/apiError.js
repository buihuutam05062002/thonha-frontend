import axios from "axios";

const NETWORK_MESSAGE =
  "Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.";

/**
 * Chuẩn hoá mọi loại lỗi về { code, message, status, errors }
 * @param {Error} error
 */
export function parseApiError(error) {
  // Lỗi axios thô (còn response từ server)
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    return {
      code: data.code,
      message: data.message || error.message,
      status: error.response.status,
      errors: data.errors,
    };
  }

  // Lỗi đã được axiosClient chuẩn hoá (có code/status/errors)
  if (error && (error.code || error.status !== undefined)) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      errors: error.errors,
    };
  }

  // Lỗi thường (vd: new Error("...")) -> giữ nguyên thông điệp
  if (error instanceof Error && error.message && !axios.isAxiosError(error)) {
    return { code: "UNKNOWN", message: error.message, status: 0, errors: null };
  }

  return { code: "NETWORK_ERROR", message: NETWORK_MESSAGE, status: 0, errors: null };
}

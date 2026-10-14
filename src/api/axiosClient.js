import axios from "axios";
import { expireSession, getAccessToken, getRefreshToken, saveSession } from "./session";

/**
 * Unified Axios client for Thonha FE
 *
 * Backend trả về wrapper ApiResponse:
 * { success, code, message, data, errors, timestamp, path }
 *
 * Client này:
 *  - tự bóc `data` khi `success = true`
 *  - ném Error có cấu trúc (message, code, errors, status) khi thất bại
 *  - với response KHÔNG có wrapper (vd: /admin/users trả thẳng Page, /maps trả JSON của Goong)
 *    thì trả nguyên body
 *  - tự refresh access token khi gặp 401 (trừ các endpoint /auth/*)
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Các endpoint xác thực: 401 ở đây nghĩa là sai thông tin đăng nhập / refresh token hỏng,
// KHÔNG phải access token hết hạn -> không được thử refresh.
const isAuthEndpoint = (url = "") => /\/auth\/(login|register|refresh|logout)/.test(url);

const STATUS_MESSAGES = {
  400: "Yêu cầu không hợp lệ",
  401: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
  403: "Bạn không có quyền thực hiện thao tác này",
  404: "Không tìm thấy dữ liệu",
  413: "Tệp tải lên quá lớn",
};

function normalizeError(error) {
  const status = error.response?.status;
  const body = error.response?.data;
  const isObj = body && typeof body === "object";

  let message;
  if (!error.response) {
    message = "Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.";
  } else if (isObj && body.message) {
    message = body.message;
  } else if (status >= 500) {
    message = "Máy chủ đang gặp sự cố, vui lòng thử lại sau";
  } else {
    message = STATUS_MESSAGES[status] || error.message || "Có lỗi xảy ra";
  }

  // Lỗi validation: hiển thị luôn lỗi của field đầu tiên cho dễ hiểu
  if (isObj && body.code === "VALIDATION_ERROR" && body.errors && typeof body.errors === "object") {
    const first = Object.values(body.errors)[0];
    if (first) message = String(first);
  }

  const normalized = new Error(message);
  normalized.code = (isObj && body.code) || (error.response ? error.code : "NETWORK_ERROR");
  normalized.errors = isObj ? body.errors : undefined;
  normalized.status = status ?? 0;
  normalized.isAxiosError = true;
  return normalized;
}

axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    const apiResponse = response.data;
    if (apiResponse && typeof apiResponse === "object" && "success" in apiResponse) {
      if (apiResponse.success) {
        return apiResponse.data;
      }
      const error = new Error(apiResponse.message || "Request failed");
      error.code = apiResponse.code;
      error.errors = apiResponse.errors;
      error.status = response.status;
      error.isAxiosError = true;
      throw error;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      const storedRefreshToken = getRefreshToken();
      if (!storedRefreshToken) {
        expireSession();
        return Promise.reject(normalizeError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const auth = response.data?.data ?? response.data;
        if (!auth?.accessToken) {
          throw new Error("No access token in refresh response");
        }

        // BE xoay vòng refresh token: token cũ bị thu hồi ngay -> BẮT BUỘC lưu token mới
        saveSession(auth);

        originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;
        processQueue(null, auth.accessToken);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        expireSession();
        return Promise.reject(
          refreshError.response ? normalizeError(refreshError) : refreshError
        );
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export default axiosClient;

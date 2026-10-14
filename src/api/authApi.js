import axiosClient from "./axiosClient";
import { clearSession, getRefreshToken } from "./session";

// register / login / refreshToken trả về { accessToken, refreshToken, user } nhưng KHÔNG tự lưu:
// nơi gọi dùng saveSession() (api/session.js).

export async function register({ fullName, email, phoneNumber, password }) {
  return axiosClient.post("/auth/register", { fullName, email, phoneNumber, password });
}

// account: email hoặc số điện thoại
export async function login({ account, password }) {
  return axiosClient.post("/auth/login", { account, password });
}

export async function refreshToken() {
  const token = getRefreshToken();
  if (!token) {
    throw new Error("No refresh token available");
  }
  return axiosClient.post("/auth/refresh", { refreshToken: token });
}

export async function logout() {
  const token = getRefreshToken();
  try {
    if (token) {
      await axiosClient.post("/auth/logout", { refreshToken: token });
    }
  } finally {
    clearSession();
  }
}

export async function getMe() {
  return axiosClient.get("/users/me");
}

// Chỉ đổi họ tên; ảnh đại diện dùng uploadAvatar
export async function updateProfile({ fullName }) {
  return axiosClient.put("/users/me", { fullName });
}

// multipart; BE upload lên Cloudinary rồi lưu URL
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

import axiosClient from "./axiosClient";
import { clearSession, getRefreshToken } from "./session";


export async function register({ fullName, email, phoneNumber, password }) {
  return axiosClient.post("/auth/register", { fullName, email, phoneNumber, password });
}

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

export async function updateProfile({ fullName }) {
  return axiosClient.put("/users/me", { fullName });
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

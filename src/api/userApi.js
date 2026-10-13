import axiosClient, { API_BASE_URL } from "./axiosClient";

export { API_BASE_URL };

export const ROLES = [
  { value: "CUSTOMER", label: "Khách hàng" },
  { value: "WORKER", label: "Thợ" },
  { value: "ADMIN", label: "Quản trị viên" },
];

export const USER_STATUSES = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Không hoạt động" },
  { value: "LOCKED", label: "Bị khóa" },
  { value: "DELETED", label: "Đã xóa" },
];

const toViewModel = (u) => ({ ...u, name: u.fullName, userStatus: u.status });

export async function fetchUsers({ keyword, role, userStatus, page = 0, size = 20 }) {
  const params = { page, size, sort: "id,desc" };
  if (keyword?.trim()) params.keyword = keyword.trim();
  if (role) params.role = role;
  if (userStatus) params.userStatus = userStatus;

  const data = await axiosClient.get("/admin/users", { params });
  return {
    content: (data?.content ?? []).map(toViewModel),
    totalPages: data?.totalPages ?? 0,
  };
}

export async function fetchUserById(id) {
  const data = await axiosClient.get(`/admin/users/${id}`);
  return toViewModel(data);
}

export async function updateUserStatus(id, userStatus) {
  const data = await axiosClient.patch(`/admin/users/${id}/status`, null, {
    params: { status: userStatus },
  });
  return toViewModel(data);
}

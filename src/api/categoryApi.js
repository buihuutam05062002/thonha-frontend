import axiosClient from "./axiosClient";

export async function getCategories() {
  return axiosClient.get("/service-categories");
}

export async function getCategoryById(id) {
  return axiosClient.get(`/service-categories/${id}`);
}

export async function createCategory({ name, description, icon }) {
  return axiosClient.post("/service-categories", { name, description, icon });
}

export async function updateCategory(id, { name, description, icon, status }) {
  return axiosClient.put(`/service-categories/${id}`, { name, description, icon, status });
}

export async function deleteCategory(id) {
  return axiosClient.delete(`/service-categories/${id}`);
}

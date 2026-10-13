import axiosClient from "./axiosClient";

export async function getAddresses() {
  return axiosClient.get("/addresses");
}

export async function createAddress({ label, fullAddress, lat, lng, defaultAddress = false }) {
  return axiosClient.post("/addresses", { label, fullAddress, lat, lng, defaultAddress });
}

export async function updateAddress(id, { label, fullAddress, lat, lng, defaultAddress }) {
  return axiosClient.put(`/addresses/${id}`, { label, fullAddress, lat, lng, defaultAddress });
}

export async function deleteAddress(id) {
  return axiosClient.delete(`/addresses/${id}`);
}

export async function setDefaultAddress(id) {
  return axiosClient.patch(`/addresses/${id}/default`);
}

import axios from "axios";

const axiosProvince = axios.create({
  baseURL: "https://provinces.open-api.vn/api/v2",
  timeout: 15000,
});

export async function getProvinces() {
  const { data } = await axiosProvince.get("/p/");
  return Array.isArray(data) ? data.map((p) => p?.name).filter(Boolean) : [];
}
 
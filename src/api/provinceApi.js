import axios from "axios";


const callApi = "https://provinces.open-api.vn/api/v2"

const axiosProvince = axios.create({
  baseURL: callApi,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getProvinces(){
    return axiosProvince.get()
}

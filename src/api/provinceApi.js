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

// console.log( await getProvinces())


async function test(){
    const response = await axiosProvince.get();
    return response.data;
}
console.log(await test())


// const name =  await getProvinces().;

// console.log(await getProvinces())
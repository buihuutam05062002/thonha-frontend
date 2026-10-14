import axiosClient from "./axiosClient";

export async function autocompleteAddress(input) {
  const response = await axiosClient.get(
    `/maps/autocomplete?input=${encodeURIComponent(input)}`,
  );
  return (response.predictions || []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    chinh: p.structured_formatting?.main_text || p.description,
    phu: p.structured_formatting?.secondary_text || "",
  }));
}

/**
 * Lấy vị trí hiện tại của thiết bị (GPS). Trình duyệt sẽ hỏi quyền; chỉ chạy trên HTTPS hoặc localhost.
 * @returns {Promise<{lat:number,lng:number}>}
 */
export function getCurrentPosition({ maximumAge = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ định vị'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Bạn chưa cho phép truy cập vị trí. Hãy bật quyền vị trí hoặc nhập địa chỉ thủ công'
            : err.code === err.TIMEOUT
              ? 'Lấy vị trí quá lâu, vui lòng thử lại'
              : 'Không xác định được vị trí hiện tại';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge }
    );
  });
}

/**
 * Reverse geocode: tọa độ -> địa chỉ chữ (Goong).
 * @returns {Promise<string|null>} địa chỉ, hoặc null nếu không tìm thấy
 */
export async function reverseGeocode(lat, lng) {
  const response = await axiosClient.get(`/maps/reverse?lat=${lat}&lng=${lng}`);
  return response.results?.[0]?.formatted_address ?? null;
}

export async function getPlaceDetail(placeId) {
  const response = await axiosClient.get(
    `/maps/place?placeId=${encodeURIComponent(placeId)}`,
  );
  const loc = response.result?.geometry?.location;
  return { lat: loc?.lat ?? null, lng: loc?.lng ?? null };
}

import axiosClient from "./axiosClient";

/**
 * Lịch làm việc cá nhân của thợ (khung giờ rảnh / bận)
 *
 * Backend endpoints (cần quyền WORKER, hồ sơ đã duyệt):
 * - GET    /api/v1/worker/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
 * - POST   /api/v1/worker/schedule        { workDate, startTime: "HH:mm", endTime: "HH:mm", status?: "AVAILABLE" | "DAY_OFF" }
 * - PUT    /api/v1/worker/schedule/{id}   (cùng body)
 * - DELETE /api/v1/worker/schedule/{id}
 *
 * status: AVAILABLE = rảnh, DAY_OFF = bận/nghỉ, BOOKED = đã có đơn (hệ thống đặt, chỉ xem).
 */

export const SCHEDULE_MAX_DAYS_AHEAD = 90;

export async function getSchedule(from, to) {
  return (await axiosClient.get("/worker/schedule", { params: { from, to } })) ?? [];
}

export const createScheduleSlot = (slot) => axiosClient.post("/worker/schedule", slot);
export const updateScheduleSlot = (id, slot) => axiosClient.put(`/worker/schedule/${id}`, slot);
export const deleteScheduleSlot = (id) => axiosClient.delete(`/worker/schedule/${id}`);

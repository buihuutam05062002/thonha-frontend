import axiosClient from "./axiosClient";

/**
 *
 * Backend endpoints
 * - GET    /api/v1/worker/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
 * - POST   /api/v1/worker/schedule      
 * - PUT    /api/v1/worker/schedule/{id}  
 * - DELETE /api/v1/worker/schedule/{id}
 *
 */

export const SCHEDULE_MAX_DAYS_AHEAD = 90;

export async function getSchedule(from, to) {
  return (await axiosClient.get("/worker/schedule", { params: { from, to } })) ?? [];
}

export const createScheduleSlot = (slot) => axiosClient.post("/worker/schedule", slot);
export const updateScheduleSlot = (id, slot) => axiosClient.put(`/worker/schedule/${id}`, slot);
export const deleteScheduleSlot = (id) => axiosClient.delete(`/worker/schedule/${id}`);

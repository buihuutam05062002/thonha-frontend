import React, { useEffect, useState } from "react";
import { Navigation, Send, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { acceptWarranty, getWarranty } from "../../../api/warrantyApi";
import { parseApiError } from "../../../api/apiError";
import { notifySuccess } from "../../../utils/notify";
import { TIME_SLOTS, todayLocal } from "./warrantyFormat";

const ScheduleWarrantyModal = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("08:00");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getWarranty(claimId)
      .then((data) => {
        if (cancelled) return;
        if (data.status !== "PENDING") {
          navigate(`/worker/warranty/${claimId}`, { replace: true });
          return;
        }
        setClaim(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            parseApiError(err).message || "Không tải được phiếu bảo hành.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [claimId, navigate]);

  const handleOpenMap = () => {
    if (!claim) return;
    const url =
      claim.lat != null && claim.lng != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${claim.lat},${claim.lng}&travelmode=driving`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(claim.addressText || "")}`;
    window.open(url, "_blank");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await acceptWarranty(claimId, { appointmentDate, appointmentTime, note });
      notifySuccess("Đã nhận bảo hành và hẹn lịch với khách.");
      navigate(`/worker/warranty/${claimId}`, { replace: true });
    } catch (err) {
      setError(
        parseApiError(err).message ||
          "Không thể gửi lịch hẹn, vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FFF4E6] flex items-center justify-center text-[#F5820D]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Hẹn Lịch Khảo Sát Bảo Hành
              </h2>
            </div>
            <button
              onClick={() => navigate(`/worker/warranty/${claimId}`)}
              className="text-gray-400 text-xs font-semibold hover:text-gray-700 transition"
            >
              Hủy
            </button>
          </div>

          <div className="mt-5 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-center justify-between gap-3">
            <div className="space-y-0.5 overflow-hidden">
              <p className="text-xs font-bold text-[#F5820D] uppercase">
                Địa chỉ khách hàng
              </p>
              <p className="text-xs text-gray-700 truncate">
                {claim ? claim.addressText : "Đang tải địa chỉ..."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenMap}
              disabled={!claim}
              className="flex items-center gap-1.5 bg-[#F5820D] text-white px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 shrink-0 hover:bg-[#e0750c] transition shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" /> Chỉ đường
            </button>
          </div>

          <form
            id="schedule-form"
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Ngày qua kiểm tra <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={todayLocal()}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:ring-1 focus:ring-[#F5820D] focus:border-[#F5820D] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Khung giờ hẹn <span className="text-red-500">*</span>
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:ring-1 focus:ring-[#F5820D] focus:border-[#F5820D] focus:outline-none bg-white transition"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Ghi chú cho khách hàng
              </label>
              <textarea
                rows="3"
                maxLength={500}
                placeholder="VD: Em sẽ qua tháo kiểm tra lại quạt tản nhiệt..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:ring-1 focus:ring-[#F5820D] focus:border-[#F5820D] focus:outline-none transition"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </form>
        </div>

        <button
          type="submit"
          form="schedule-form"
          disabled={submitting || !claim}
          className="w-full py-3.5 bg-[#F5820D] text-white font-semibold rounded-xl text-sm hover:bg-[#e0750c] transition flex items-center justify-center gap-2 mt-8 disabled:opacity-50 shadow-md shadow-orange-500/20"
        >
          <Send className="w-4 h-4" />{" "}
          {submitting ? "Đang gửi..." : "Xác nhận & Gửi lịch cho khách"}
        </button>
      </div>
    </div>
  );
};

export default ScheduleWarrantyModal;

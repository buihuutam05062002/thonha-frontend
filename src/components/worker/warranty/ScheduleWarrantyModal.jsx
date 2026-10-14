import React, { useState } from "react";
import { Calendar, Clock, MapPin, Navigation, Send } from "lucide-react";

const ScheduleWarrantyModal = ({ onConfirm, onClose }) => {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ appointmentDate, appointmentTime, note });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white p-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">
            Hẹn Lịch Khảo Sát Bảo Hành
          </h2>
          <button onClick={onClose} className="text-gray-400 text-sm">
            Hủy
          </button>
        </div>

        {/* Thông tin vị trí + Dẫn đường Goong Map */}
        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-blue-900">
              Địa chỉ khách hàng
            </p>
            <p className="text-xs text-blue-700 truncate max-w-[220px]">
              123 Nguyễn Văn Linh, Đà Nẵng
            </p>
          </div>
          <button
            onClick={() => window.open("https://maps.goong.io", "_blank")}
            className="flex items-center gap-1 bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium"
          >
            <Navigation className="w-3 h-3" /> Chỉ đường
          </button>
        </div>

        {/* Form chọn thời gian */}
        <form
          id="schedule-form"
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Ngày qua kiểm tra <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Khung giờ hẹn <span className="text-red-500">*</span>
            </label>
            <select
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="08:00">08:00 - 10:00 (Sáng)</option>
              <option value="10:00">10:00 - 12:00 (Trưa)</option>
              <option value="14:00">14:00 - 16:00 (Chiều)</option>
              <option value="16:00">16:00 - 18:00 (Chiều tối)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Ghi chú cho khách hàng
            </label>
            <textarea
              rows="3"
              placeholder="VD: Em sẽ qua tháo kiểm tra lại quạt tản nhiệt..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </form>
      </div>

      <button
        type="submit"
        form="schedule-form"
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-6"
      >
        <Send className="w-4 h-4" /> Xác nhận & Gửi lịch cho khách
      </button>
    </div>
  );
};

export default ScheduleWarrantyModal;

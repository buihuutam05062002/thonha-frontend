import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Upload, Camera } from "lucide-react";

const CompleteWarrantyPage = ({ onBack, onSubmitComplete }) => {
  const [reasonType, setReasonType] = useState("TECHNICAL_ERROR");
  const [resolutionText, setResolutionText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitComplete({ reasonType, resolutionText });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-3 border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="p-1 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-800">Hoàn Tất Bảo Hành</h1>
      </div>

      <form
        id="complete-form"
        onSubmit={handleSubmit}
        className="p-4 space-y-4"
      >
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase">
            Xác định nguyên nhân sự cố <span className="text-red-500">*</span>
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition hover:bg-gray-50">
              <input
                type="radio"
                name="reason"
                value="TECHNICAL_ERROR"
                checked={reasonType === "TECHNICAL_ERROR"}
                onChange={(e) => setReasonType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  Lỗi thao tác kỹ thuật cũ
                </p>
                <p className="text-[11px] text-gray-500">
                  Bảo hành miễn phí 100% cho khách
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition hover:bg-gray-50">
              <input
                type="radio"
                name="reason"
                value="COMPONENT_FAULT"
                checked={reasonType === "COMPONENT_FAULT"}
                onChange={(e) => setReasonType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  Lỗi linh kiện từ NSX
                </p>
                <p className="text-[11px] text-gray-500">
                  Đã đổi linh kiện mới cho khách
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition hover:bg-gray-50">
              <input
                type="radio"
                name="reason"
                value="CUSTOMER_USAGE"
                checked={reasonType === "CUSTOMER_USAGE"}
                onChange={(e) => setReasonType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  Lỗi phát sinh mới / Do khách dùng sai
                </p>
                <p className="text-[11px] text-gray-500">
                  Khách đã thỏa thuận thanh toán thêm
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Nội dung đã khắc phục */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-gray-700 uppercase">
            Mô tả công việc đã xử lý <span className="text-red-500">*</span>
          </label>
          <textarea
            rows="3"
            required
            placeholder="VD: Đã siết lại giắc nối ống thoát nước và vệ sinh lại máng nước..."
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Upload ảnh hoàn thành */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-gray-700 uppercase">
            Ảnh nghiệm thu bảo hành
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50">
            <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">
              Bấm để chụp hoặc tải ảnh nghiệm thu
            </p>
          </div>
        </div>
      </form>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white p-3 border-t border-gray-200">
        <button
          type="submit"
          form="complete-form"
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Nghiệm thu & Kết thúc bảo hành
        </button>
      </div>
    </div>
  );
};

export default CompleteWarrantyPage;

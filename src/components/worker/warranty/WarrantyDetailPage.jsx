import React from "react";
import {
  ArrowLeft,
  ShieldAlert,
  Calendar,
  MapPin,
  Wrench,
  AlertTriangle,
} from "lucide-react";

const WarrantyDetailPage = ({ onBack, onAccept, onReject }) => {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-3 border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="p-1 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-800">
          Chi Tiết Yêu Cầu Bảo Hành
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Khối Sự cố Khách Báo */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
            <AlertTriangle className="w-4 h-4" /> Báo cáo lỗi từ khách hàng
          </div>
          <p className="text-xs text-red-900 leading-relaxed font-medium">
            "Máy lạnh sau khi sửa 3 ngày lại bị chảy nước nhiều ở cục lạnh,
            không làm mát được."
          </p>

          {/* Ảnh bằng chứng từ khách */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <img
              src="https://via.placeholder.com/100"
              alt="Bằng chứng 1"
              className="rounded-lg object-cover w-full h-20 border border-red-200"
            />
            <img
              src="https://via.placeholder.com/100"
              alt="Bằng chứng 2"
              className="rounded-lg object-cover w-full h-20 border border-red-200"
            />
          </div>
        </div>

        {/* Khối Thông tin Đơn hàng Gốc */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Thông tin đơn gốc
          </h2>

          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Mã đơn gốc:</span>
            <span className="font-semibold text-gray-800">#REQ-100293</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Dịch vụ:</span>
            <span className="font-semibold text-gray-800">
              Sửa chữa máy lạnh
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Ngày hoàn thành:</span>
            <span className="font-semibold text-gray-800">01/10/2026</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Hạn bảo hành đến:</span>
            <span className="font-semibold text-green-600">
              30/10/2026 (Còn 18 ngày)
            </span>
          </div>
        </div>

        {/* Thông tin khách hàng & Địa chỉ */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Khách hàng & Địa chỉ
          </h2>
          <p className="text-sm font-semibold text-gray-800">
            Nguyễn Văn A - 0905 123 456
          </p>
          <p className="text-xs text-gray-600 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            123 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng
          </p>
        </div>
      </div>

      {/* Action Bar dưới đáy */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white p-3 border-t border-gray-200 flex gap-2">
        <button
          onClick={onReject}
          className="flex-1 py-2.5 border border-red-500 text-red-600 font-semibold rounded-lg text-sm hover:bg-red-50 transition"
        >
          Từ chối
        </button>
        <button
          onClick={onAccept}
          className="flex-2 py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Tiếp nhận & Lên lịch
        </button>
      </div>
    </div>
  );
};

export default WarrantyDetailPage;

import React, { useState } from "react";
import {
  Search,
  Clock,
  ChevronRight,
  Wrench,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const WarrantyListPage = ({ onViewDetail }) => {
  const [activeTab, setActiveTab] = useState("PENDING"); 
  const [searchTerm, setSearchTerm] = useState("");

  // Dữ liệu mẫu hiển thị
  const mockClaims = [
    {
      id: 1,
      requestCode: "REQ-100293",
      customerName: "Nguyễn Văn A",
      serviceName: "Sửa chữa điều hòa (Rò rỉ nước)",
      address: "123 Nguyễn Văn Linh, Q. Thanh Khê",
      status: "PENDING",
      createdAt: "2026-10-12 09:30",
      daysLeft: 2,
    },
    {
      id: 2,
      requestCode: "REQ-100112",
      customerName: "Trần Thị B",
      serviceName: "Thay vòi nước phòng tắm",
      address: "45 Lê Duẩn, Q. Hải Châu",
      status: "PROCESSING",
      scheduledAt: "2026-10-13 14:00",
      daysLeft: 5,
    },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-lg font-bold text-center">Yêu Cầu Bảo Hành</h1>
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc tên khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-gray-800 bg-white focus:outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex-1 py-3 text-xs font-semibold text-center relative ${
            activeTab === "PENDING"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Chờ tiếp nhận
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full">
            2
          </span>
        </button>
        <button
          onClick={() => setActiveTab("PROCESSING")}
          className={`flex-1 py-3 text-xs font-semibold text-center ${
            activeTab === "PROCESSING"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Đang xử lý
        </button>
        <button
          onClick={() => setActiveTab("COMPLETED")}
          className={`flex-1 py-3 text-xs font-semibold text-center ${
            activeTab === "COMPLETED"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
        >
          Đã hoàn thành
        </button>
      </div>

      {/* Warranty List */}
      <div className="p-4 space-y-3">
        {mockClaims.map((claim) => (
          <div
            key={claim.id}
            onClick={() => onViewDetail(claim.id)}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm active:scale-[0.99] transition cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                #{claim.requestCode}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> Hạn bảo hành còn {claim.daysLeft}{" "}
                ngày
              </span>
            </div>

            <h3 className="font-semibold text-gray-800 text-sm">
              {claim.serviceName}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Khách hàng:{" "}
              <span className="text-gray-700 font-medium">
                {claim.customerName}
              </span>
            </p>
            <p className="text-xs text-gray-500 truncate">
              Đ/c: {claim.address}
            </p>

            <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center text-xs">
              <span className="text-gray-400">Gửi lúc: {claim.createdAt}</span>
              <span className="text-blue-600 font-medium flex items-center">
                Chi tiết <ChevronRight className="w-4 h-4 ml-0.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarrantyListPage;

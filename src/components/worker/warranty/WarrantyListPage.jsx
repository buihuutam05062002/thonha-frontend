import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  Clock,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWarranties, getWarrantyCounts } from "../../../api/warrantyApi";
import { parseApiError } from "../../../api/apiError";
import { getStoredUser } from "../../../api/session";
import { connectWorkerChannel } from "../../../api/socket";
import { formatDateTime } from "./warrantyFormat";

const TABS = [
  { key: "PENDING", label: "Chờ tiếp nhận" },
  { key: "PROCESSING", label: "Đang xử lý" },
  { key: "COMPLETED", label: "Đã hoàn thành" },
];

const WarrantyListPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [claims, setClaims] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getWarranties({ tab: activeTab, keyword: debouncedTerm }),
      getWarrantyCounts(),
    ])
      .then(([list, summary]) => {
        if (cancelled) return;
        setClaims(list || []);
        setCounts(summary || {});
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            parseApiError(err).message || "Không tải được danh sách bảo hành.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, debouncedTerm, reloadKey]);

  useEffect(() => {
    const userId = getStoredUser()?.id;
    if (!userId) return undefined;
    const channel = connectWorkerChannel({
      userId,
      topics: ["warranty"],
      onMessage: () => setReloadKey((k) => k + 1),
    });
    return () => channel.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/worker/dashboard")}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#FFF4E6] flex items-center justify-center text-[#F5820D]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">
                Yêu Cầu Bảo Hành
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 flex gap-2 border-t border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-4 text-xs font-semibold whitespace-nowrap transition relative ${
                activeTab === tab.key
                  ? "text-[#F5820D] border-b-2 border-[#F5820D]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
              {tab.key === "PENDING" && counts.PENDING > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full font-bold">
                  {counts.PENDING}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Search bar */}
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-800 bg-white border border-gray-200 focus:outline-none focus:border-[#F5820D] shadow-sm transition"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        </div>

        {loading && (
          <div className="text-center text-xs text-gray-400 py-12">
            Đang tải danh sách bảo hành...
          </div>
        )}
        {error && (
          <div className="text-center text-xs text-red-500 py-6 bg-red-50 rounded-xl">
            {error}
          </div>
        )}
        {!loading && !error && claims.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            Không có phiếu bảo hành nào trong mục này.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!loading &&
            claims.map((claim) => (
              <div
                key={claim.id}
                onClick={() => navigate(`/worker/warranty/${claim.id}`)}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-[#F5820D] bg-[#FFF4E6] px-2.5 py-1 rounded-lg">
                      #{claim.requestCode}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Còn {claim.daysLeft} ngày
                      bảo hành
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">
                    {claim.categoryName}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    "{claim.description}"
                  </p>
                  <div className="space-y-1 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl">
                    <p>
                      Khách hàng:{" "}
                      <span className="font-semibold text-gray-800">
                        {claim.customerName}
                      </span>
                    </p>
                    <p className="truncate">Địa chỉ: {claim.addressText}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-400">
                    {claim.status === "PROCESSING"
                      ? `Hẹn: ${formatDateTime(claim.scheduledAt)}`
                      : `Gửi lúc: ${formatDateTime(claim.createdAt)}`}
                  </span>
                  <span className="text-[#F5820D] font-semibold flex items-center gap-1 hover:underline">
                    Chi tiết <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default WarrantyListPage;

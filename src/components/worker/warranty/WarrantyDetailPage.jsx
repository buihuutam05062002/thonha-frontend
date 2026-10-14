import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  Phone,
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getWarranty, rejectWarranty } from "../../../api/warrantyApi";
import { parseApiError } from "../../../api/apiError";
import { formatDate, formatDateTime, RESOLUTION_LABELS, slotRangeLabel } from "./warrantyFormat";

const WarrantyDetailPage = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWarranty(claimId)
      .then((data) => {
        if (!cancelled) setClaim(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            parseApiError(err).message || "Không tải được phiếu bảo hành.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [claimId]);

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Vui lòng nhập lý do từ chối");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await rejectWarranty(claimId, rejectReason.trim());
      navigate("/worker/warranty", { replace: true });
    } catch (err) {
      setError(
        parseApiError(err).message || "Không thể từ chối, vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400 bg-[#F8F9FA]">
        Đang tải thông tin chi tiết...
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-4 bg-[#F8F9FA]">
        <p className="text-sm text-red-500">
          {error || "Không tìm thấy phiếu bảo hành."}
        </p>
        <button
          onClick={() => navigate("/worker/warranty")}
          className="text-sm text-[#F5820D] font-semibold hover:underline"
        >
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/worker/warranty")}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FFF4E6] flex items-center justify-center text-[#F5820D]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-gray-900">
              Chi Tiết Yêu Cầu Bảo Hành
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-2">
            <AlertTriangle className="w-4 h-4" /> Báo cáo lỗi từ khách hàng
          </div>
          <p className="text-xs text-red-900 leading-relaxed font-medium">
            "{claim.description}"
          </p>

          {claim.evidenceImages?.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {claim.evidenceImages.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt={`Bằng chứng ${i + 1}`}
                    className="rounded-xl object-cover w-full h-20 border border-red-200 hover:opacity-95 transition"
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        {claim.scheduledAt && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-1 shadow-sm">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
              <CalendarClock className="w-4 h-4" /> Lịch hẹn khảo sát
            </div>
            <p className="text-xs text-blue-900 font-medium">
              {formatDate(claim.scheduledAt)} ·{" "}
              {slotRangeLabel(claim.scheduledAt)}
            </p>
            {claim.scheduleNote && (
              <p className="text-xs text-blue-700">{claim.scheduleNote}</p>
            )}
          </div>
        )}

        {claim.status === "REJECTED" && (
          <div className="bg-gray-100 border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">
              Đã từ chối
            </p>
            <p className="text-xs text-gray-700">{claim.rejectReason}</p>
          </div>
        )}

        {claim.status === "COMPLETED" && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Kết quả bảo hành
            </div>
            <p className="text-xs text-green-900 font-medium">
              {RESOLUTION_LABELS[claim.resolutionType]}
            </p>
            <p className="text-xs text-green-800 leading-relaxed">
              {claim.resolutionNote}
            </p>
            {claim.resultImages?.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {claim.resultImages.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt={`Nghiệm thu ${i + 1}`}
                    className="rounded-xl object-cover w-full h-20"
                  />
                ))}
              </div>
            )}
            <p className="text-[11px] text-green-700 pt-1">
              Hoàn tất lúc {formatDateTime(claim.completedAt)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Thông tin đơn gốc
            </h2>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Mã đơn gốc:</span>
              <span className="font-semibold text-gray-800">
                #{claim.requestCode}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Dịch vụ:</span>
              <span className="font-semibold text-gray-800">
                {claim.categoryName}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Ngày hoàn thành:</span>
              <span className="font-semibold text-gray-800">
                {formatDate(claim.orderCompletedAt)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Hạn bảo hành:</span>
              <span className="font-semibold text-green-600">
                Còn {claim.daysLeft} ngày
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Khách hàng & Địa chỉ
            </h2>
            <p className="text-sm font-bold text-gray-900">
              {claim.customerName}
            </p>
            <a
              href={`tel:${claim.customerPhone}`}
              className="text-xs text-[#F5820D] font-semibold flex items-center gap-1.5 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" /> {claim.customerPhone}
            </a>
            <p className="text-xs text-gray-600 flex items-start gap-1.5 leading-relaxed">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              {claim.addressText}
            </p>
          </div>
        </div>

        {showRejectBox && claim.status === "PENDING" && (
          <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Sự cố do khách tự tháo lắp, nằm ngoài phạm vi bảo hành..."
              className="w-full p-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
            <button
              onClick={handleReject}
              disabled={submitting}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 transition disabled:opacity-50 shadow-sm"
            >
              {submitting ? "Đang gửi..." : "Xác nhận từ chối"}
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {claim.status === "PENDING" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 border-t border-gray-200 shadow-lg">
          <div className="max-w-3xl mx-auto flex gap-3">
            <button
              onClick={() => setShowRejectBox((v) => !v)}
              className="flex-1 py-3 border border-red-500 text-red-600 font-semibold rounded-xl text-sm hover:bg-red-50 transition"
            >
              Từ chối
            </button>
            <button
              onClick={() => navigate(`/worker/warranty/${claim.id}/schedule`)}
              className="flex-[2] py-3 bg-[#F5820D] text-white font-semibold rounded-xl text-sm hover:bg-[#e0750c] transition shadow-md shadow-orange-500/20"
            >
              Tiếp nhận & Lên lịch
            </button>
          </div>
        </div>
      )}

      {claim.status === "PROCESSING" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 border-t border-gray-200 shadow-lg">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate(`/worker/warranty/${claim.id}/complete`)}
              className="w-full py-3.5 bg-[#F5820D] text-white font-semibold rounded-xl text-sm hover:bg-[#e0750c] transition shadow-md shadow-orange-500/20"
            >
              Cập nhật kết quả bảo hành
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyDetailPage;

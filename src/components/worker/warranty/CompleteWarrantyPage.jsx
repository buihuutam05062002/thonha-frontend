import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Camera, X, ShieldCheck } from "lucide-react";
import { parseApiError } from "../../../api/apiError";
import { notifySuccess } from "../../../utils/notify";
import { completeWarranty, getWarranty } from "../../../api/warrantyApi";
import { useNavigate, useParams } from "react-router-dom";
import { RESOLUTION_OPTIONS } from "./warrantyFormat";

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const CompleteWarrantyPage = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [reasonType, setReasonType] = useState("TECHNICAL_ERROR");
  const [resolutionText, setResolutionText] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getWarranty(claimId)
      .then((data) => {
        if (!cancelled && data.status !== "PROCESSING") {
          navigate(`/worker/warranty/${claimId}`, { replace: true });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [claimId, navigate]);

  useEffect(
    () => () => images.forEach((img) => URL.revokeObjectURL(img.url)),
    [],
  );

  const handlePick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    let message = null;
    const valid = [];
    picked.forEach((file) => {
      if (!ACCEPTED.includes(file.type))
        message = `"${file.name}" không đúng định dạng (JPG, PNG, WEBP)`;
      else if (file.size > MAX_SIZE) message = `"${file.name}" vượt quá 5MB`;
      else valid.push({ file, url: URL.createObjectURL(file) });
    });
    setError(message);
    setImages((prev) => [...prev, ...valid].slice(0, MAX_IMAGES));
  };

  const removeImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await completeWarranty(
        claimId,
        { reasonType, resolutionText },
        images.map((img) => img.file),
      );
      notifySuccess("Đã hoàn thành bảo hành.");
      navigate("/worker/warranty", { replace: true });
    } catch (err) {
      setError(
        parseApiError(err).message || "Không thể nghiệm thu, vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(`/worker/warranty/${claimId}`)}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FFF4E6] flex items-center justify-center text-[#F5820D]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-gray-900">
              Hoàn Tất Bảo Hành
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        <form id="complete-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Xác định nguyên nhân sự cố <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {RESOLUTION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-xl cursor-pointer transition hover:bg-orange-50/40 hover:border-orange-200"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reasonType === option.value}
                    onChange={(e) => setReasonType(e.target.value)}
                    className="w-4 h-4 text-[#F5820D] focus:ring-[#F5820D]"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      {option.title}
                    </p>
                    <p className="text-[11px] text-gray-500">{option.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Mô tả công việc đã xử lý <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="3"
              required
              minLength={10}
              maxLength={1000}
              placeholder="VD: Đã siết lại giắc nối ống thoát nước và vệ sinh lại máng nước..."
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:ring-1 focus:ring-[#F5820D] focus:border-[#F5820D] focus:outline-none transition"
            />
          </div>

          {/* Upload ảnh hoàn thành */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Ảnh nghiệm thu bảo hành ({images.length}/{MAX_IMAGES})
            </label>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              multiple
              capture="environment"
              onChange={handlePick}
              className="hidden"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={img.url} className="relative">
                    <img
                      src={img.url}
                      alt={`Nghiệm thu ${index + 1}`}
                      className="rounded-xl object-cover w-full h-24 border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-gray-50 transition"
                    >
                      <X className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < MAX_IMAGES && (
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-[#F5820D] hover:bg-orange-50/20 transition"
              >
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">
                  Bấm để chụp hoặc tải ảnh nghiệm thu
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB)
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <button
            type="submit"
            form="complete-form"
            disabled={submitting}
            className="w-full py-3.5 bg-[#F5820D] text-white font-semibold rounded-xl text-sm hover:bg-[#e0750c] transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-orange-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? "Đang gửi..." : "Nghiệm thu & Kết thúc bảo hành"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteWarrantyPage;

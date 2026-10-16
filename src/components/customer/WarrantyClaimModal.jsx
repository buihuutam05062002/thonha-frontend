import { useEffect, useMemo, useRef, useState } from "react";
import { createWarrantyClaim } from "../../api/warrantyApi";
import { parseApiError } from "../../api/apiError";
import { formatVnd } from "../../utils/format";
import { Camera, ShieldCheck, X } from "lucide-react";

const ACCENT = "#F5820D";
const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "");

export default function WarrantyClaimModal({
  requestId,
  quotation,
  onClose,
  onCreated,
}) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const previews = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );
  useEffect(
    () => () => previews.forEach((u) => URL.revokeObjectURL(u)),
    [previews],
  );

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  function pick(e) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const next = [...files];
    let msg = "";
    for (const f of picked) {
      if (!ACCEPTED.includes(f.type))
        msg = `"${f.name}" không đúng định dạng (JPG, PNG, WEBP)`;
      else if (f.size > MAX_SIZE) msg = `"${f.name}" vượt quá 5 MB`;
      else if (next.length >= MAX_IMAGES) msg = `Tối đa ${MAX_IMAGES} ảnh`;
      else next.push(f);
    }
    setError(msg);
    setFiles(next);
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (description.trim().length < 10) {
      setError("Vui lòng mô tả sự cố ít nhất 10 ký tự");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createWarrantyClaim(
        { requestId, quotationId: quotation.id, description },
        files,
      );
      onCreated?.();
      onClose();
    } catch (err) {
      setError(
        parseApiError(err).message ||
          "Không gửi được yêu cầu bảo hành, vui lòng thử lại",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wc-title"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="wc-title"
            className="m-0 flex items-center gap-2 text-base font-bold text-gray-900"
          >
            <ShieldCheck size={18} color={ACCENT} aria-hidden="true" /> Yêu cầu
            bảo hành
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50/60 p-3 text-sm">
          <div className="font-semibold text-gray-800">
            Hạng mục: báo giá {formatVnd(quotation.totalAmount)}
          </div>
          {quotation.note && (
            <div className="mt-1 whitespace-pre-wrap text-xs text-gray-600">
              {quotation.note}
            </div>
          )}
          <div className="mt-1 text-xs" style={{ color: ACCENT }}>
            Bảo hành{" "}
            {quotation.warrantyLabel ? `${quotation.warrantyLabel} | ` : ""}đến
            hết {fmtDate(quotation.warrantyExpiresAt)}
          </div>
        </div>

        <label
          htmlFor="wc-desc"
          className="mb-1 block text-xs font-bold uppercase text-gray-700"
        >
          Mô tả sự cố <span className="text-red-500">*</span>
        </label>
        <textarea
          id="wc-desc"
          rows={4}
          maxLength={1000}
          value={description}
          disabled={busy}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="VD: Ống nước vừa sửa lại bị rò rỉ ở mối nối..."
          className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-800 focus:border-[#F5820D] focus:outline-none focus:ring-1 focus:ring-[#F5820D]"
        />
        <div className="text-right text-xs text-gray-400">
          {description.length}/1000
        </div>

        <div className="mb-1 mt-2 text-xs font-bold uppercase text-gray-700">
          Ảnh minh chứng{" "}
          <span className="font-normal normal-case text-gray-400">
            (không bắt buộc, tối đa {MAX_IMAGES})
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          hidden
          onChange={pick}
        />
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={src} className="relative">
              <img
                src={src}
                alt={`Ảnh ${i + 1}`}
                className="h-16 w-16 rounded-xl border border-gray-200 object-cover"
              />
              <button
                type="button"
                aria-label={`Bỏ ảnh ${i + 1}`}
                disabled={busy}
                onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full border border-gray-200 bg-white p-0.5 shadow"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
          {files.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-gray-300 text-[11px] text-gray-500 hover:border-[#F5820D] hover:text-[#F5820D]"
            >
              <Camera size={18} aria-hidden="true" /> Thêm
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="mb-0 mt-3 text-xs text-red-500">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-[2] rounded-xl border-0 py-3 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            {busy ? "Đang gửi..." : "Gửi yêu cầu bảo hành"}
          </button>
        </div>
      </form>
    </div>
  );
}
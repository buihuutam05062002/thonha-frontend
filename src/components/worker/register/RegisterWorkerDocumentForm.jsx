import { useState } from "react";
import { parseApiError } from "../../../api/apiError";
import { registerWorker, resubmitWorkerProfile } from "../../../api/workerApi";
import { refreshToken } from "../../../api/authApi";
import { saveSession } from "../../../api/session";
import { DocumentUploadField } from "../../ui/DocumentUploadField";

const hasDoc = (docs, type) => (docs || []).some((d) => d.type === type);

/**
 * @param {boolean} [resubmit]  nộp lại hồ sơ bị từ chối: giấy tờ đã có thì không bắt chọn lại
 * @param {Array}   [existingDocuments] giấy tờ hiện có của hồ sơ (từ BE)
 */
export function RegisterWorkerDocumentsForm({ basicInfo, onBack, onSuccess, resubmit = false, existingDocuments = [] }) {
  const keepFront = resubmit && hasDoc(existingDocuments, "CCCD_FRONT");
  const keepBack = resubmit && hasDoc(existingDocuments, "CCCD_BACK");
  const [files, setFiles] = useState({
    cccdFront: [],
    cccdBack: [],
    certificates: [],
    degrees: [],
  });
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (value) =>
    setFiles((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e = {};
    if (files.cccdFront.length === 0 && !keepFront)
      e.cccdFront = "Vui lòng tải ảnh CCCD mặt trước";
    if (files.cccdBack.length === 0 && !keepBack)
      e.cccdBack = "Vui lòng tải ảnh CCCD mặt sau";
    if (!agreePolicy)
      e.agreePolicy = "Bạn cần đồng ý chính sách bảo vệ dữ liệu cá nhân";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...basicInfo,
        experienceYears: Number(basicInfo.experienceYears),
        agreePolicy: true,
      };
      const uploads = {
        cccdFront: files.cccdFront[0],
        cccdBack: files.cccdBack[0],
        certificates: files.certificates,
        degrees: files.degrees,
      };
      if (resubmit) {
        onSuccess(await resubmitWorkerProfile(payload, uploads));
        return;
      }
      const response = await registerWorker(payload, uploads);
      // BE vừa cấp role WORKER trong DB, nhưng token/user trong localStorage vẫn là bản cũ
      // -> lấy token mới để dashboard thợ không bị 403 và giao diện nhận đúng role.
      try {
        saveSession(await refreshToken());
      } catch {
        // bỏ qua: lần đăng nhập sau vẫn có role WORKER
      }
      onSuccess(response);
    } catch (err) {
      const parsed = parseApiError(err);
      switch (parsed.code) {
        case "VALIDATION_ERROR":
          setFormError(
            "Thông tin ở bước 1 chưa hợp lệ. Vui lòng quay lại kiểm tra.",
          );
          break;
        case "WORKER_PROFILE_EXISTS":
          setFormError("Bạn đã đăng ký hồ sơ thợ rồi.");
          break;
        case "INVALID_REQUEST": // chuyên môn không hợp lệ, thiếu CCCD...
          setFormError(parsed.message || "Thông tin hồ sơ chưa hợp lệ, vui lòng kiểm tra lại.");
          break;
        case "ACCOUNT_LOCKED":
          setFormError(
            "Tài khoản của bạn đang bị khóa, không thể đăng ký hồ sơ thợ.",
          );
          break;
        case "MISSING_REQUIRED_DOCUMENTS":
        case "INVALID_FILE":
        case "INVALID_FILE_TYPE":
        case "FILE_TOO_LARGE":
        case "TOO_MANY_FILES":
          setFormError(parsed.message);
          break;
        default:
          setFormError(parsed.message || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUploadField
          label={keepFront ? "CCCD mặt trước" : "CCCD mặt trước *"}
          hint={keepFront ? "Đã có ảnh cũ, chọn ảnh mới nếu muốn thay" : "Ảnh rõ nét, đủ 4 góc"}
          files={files.cccdFront}
          onChange={setField("cccdFront")}
          error={errors.cccdFront}
        />
        <DocumentUploadField
          label={keepBack ? "CCCD mặt sau" : "CCCD mặt sau *"}
          hint={keepBack ? "Đã có ảnh cũ, chọn ảnh mới nếu muốn thay" : "Ảnh rõ nét, đủ 4 góc"}
          files={files.cccdBack}
          onChange={setField("cccdBack")}
          error={errors.cccdBack}
        />
        <DocumentUploadField
          label="Chứng chỉ nghề (không bắt buộc)"
          hint={resubmit && hasDoc(existingDocuments, "CERTIFICATE") ? "Đã có chứng chỉ cũ, chọn file mới sẽ thay thế toàn bộ" : "Tối đa 5 file, mỗi file 5MB"}
          multiple
          files={files.certificates}
          onChange={setField("certificates")}
        />
        <DocumentUploadField
          label="Bằng cấp (không bắt buộc)"
          hint={resubmit && hasDoc(existingDocuments, "DEGREE") ? "Đã có bằng cấp cũ, chọn file mới sẽ thay thế toàn bộ" : "Tối đa 5 file, mỗi file 5MB"}
          multiple
          files={files.degrees}
          onChange={setField("degrees")}
        />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agreePolicy"
            checked={agreePolicy}
            onChange={(e) => setAgreePolicy(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 accent-orange-500 cursor-pointer flex-shrink-0"
          />
          <label
            htmlFor="agreePolicy"
            className="text-xs text-gray-400 leading-relaxed cursor-pointer flex-1"
          >
            Bằng việc bấm vào nút Đăng ký, tôi đồng ý rằng Thợ Nhà có thể thu
            thập, sử dụng và tiết lộ thông tin được tôi cung cấp theo{" "}
            <a
              href="#"
              className="underline hover:text-gray-700 transition-colors"
              style={{ color: "#F5820D" }}
            >
              Chính sách bảo vệ dữ liệu cá nhân
            </a>{" "}
            mà tôi đã đọc hiểu.
          </label>
        </div>
        {errors.agreePolicy && (
          <p className="text-xs text-red-500 mt-1">{errors.agreePolicy}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="w-1/3 py-3.5 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{ background: "#111111" }}
        >
          {submitting ? "Đang gửi..." : resubmit ? "Nộp lại hồ sơ" : "Đăng ký"}
        </button>
      </div>
    </div>
  );
}
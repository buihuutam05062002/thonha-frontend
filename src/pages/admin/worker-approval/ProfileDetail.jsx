import { useEffect, useState } from "react";
import {
  Phone, Mail, MapPin, Briefcase, Star, CheckCircle2, XCircle, MinusCircle,
  Landmark, History, ShieldCheck, X, ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { docLabel } from "../../../api/workerApprovalApi";
import { formatDateTime } from "../../../utils/format";

const QUICK_REASONS = [
  "Ảnh CCCD mờ, không đọc được thông tin",
  "Thông tin trên CCCD không khớp với hồ sơ",
  "Thiếu chứng chỉ/bằng cấp chứng minh tay nghề",
  "Chuyên môn đăng ký không phù hợp với giấy tờ",
];

const STATUS_TEXT = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Đã từ chối" };

function CheckRow({ state, label, hint }) {
  const Icon = state === "ok" ? CheckCircle2 : state === "missing" ? XCircle : MinusCircle;
  return (
    <li className={`wa-check wa-check-${state}`}>
      <Icon size={16} aria-hidden="true" />
      <span>{label}</span>
      {hint && <em>{hint}</em>}
    </li>
  );
}

function Lightbox({ docs, index, onClose, onNav }) {
  const doc = docs[index];
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(-1);
      if (e.key === "ArrowRight") onNav(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNav]);

  return (
    <div className="wa-modal-backdrop wa-lightbox" role="dialog" aria-modal="true" aria-label={docLabel(doc.type)} onClick={onClose}>
      <div className="wa-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <div className="wa-lightbox-bar">
          <span>{docLabel(doc.type)} <small>({index + 1}/{docs.length})</small></span>
          <span className="wa-lightbox-tools">
            <a href={doc.fileUrl} target="_blank" rel="noreferrer" title="Mở ảnh gốc"><ExternalLink size={18} /></a>
            <button type="button" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
          </span>
        </div>
        <div className="wa-lightbox-stage">
          {docs.length > 1 && <button type="button" className="wa-nav wa-nav-prev" onClick={() => onNav(-1)} aria-label="Ảnh trước"><ChevronLeft size={26} /></button>}
          <img src={doc.fileUrl} alt={docLabel(doc.type)} />
          {docs.length > 1 && <button type="button" className="wa-nav wa-nav-next" onClick={() => onNav(1)} aria-label="Ảnh sau"><ChevronRight size={26} /></button>}
        </div>
      </div>
    </div>
  );
}

function ConfirmApprove({ profile, busy, onCancel, onConfirm }) {
  return (
    <div className="wa-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wa-confirm-title" onClick={onCancel}>
      <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
        <ShieldCheck size={32} className="wa-modal-icon" />
        <h3 id="wa-confirm-title">Duyệt hồ sơ của {profile.fullName}?</h3>
        <p>Sau khi duyệt, thợ có thể bật trạng thái sẵn sàng và bắt đầu nhận yêu cầu sửa chữa phù hợp với chuyên môn:
          {" "}<strong>{profile.specialties.map((s) => s.name).join(", ") || "-"}</strong>.</p>
        <div className="wa-actions">
          <button type="button" className="wa-cancel" onClick={onCancel} disabled={busy}>Hủy</button>
          <button type="button" className="wa-approve" onClick={onConfirm} disabled={busy}>
            {busy ? "Đang xử lý..." : "Xác nhận duyệt"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileDetail({ profile, loading, error, busy, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    setRejecting(false); setReason(""); setConfirming(false); setViewer(null);
  }, [profile?.id]);

  if (loading && !profile) return <aside className="wa-detail wa-empty" aria-busy="true">Đang tải chi tiết...</aside>;
  if (error) return <aside className="wa-detail wa-empty wa-error" role="alert">{error}</aside>;
  if (!profile) return <aside className="wa-detail wa-empty">Chọn một hồ sơ để xem chi tiết</aside>;

  const pending = profile.approvalStatus === "PENDING";
  const approved = profile.approvalStatus === "APPROVED";
  const rejected = profile.approvalStatus === "REJECTED";
  const canReject = pending || approved;  
  const canApprove = pending || rejected; 
  const docsOf = (t) => profile.documents.filter((d) => d.type === t);
  const hasFront = docsOf("CCCD_FRONT").length > 0;
  const hasBack = docsOf("CCCD_BACK").length > 0;
  const extraCount = docsOf("CERTIFICATE").length + docsOf("DEGREE").length;
  const images = profile.documents;

  const submitReject = async () => {
    if (!reason.trim()) return;
    const ok = await onReject(profile.id, reason.trim());
    if (ok) { setRejecting(false); setReason(""); }
  };

  const confirmApprove = async () => {
    await onApprove(profile.id);
    setConfirming(false);
  };

  const navViewer = (step) =>
    setViewer((v) => (v === null ? v : (v + step + images.length) % images.length));

  return (
    <aside className="wa-detail">
      <div className="wa-detail-header">
        <h2>Chi tiết hồ sơ <small>#{profile.id}</small></h2>
        <span className={`wa-status wa-status-${profile.approvalStatus.toLowerCase()}`}>
          {STATUS_TEXT[profile.approvalStatus]}
        </span>
      </div>

      <div className="wa-profile-card">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="wa-avatar wa-avatar-lg" />
        ) : (
          <span className="wa-avatar wa-avatar-lg wa-avatar-fallback">{profile.fullName?.[0]?.toUpperCase()}</span>
        )}
        <div className="wa-profile-main">
          <strong>{profile.fullName}</strong>
          <div className="wa-contact">
            <span><Phone size={13} /> {profile.phoneNumber || "-"}</span>
            <span><Mail size={13} /> {profile.email || "-"}</span>
          </div>
          <div className="wa-chips">
            {profile.specialties.map((s) => <span key={s.id} className="wa-chip">{s.name}</span>)}
          </div>
        </div>
      </div>

      <div className="wa-stats">
        <div><Briefcase size={14} /><b>{profile.experienceYears ?? 0} năm</b><span>Kinh nghiệm</span></div>
        <div><MapPin size={14} /><b>{profile.provinceCity || "-"}</b><span>Nơi cư trú</span></div>
        <div><Star size={14} /><b>{Number(profile.averageRating ?? 0).toFixed(1)}</b><span>Đánh giá</span></div>
      </div>
      <p className="wa-area"><MapPin size={13} /> Khu vực hoạt động: <b>{profile.operatingArea || "-"}</b></p>
      <p className="wa-area">Nộp hồ sơ lúc: <b>{formatDateTime(profile.createdAt)}</b></p>

      <section className="wa-section">
        <h3>Danh sách kiểm tra</h3>
        <ul className="wa-checklist">
          <CheckRow state={hasFront ? "ok" : "missing"} label="CCCD mặt trước" hint="Bắt buộc" />
          <CheckRow state={hasBack ? "ok" : "missing"} label="CCCD mặt sau" hint="Bắt buộc" />
          <CheckRow state={extraCount ? "ok" : "optional"} label="Chứng chỉ / bằng cấp" hint={extraCount ? `${extraCount} tệp` : "Không bắt buộc"} />
          <CheckRow state={profile.specialties.length ? "ok" : "missing"} label="Chuyên môn đăng ký" hint={`${profile.specialties.length} lĩnh vực`} />
          <CheckRow state={profile.bankAccount ? "ok" : "optional"} label="Tài khoản ngân hàng" hint={profile.bankAccount ? "Đã cung cấp" : "Chưa cung cấp"} />
        </ul>
      </section>

      <section className="wa-section">
        <h3>Giấy tờ kèm theo <small>(bấm để phóng to)</small></h3>
        {images.length === 0 ? (
          <p className="wa-muted">Hồ sơ chưa có giấy tờ nào.</p>
        ) : (
          <div className="wa-gallery">
            {images.map((d, i) => (
              <button type="button" key={d.id} className="wa-thumb" onClick={() => setViewer(i)} title={docLabel(d.type)}>
                <img src={d.fileUrl} alt={docLabel(d.type)} loading="lazy" />
                <span>{docLabel(d.type)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {profile.bankAccount && (
        <section className="wa-section">
          <h3><Landmark size={14} /> Tài khoản nhận tiền</h3>
          <dl className="wa-fields">
            <dt>Ngân hàng</dt><dd>{profile.bankAccount.bankName}</dd>
            <dt>Chủ tài khoản</dt><dd>{profile.bankAccount.accountHolder}</dd>
            <dt>Số tài khoản</dt><dd>{profile.bankAccount.accountNumberMasked}</dd>
          </dl>
          <p className="wa-muted">Đối chiếu tên chủ tài khoản với họ tên trên CCCD.</p>
        </section>
      )}

      {!pending && (
        <section className="wa-section wa-history">
          <h3><History size={14} /> Kết quả xét duyệt</h3>
          <p>
            {STATUS_TEXT[profile.approvalStatus]} bởi <b>{profile.reviewedByName || `Admin #${profile.reviewedById ?? "?"}`}</b>
            {" "}lúc {formatDateTime(profile.reviewedAt)}
          </p>
          {profile.rejectReason && <p className="wa-reject-reason"><b>Lý do:</b> {profile.rejectReason}</p>}
        </section>
      )}

      {(canReject || canApprove) && !rejecting && (
        <div className="wa-action-bar">
          {canApprove && !profile.canApprove && (
            <p className="wa-warn" role="alert">
              <XCircle size={14} /> Không thể duyệt, còn thiếu: {profile.missingDocuments.map(docLabel).join(", ")}.
              Hãy từ chối kèm lý do hoặc yêu cầu thợ bổ sung.
            </p>
          )}
          <div className="wa-actions">
            {canApprove && (
              <button type="button" className="wa-approve" disabled={!profile.canApprove || busy} onClick={() => setConfirming(true)}>
                {rejected ? "Duyệt lại hồ sơ" : "Duyệt hồ sơ"}
              </button>
            )}
            {canReject && (
              <button type="button" className="wa-reject" disabled={busy} onClick={() => setRejecting(true)}>
                {approved ? "Thu hồi duyệt" : "Từ chối"}
              </button>
            )}
          </div>
        </div>
      )}

      {canReject && rejecting && (
        <div className="wa-reject-form">
          <label htmlFor="wa-reason">{approved ? "Lý do thu hồi" : "Lý do từ chối"} <small>(thợ sẽ thấy nội dung này)</small></label>
          <div className="wa-chips wa-quick">
            {QUICK_REASONS.map((r) => (
              <button type="button" key={r} className="wa-chip wa-chip-btn" onClick={() => setReason(r)}>{r}</button>
            ))}
          </div>
          <textarea
            id="wa-reason"
            placeholder="Nhập lý do từ chối..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            autoFocus
          />
          <small className="wa-counter">{reason.length}/500</small>
          <div className="wa-actions">
            <button type="button" className="wa-cancel" onClick={() => { setRejecting(false); setReason(""); }} disabled={busy}>Hủy</button>
            <button type="button" className="wa-reject" disabled={!reason.trim() || busy} onClick={submitReject}>
              {busy ? "Đang xử lý..." : approved ? "Xác nhận thu hồi" : "Xác nhận từ chối"}
            </button>
          </div>
        </div>
      )}

      {confirming && <ConfirmApprove profile={profile} busy={busy} onCancel={() => setConfirming(false)} onConfirm={confirmApprove} />}
      {viewer !== null && <Lightbox docs={images} index={viewer} onClose={() => setViewer(null)} onNav={navViewer} />}
    </aside>
  );
}

import { useEffect, useState } from "react";
import {
  Phone, Mail, MapPin, Briefcase, Star, CheckCircle2, XCircle, MinusCircle,
  Landmark, History, ShieldCheck, X, ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { docLabel } from "../../../api/workerApprovalApi";
import { formatDateTime } from "../../../utils/format";
import {
  Avatar, Button, Chip, ConfirmDialog, DetailHeader, DetailMessage, DetailPane, DetailSection, Fields,
  StatusBadge, Textarea, cn,
} from "../../../components/admin/ui";
import { STATUS_TEXT, STATUS_TONE } from "./PendingTable";

const QUICK_REASONS = [
  "Ảnh CCCD mờ, không đọc được thông tin",
  "Thông tin trên CCCD không khớp với hồ sơ",
  "Thiếu chứng chỉ/bằng cấp chứng minh tay nghề",
  "Chuyên môn đăng ký không phù hợp với giấy tờ",
];

const CHECK_STYLE = {
  ok: { icon: CheckCircle2, iconClass: "text-green-600", hintClass: "text-subtle" },
  missing: { icon: XCircle, iconClass: "text-red-600", hintClass: "font-semibold text-red-600" },
  optional: { icon: MinusCircle, iconClass: "text-slate-400", hintClass: "text-subtle" },
};

function CheckRow({ state, label, hint }) {
  const { icon: Icon, iconClass, hintClass } = CHECK_STYLE[state];
  return (
    <li className="flex items-center gap-2 text-[13px] text-ink">
      <Icon size={16} className={iconClass} aria-hidden="true" />
      <span>{label}</span>
      {hint && <em className={cn("ml-auto text-[11.5px] not-italic", hintClass)}>{hint}</em>}
    </li>
  );
}

const NAV = "absolute top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-white/20 text-white hover:bg-white/35";

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
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/90 p-16px"
      role="dialog"
      aria-modal="true"
      aria-label={docLabel(doc.type)}
      onClick={onClose}
    >
      <div className="flex max-h-full w-full max-w-[960px] flex-col gap-2.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-sm text-white">
          <span>{docLabel(doc.type)} <small className="opacity-70">({index + 1}/{docs.length})</small></span>
          <span className="flex items-center gap-3.5">
            <a href={doc.fileUrl} target="_blank" rel="noreferrer" title="Mở ảnh gốc" className="grid text-white"><ExternalLink size={18} aria-hidden="true" /></a>
            <button type="button" onClick={onClose} aria-label="Đóng" className="grid cursor-pointer border-0 bg-transparent p-0 text-white"><X size={20} aria-hidden="true" /></button>
          </span>
        </div>
        <div className="relative grid place-items-center">
          {docs.length > 1 && <button type="button" className={cn(NAV, "left-2")} onClick={() => onNav(-1)} aria-label="Ảnh trước"><ChevronLeft size={26} aria-hidden="true" /></button>}
          <img src={doc.fileUrl} alt={docLabel(doc.type)} className="max-h-[calc(100vh-110px)] max-w-full rounded-lg bg-black object-contain" />
          {docs.length > 1 && <button type="button" className={cn(NAV, "right-2")} onClick={() => onNav(1)} aria-label="Ảnh sau"><ChevronRight size={26} aria-hidden="true" /></button>}
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

  // đổi hồ sơ thì đóng mọi form đang mở
  useEffect(() => {
    setRejecting(false); setReason(""); setConfirming(false); setViewer(null);
  }, [profile?.id]);

  if (loading && !profile) return <DetailMessage busy>Đang tải chi tiết...</DetailMessage>;
  if (error) return <DetailMessage error>{error}</DetailMessage>;
  if (!profile) return <DetailMessage>Chọn một hồ sơ để xem chi tiết</DetailMessage>;

  const pending = profile.approvalStatus === "PENDING";
  const approved = profile.approvalStatus === "APPROVED";
  const rejected = profile.approvalStatus === "REJECTED";
  const canReject = pending || approved;  // approved -> thu hồi
  const canApprove = pending || rejected; // rejected -> duyệt lại
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

  const statBox = "flex flex-col items-center gap-0.5 rounded-xl border-[1px] border-line bg-surface p-2.5 text-center text-brand-dark";

  return (
    <DetailPane>
      <DetailHeader
        title="Chi tiết hồ sơ"
        sub={`#${profile.id}`}
        aside={<StatusBadge tone={STATUS_TONE[profile.approvalStatus]}>{STATUS_TEXT[profile.approvalStatus]}</StatusBadge>}
      />

      <div className="mb-16px flex gap-3.5">
        <Avatar size="lg" src={profile.avatarUrl} name={profile.fullName} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <strong className="text-[17px] text-ink">{profile.fullName}</strong>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[12.5px] text-subtle">
            <span className="inline-flex items-center gap-1.5 break-all"><Phone size={13} aria-hidden="true" /> {profile.phoneNumber || "-"}</span>
            <span className="inline-flex items-center gap-1.5 break-all"><Mail size={13} aria-hidden="true" /> {profile.email || "-"}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.specialties.map((s) => <Chip key={s.id}>{s.name}</Chip>)}
          </div>
        </div>
      </div>

      <div className="mb-12px grid grid-cols-3 gap-2">
        <div className={statBox}><Briefcase size={14} aria-hidden="true" /><b className="text-sm text-ink">{profile.experienceYears ?? 0} năm</b><span className="text-[11px] text-subtle">Kinh nghiệm</span></div>
        <div className={statBox}><MapPin size={14} aria-hidden="true" /><b className="text-sm text-ink">{profile.provinceCity || "-"}</b><span className="text-[11px] text-subtle">Nơi cư trú</span></div>
        <div className={statBox}><Star size={14} aria-hidden="true" /><b className="text-sm text-ink">{Number(profile.averageRating ?? 0).toFixed(1)}</b><span className="text-[11px] text-subtle">Đánh giá</span></div>
      </div>
      <p className="m-0 mb-1.5 flex flex-wrap items-center gap-1.5 text-[13px] text-ink"><MapPin size={13} aria-hidden="true" /> Khu vực hoạt động: <b>{profile.operatingArea || "-"}</b></p>
      <p className="m-0 mb-1.5 text-[13px] text-ink">Nộp hồ sơ lúc: <b>{formatDateTime(profile.createdAt)}</b></p>

      <DetailSection title="Danh sách kiểm tra">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          <CheckRow state={hasFront ? "ok" : "missing"} label="CCCD mặt trước" hint="Bắt buộc" />
          <CheckRow state={hasBack ? "ok" : "missing"} label="CCCD mặt sau" hint="Bắt buộc" />
          <CheckRow state={extraCount ? "ok" : "optional"} label="Chứng chỉ / bằng cấp" hint={extraCount ? `${extraCount} tệp` : "Không bắt buộc"} />
          <CheckRow state={profile.specialties.length ? "ok" : "missing"} label="Chuyên môn đăng ký" hint={`${profile.specialties.length} lĩnh vực`} />
          <CheckRow state={profile.bankAccount ? "ok" : "optional"} label="Tài khoản ngân hàng" hint={profile.bankAccount ? "Đã cung cấp" : "Chưa cung cấp"} />
        </ul>
      </DetailSection>

      <DetailSection title="Giấy tờ kèm theo" sub="(bấm để phóng to)">
        {images.length === 0 ? (
          <p className="m-0 text-xs text-subtle">Hồ sơ chưa có giấy tờ nào.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
            {images.map((d, i) => (
              <button
                type="button"
                key={d.id}
                title={docLabel(d.type)}
                onClick={() => setViewer(i)}
                className="cursor-zoom-in overflow-hidden rounded-xl border-[1px] border-line bg-white p-0 text-left hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <img src={d.fileUrl} alt={docLabel(d.type)} loading="lazy" className="block h-[86px] w-full bg-slate-100 object-cover" />
                <span className="block px-2 py-1.5 text-[11.5px] text-ink">{docLabel(d.type)}</span>
              </button>
            ))}
          </div>
        )}
      </DetailSection>

      {profile.bankAccount && (
        <DetailSection title={<><Landmark size={14} aria-hidden="true" /> Tài khoản nhận tiền</>}>
          <Fields
            rows={[
              ["Ngân hàng", profile.bankAccount.bankName],
              ["Chủ tài khoản", profile.bankAccount.accountHolder],
              ["Số tài khoản", profile.bankAccount.accountNumberMasked],
            ]}
          />
          <p className="m-0 text-xs text-subtle">Đối chiếu tên chủ tài khoản với họ tên trên CCCD.</p>
        </DetailSection>
      )}

      {!pending && (
        <DetailSection title={<><History size={14} aria-hidden="true" /> Kết quả xét duyệt</>}>
          <p className="m-0 mb-1.5 text-[13px] text-ink">
            {STATUS_TEXT[profile.approvalStatus]} bởi <b>{profile.reviewedByName || `Admin #${profile.reviewedById ?? "?"}`}</b>
            {" "}lúc {formatDateTime(profile.reviewedAt)}
          </p>
          {profile.rejectReason && (
            <p className="m-0 rounded-xl bg-red-50 px-2.5 py-2 text-[13px] text-red-700"><b>Lý do:</b> {profile.rejectReason}</p>
          )}
        </DetailSection>
      )}

      {(canReject || canApprove) && !rejecting && (
        <div className="sticky bottom-[-20px] mt-[18px] flex flex-col gap-2.5 border-t border-line bg-white pb-1 pt-12px max-[1100px]:bottom-0">
          {canApprove && !profile.canApprove && (
            <p className="m-0 flex items-start gap-1.5 text-xs text-red-700" role="alert">
              <XCircle size={14} className="mt-px shrink-0" aria-hidden="true" /> Không thể duyệt, còn thiếu: {profile.missingDocuments.map(docLabel).join(", ")}.
              Hãy từ chối kèm lý do hoặc yêu cầu thợ bổ sung.
            </p>
          )}
          <div className="flex gap-2.5">
            {canApprove && (
              <Button size="lg" variant="success" className="flex-1" disabled={!profile.canApprove || busy} onClick={() => setConfirming(true)}>
                {rejected ? "Duyệt lại hồ sơ" : "Duyệt hồ sơ"}
              </Button>
            )}
            {canReject && (
              <Button size="lg" variant="danger" className="flex-1" disabled={busy} onClick={() => setRejecting(true)}>
                {approved ? "Thu hồi duyệt" : "Từ chối"}
              </Button>
            )}
          </div>
        </div>
      )}

      {canReject && rejecting && (
        <div className="mt-[18px] flex flex-col gap-2 border-t border-line pt-3.5">
          <label htmlFor="wa-reason" className="text-[13px] font-semibold text-ink">
            {approved ? "Lý do thu hồi" : "Lý do từ chối"} <small className="font-normal text-subtle">(thợ sẽ thấy nội dung này)</small>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((r) => <Chip variant="action" key={r} onClick={() => setReason(r)}>{r}</Chip>)}
          </div>
          <Textarea
            id="wa-reason"
            className="resize-y"
            placeholder="Nhập lý do từ chối..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            autoFocus
          />
          <small className="self-end text-[11.5px] text-subtle">{reason.length}/500</small>
          <div className="flex gap-2.5">
            <Button variant="neutral" size="lg" className="flex-1" disabled={busy} onClick={() => { setRejecting(false); setReason(""); }}>Hủy</Button>
            <Button variant="danger" size="lg" className="flex-1" disabled={!reason.trim() || busy} onClick={submitReject}>
              {busy ? "Đang xử lý..." : approved ? "Xác nhận thu hồi" : "Xác nhận từ chối"}
            </Button>
          </div>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          icon={<ShieldCheck size={32} className="text-green-600" aria-hidden="true" />}
          title={`Duyệt hồ sơ của ${profile.fullName}?`}
          lines={[
            <>Sau khi duyệt, thợ có thể bật trạng thái sẵn sàng và bắt đầu nhận yêu cầu sửa chữa phù hợp với chuyên môn:{" "}
              <strong>{profile.specialties.map((s) => s.name).join(", ") || "-"}</strong>.</>,
          ]}
          confirmLabel="Xác nhận duyệt"
          busy={busy}
          onConfirm={confirmApprove}
          onCancel={() => setConfirming(false)}
        />
      )}
      {viewer !== null && <Lightbox docs={images} index={viewer} onClose={() => setViewer(null)} onNav={navViewer} />}
    </DetailPane>
  );
}

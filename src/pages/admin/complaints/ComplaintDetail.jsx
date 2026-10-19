import { useState } from "react";
import { Phone, Clock, UserCog, CheckCircle2, XCircle } from "lucide-react";
import { complaintReasonLabel, complaintStatusLabel } from "../../../api/complaintApi";
import { formatDateTime, formatVnd } from "../../../utils/format";
import {
  Button, ConfirmDialog, DetailHeader, DetailMessage, DetailPane, DetailSection, ErrorText, Fields,
  Note, StatusBadge, Textarea, cn,
} from "../../../components/admin/ui";

export const STATUS_TONE = {
  PENDING: "pending",
  PROCESSING: "info",
  RESOLVED: "success",
  REJECTED: "danger",
};

const RESOLUTION_MAX = 2000;
const ROLE_LABEL = { CUSTOMER: "Khách", WORKER: "Thợ" };

function Tag({ children }) {
  return <span className="ml-1.5 inline-block rounded-full bg-brand-soft px-2 py-px text-[11px] font-semibold text-brand-dark">{children}</span>;
}

function Party({ title, party, tag }) {
  return (
    <div className="min-w-0 rounded-xl border-[1px] border-line bg-surface px-12px py-2.5 text-[13px]">
      <small className="mb-0.5 block text-[11.5px] text-subtle">{title}</small>
      <strong className="block text-ink">
        {party?.fullName ?? "-"}
        {tag && <Tag>{tag}</Tag>}
      </strong>
      <span className="mt-1 flex items-center gap-1 text-subtle"><Phone size={12} aria-hidden="true" /> {party?.phoneNumber || "-"}</span>
    </div>
  );
}

const BOX = {
  default: "border-[1px] border-line bg-surface",
  resolved: "bg-green-50",
  rejected: "bg-red-50",
};

function TextBox({ tone = "default", children }) {
  return <div className={cn("rounded-xl px-12px py-2.5", BOX[tone])}>{children}</div>;
}

const TEXT = "m-0 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-ink";

/** Form kết luận: chọn giải quyết / từ chối + nội dung, có hộp xác nhận vì đóng rồi không sửa được. */
function ResolveForm({ onSubmit, onClose }) {
  const [status, setStatus] = useState("RESOLVED");
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!resolution.trim()) { setError("Vui lòng nhập nội dung kết luận"); return; }
    setError("");
    setConfirming(true);
  };

  const doSubmit = async () => {
    setBusy(true);
    try {
      await onSubmit({ status, resolution });
      onClose();
    } catch (e) {
      setConfirming(false);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resolved = status === "RESOLVED";

  const choice = (active, activeClass) =>
    cn(
      "flex-1 cursor-pointer rounded-xl border-[1px] px-2.5 py-[9px] text-[13px] font-semibold transition-colors",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      active ? activeClass : "border-line bg-white text-ink hover:bg-slate-50",
    );

  return (
    <form className="flex flex-col gap-2 rounded-[14px] border-[1px] border-line bg-surface p-16px" onSubmit={submit}>
      <h3 className="m-0 mb-1 text-[15px] font-bold text-brand-dark">Kết luận khiếu nại</h3>
      <div className="flex gap-2" role="radiogroup" aria-label="Kết quả xử lý">
        <button type="button" role="radio" aria-checked={resolved} className={choice(resolved, "border-green-600 bg-green-600 text-white")} onClick={() => setStatus("RESOLVED")}>
          Giải quyết
        </button>
        <button type="button" role="radio" aria-checked={!resolved} className={choice(!resolved, "border-red-500 bg-red-500 text-white")} onClick={() => setStatus("REJECTED")}>
          Từ chối
        </button>
      </div>

      <label htmlFor="cp-resolution" className="mt-1 text-[13px] font-semibold text-ink">Nội dung kết luận</label>
      <Textarea
        id="cp-resolution"
        rows={5}
        maxLength={RESOLUTION_MAX}
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder={resolved ? "Cách giải quyết, các bên cần làm gì tiếp theo..." : "Lý do từ chối khiếu nại..."}
      />
      <div className="text-right text-[11.5px] text-subtle">{resolution.length}/{RESOLUTION_MAX}</div>

      <Note>
        Kết luận được gửi cho người khiếu nại và không thể sửa sau khi đóng. Việc hoàn tiền / điều chỉnh ví
        (nếu có) chưa xử lý ở đây, hãy ghi rõ trong nội dung.
      </Note>
      <ErrorText>{error}</ErrorText>

      <div className="flex gap-2.5">
        <Button variant="neutral" size="lg" className="flex-1" onClick={onClose}>Hủy</Button>
        <Button type="submit" size="lg" className="flex-1">Tiếp tục</Button>
      </div>

      {confirming && (
        <ConfirmDialog
          title={resolved ? "Xác nhận giải quyết khiếu nại?" : "Xác nhận từ chối khiếu nại?"}
          lines={["Sau khi xác nhận, khiếu nại sẽ được đóng và người gửi nhận được thông báo."]}
          confirmLabel={resolved ? "Giải quyết" : "Từ chối"}
          danger={!resolved}
          busy={busy}
          onConfirm={doSubmit}
          onCancel={() => setConfirming(false)}
        />
      )}
    </form>
  );
}

/** Chi tiết một khiếu nại. Mount lại (key) khi đổi khiếu nại để đóng form đang mở. */
export default function ComplaintDetail({ data, loading, error, onTake, onResolve }) {
  const [resolving, setResolving] = useState(false);
  const [confirmTake, setConfirmTake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  if (loading && !data) return <DetailMessage busy>Đang tải khiếu nại...</DetailMessage>;
  if (error) return <DetailMessage error>{error}</DetailMessage>;
  if (!data) return <DetailMessage>Chọn một khiếu nại để xem chi tiết</DetailMessage>;

  const { complaint: c, request, customer, worker, payment } = data;
  const byCustomer = c.complainantRole === "CUSTOMER";
  const mine = data.handledByMe;
  const closed = c.status === "RESOLVED" || c.status === "REJECTED";

  const doTake = async () => {
    setBusy(true);
    setActionError("");
    try {
      await onTake();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
      setConfirmTake(false);
    }
  };

  const actionBar = "sticky bottom-[-20px] mt-[18px] flex flex-col gap-2.5 border-t border-line bg-white pb-1 pt-12px max-[1100px]:bottom-0";

  return (
    <DetailPane>
      <DetailHeader
        title="Khiếu nại"
        sub={`#${c.id}`}
        aside={<StatusBadge tone={STATUS_TONE[c.status]}>{complaintStatusLabel(c)}</StatusBadge>}
      />

      <DetailSection title="Nội dung khiếu nại">
        <Fields
          rows={[
            ["Lý do", complaintReasonLabel(c)],
            ["Người gửi", <>{c.complainantName}<Tag>{ROLE_LABEL[c.complainantRole]}</Tag></>],
            ["Bị khiếu nại", c.againstName ?? "-"],
            ["Gửi lúc", <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" /> {formatDateTime(c.createdAt)}</span>],
          ]}
        />
        <TextBox><p className={TEXT}>{c.description || "-"}</p></TextBox>

        {c.images?.length > 0 && (
          <div className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
            {c.images.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="block overflow-hidden rounded-xl border-[1px] border-line bg-white no-underline hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <img src={url} alt={`Ảnh bằng chứng ${i + 1}`} loading="lazy" className="block h-24 w-full bg-slate-100 object-cover" />
              </a>
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Đơn sửa chữa" sub={request.requestCode}>
        <Fields
          rows={[
            ["Dịch vụ", request.categoryName],
            ["Trạng thái đơn", request.statusLabel],
            ["Địa chỉ", request.addressText || "-"],
            ["Giá chốt", request.finalPrice != null ? formatVnd(request.finalPrice) : "-"],
            ["Mô tả đơn", request.description],
          ]}
        />
        <div className="grid grid-cols-2 gap-2.5 max-[720px]:grid-cols-1">
          <Party title="Khách" party={customer} tag={byCustomer ? "Người gửi" : null} />
          <Party title="Thợ" party={worker} tag={!byCustomer ? "Người gửi" : null} />
        </div>
      </DetailSection>

      {payment && (
        <DetailSection title="Thanh toán">
          <Fields
            rows={[
              ["Tổng tiền", formatVnd(payment.amount)],
              ["Hoa hồng", formatVnd(payment.commissionAmount)],
              ["Thợ nhận", formatVnd(payment.workerAmount)],
              ["Hình thức", payment.paymentMethod],
            ]}
          />
        </DetailSection>
      )}

      {(c.handledByName || closed) && (
        <DetailSection title="Xử lý">
          {c.handledByName && (
            <p className="m-0 mb-1.5 flex items-center gap-1 text-[13px] text-ink">
              <UserCog size={13} aria-hidden="true" /> Admin phụ trách: <b>{c.handledByName}</b>{mine ? " (bạn)" : ""}
            </p>
          )}
          {closed && (
            <TextBox tone={c.status === "RESOLVED" ? "resolved" : "rejected"}>
              <p className={TEXT}>{c.resolution}</p>
              <small className="mt-1.5 flex items-center gap-1 text-[11.5px] text-subtle">
                {c.status === "RESOLVED" ? <CheckCircle2 size={11} aria-hidden="true" /> : <XCircle size={11} aria-hidden="true" />} {formatDateTime(c.resolvedAt)}
              </small>
            </TextBox>
          )}
        </DetailSection>
      )}

      <ErrorText>{actionError}</ErrorText>

      {c.status === "PENDING" && (
        <div className={actionBar}>
          <div className="flex gap-2.5">
            <Button size="lg" className="flex-1" disabled={busy} onClick={() => setConfirmTake(true)}>Nhận xử lý</Button>
          </div>
        </div>
      )}

      {c.status === "PROCESSING" && mine && (
        <div className={actionBar}>
          {resolving ? (
            <ResolveForm onSubmit={onResolve} onClose={() => setResolving(false)} />
          ) : (
            <div className="flex gap-2.5">
              <Button size="lg" className="flex-1" onClick={() => setResolving(true)}>Kết luận</Button>
            </div>
          )}
        </div>
      )}

      {c.status === "PROCESSING" && !mine && (
        <p className="m-0 mt-3.5 text-xs text-subtle">Khiếu nại đang do admin khác xử lý.</p>
      )}

      {confirmTake && (
        <ConfirmDialog
          title="Nhận xử lý khiếu nại này?"
          lines={["Bạn sẽ là admin phụ trách; người gửi sẽ được thông báo khiếu nại đang được xử lý."]}
          confirmLabel="Nhận xử lý"
          busy={busy}
          onConfirm={doTake}
          onCancel={() => setConfirmTake(false)}
        />
      )}
    </DetailPane>
  );
}

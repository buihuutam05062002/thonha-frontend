import { useState } from "react";
import { Phone, Clock, UserCog, CheckCircle2, XCircle } from "lucide-react";
import { complaintReasonLabel, complaintStatusLabel } from "../../../api/complaintApi";
import { formatDateTime, formatVnd } from "../../../utils/format";
import { ConfirmDialog } from "../wallets/WalletForms";

export const STATUS_CLASS = {
  PENDING: "wa-status-pending",
  PROCESSING: "cp-status-processing",
  RESOLVED: "wa-status-approved",
  REJECTED: "wa-status-rejected",
};

const RESOLUTION_MAX = 2000;
const ROLE_LABEL = { CUSTOMER: "Khách", WORKER: "Thợ" };

function Party({ title, party, tag }) {
  return (
    <div>
      <small>{title}</small>
      <strong>
        {party?.fullName ?? "-"}
        {tag && <span className="cp-tag">{tag}</span>}
      </strong>
      <span><Phone size={12} /> {party?.phoneNumber || "-"}</span>
    </div>
  );
}

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

  return (
    <form className="cp-form" onSubmit={submit}>
      <h3>Kết luận khiếu nại</h3>
      <div className="cp-choice-row" role="radiogroup" aria-label="Kết quả xử lý">
        <button
          type="button" role="radio" aria-checked={resolved}
          className={`cp-choice ${resolved ? "active-resolved" : ""}`}
          onClick={() => setStatus("RESOLVED")}
        >
          Giải quyết
        </button>
        <button
          type="button" role="radio" aria-checked={!resolved}
          className={`cp-choice ${!resolved ? "active-rejected" : ""}`}
          onClick={() => setStatus("REJECTED")}
        >
          Từ chối
        </button>
      </div>

      <label htmlFor="cp-resolution">Nội dung kết luận</label>
      <textarea
        id="cp-resolution"
        className="wl-input wl-textarea"
        rows={5}
        maxLength={RESOLUTION_MAX}
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder={resolved ? "Cách giải quyết, các bên cần làm gì tiếp theo..." : "Lý do từ chối khiếu nại..."}
      />
      <div className="cp-counter">{resolution.length}/{RESOLUTION_MAX}</div>

      <p className="cp-note">
        Kết luận được gửi cho người khiếu nại và không thể sửa sau khi đóng. Việc hoàn tiền / điều chỉnh ví
        (nếu có) chưa xử lý ở đây, hãy ghi rõ trong nội dung.
      </p>
      {error && <p className="cp-form-error" role="alert">{error}</p>}

      <div className="wa-actions">
        <button type="button" className="wa-cancel" onClick={onClose}>Hủy</button>
        <button type="submit" className="wa-approve">Tiếp tục</button>
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

  if (loading && !data) {
    return <aside className="wa-detail wa-empty" aria-busy="true">Đang tải khiếu nại...</aside>;
  }
  if (error) return <aside className="wa-detail wa-empty wa-error" role="alert">{error}</aside>;
  if (!data) return <aside className="wa-detail wa-empty">Chọn một khiếu nại để xem chi tiết</aside>;

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

  return (
    <aside className="wa-detail">
      <div className="wa-detail-header">
        <h2>Khiếu nại <small>#{c.id}</small></h2>
        <span className={`wa-status ${STATUS_CLASS[c.status] ?? ""}`}>{complaintStatusLabel(c)}</span>
      </div>

      <section className="wa-section">
        <h3>Nội dung khiếu nại</h3>
        <dl className="wa-fields">
          <dt>Lý do</dt><dd>{complaintReasonLabel(c)}</dd>
          <dt>Người gửi</dt>
          <dd>{c.complainantName}<span className="cp-tag">{ROLE_LABEL[c.complainantRole]}</span></dd>
          <dt>Bị khiếu nại</dt><dd>{c.againstName ?? "-"}</dd>
          <dt>Gửi lúc</dt><dd><Clock size={12} /> {formatDateTime(c.createdAt)}</dd>
        </dl>
        <div className="cp-box"><p className="cp-text">{c.description || "-"}</p></div>

        {c.images?.length > 0 && (
          <div className="wa-gallery" style={{ marginTop: 10 }}>
            {c.images.map((url, i) => (
              <a key={url} className="wa-thumb" href={url} target="_blank" rel="noreferrer noopener">
                <img src={url} alt={`Ảnh bằng chứng ${i + 1}`} loading="lazy" />
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="wa-section">
        <h3>Đơn sửa chữa <small>{request.requestCode}</small></h3>
        <dl className="wa-fields">
          <dt>Dịch vụ</dt><dd>{request.categoryName}</dd>
          <dt>Trạng thái đơn</dt><dd>{request.statusLabel}</dd>
          <dt>Địa chỉ</dt><dd>{request.addressText || "-"}</dd>
          <dt>Giá chốt</dt><dd>{request.finalPrice != null ? formatVnd(request.finalPrice) : "-"}</dd>
          <dt>Mô tả đơn</dt><dd>{request.description}</dd>
        </dl>
        <div className="cp-party">
          <Party title="Khách" party={customer} tag={byCustomer ? "Người gửi" : null} />
          <Party title="Thợ" party={worker} tag={!byCustomer ? "Người gửi" : null} />
        </div>
      </section>

      {payment && (
        <section className="wa-section">
          <h3>Thanh toán</h3>
          <dl className="wa-fields">
            <dt>Tổng tiền</dt><dd>{formatVnd(payment.amount)}</dd>
            <dt>Hoa hồng</dt><dd>{formatVnd(payment.commissionAmount)}</dd>
            <dt>Thợ nhận</dt><dd>{formatVnd(payment.workerAmount)}</dd>
            <dt>Hình thức</dt><dd>{payment.paymentMethod}</dd>
          </dl>
        </section>
      )}

      {(c.handledByName || closed) && (
        <section className="wa-section wa-history">
          <h3>Xử lý</h3>
          {c.handledByName && <p><UserCog size={13} /> Admin phụ trách: <b>{c.handledByName}</b>{mine ? " (bạn)" : ""}</p>}
          {closed && (
            <div className={`cp-box ${c.status === "RESOLVED" ? "cp-box-resolved" : "cp-box-rejected"}`}>
              <p className="cp-text">{c.resolution}</p>
              <small>
                {c.status === "RESOLVED" ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {formatDateTime(c.resolvedAt)}
              </small>
            </div>
          )}
        </section>
      )}

      {actionError && <p className="cp-form-error" role="alert" style={{ marginTop: 12 }}>{actionError}</p>}

      {c.status === "PENDING" && (
        <div className="wa-action-bar">
          <div className="wa-actions">
            <button type="button" className="wa-approve" disabled={busy} onClick={() => setConfirmTake(true)}>
              Nhận xử lý
            </button>
          </div>
        </div>
      )}

      {c.status === "PROCESSING" && mine && (
        <div className="wa-action-bar">
          {resolving ? (
            <ResolveForm onSubmit={onResolve} onClose={() => setResolving(false)} />
          ) : (
            <div className="wa-actions">
              <button type="button" className="wa-approve" onClick={() => setResolving(true)}>Kết luận</button>
            </div>
          )}
        </div>
      )}

      {c.status === "PROCESSING" && !mine && (
        <p className="wa-muted" style={{ marginTop: 14 }}>Khiếu nại đang do admin khác xử lý.</p>
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
    </aside>
  );
}

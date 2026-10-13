import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import MoneyInput from "../../../components/ui/MoneyInput";
import { formatVnd } from "../../../utils/format";

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];
const REASON_MAX = 500;
const REF_MAX = 60;

export function ConfirmDialog({ title, lines, confirmLabel, danger, busy, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="wa-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div className="wa-modal" role="alertdialog" aria-modal="true" aria-labelledby="wl-confirm-title">
        <h3 id="wl-confirm-title">{title}</h3>
        {lines.map((l, i) => <p key={i}>{l}</p>)}
        <div className="wa-actions">
          <button type="button" className="wa-cancel" disabled={busy} onClick={onCancel}>Hủy</button>
          <button type="button" className={danger ? "wa-reject" : "wa-approve"} disabled={busy} onClick={onConfirm}>
            {busy ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TopUpForm({ wallet, onSubmit, onClose }) {
  const [amount, setAmount] = useState(0);
  const [referenceCode, setReferenceCode] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const after = Number(wallet.balance) + amount;

  const submit = (e) => {
    e.preventDefault();
    if (amount < 1) { setError("Vui lòng nhập số tiền lớn hơn 0"); return; }
    setError("");
    setConfirming(true);
  };

  const doSubmit = async () => {
    setBusy(true);
    try {
      await onSubmit({ amount, referenceCode, note });
      onClose();
    } catch (e) {
      setConfirming(false);
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <form className="wl-form" onSubmit={submit} noValidate>
      <h3>Nạp tiền vào ví</h3>

      <label htmlFor="wl-topup-amount">Số tiền (VND)</label>
      <MoneyInput id="wl-topup-amount" className="wl-input" value={amount} onChange={setAmount} placeholder="Ví dụ: 500.000" autoFocus />
      <div className="wl-quick">
        {QUICK_AMOUNTS.map((v) => (
          <button type="button" key={v} className="wa-chip wa-chip-btn" onClick={() => setAmount(v)}>
            {formatVnd(v)}
          </button>
        ))}
      </div>

      <label htmlFor="wl-topup-ref">Mã tham chiếu ngân hàng <small>(không bắt buộc)</small></label>
      <input
        id="wl-topup-ref" className="wl-input" value={referenceCode} maxLength={REF_MAX}
        onChange={(e) => setReferenceCode(e.target.value)} placeholder="Ví dụ: FT26284123456"
      />
      <p className="wl-hint">Cùng một mã chỉ được ghi nhận một lần, tránh nạp trùng khi bấm nhầm hai lần.</p>

      <label htmlFor="wl-topup-note">Ghi chú <small>(không bắt buộc)</small></label>
      <input id="wl-topup-note" className="wl-input" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />

      {amount > 0 && (
        <p className="wl-preview">Số dư sau khi nạp: <b>{formatVnd(after)}</b></p>
      )}
      {error && <p className="wl-form-error" role="alert">{error}</p>}

      <div className="wa-actions">
        <button type="button" className="wa-cancel" onClick={onClose}>Đóng</button>
        <button type="submit" className="wa-approve">Tiếp tục</button>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Xác nhận nạp tiền"
          lines={[
            `Nạp ${formatVnd(amount)} vào ví của ${wallet.workerName}?`,
            `Số dư: ${formatVnd(wallet.balance)} -> ${formatVnd(after)}`,
          ]}
          confirmLabel="Xác nhận nạp"
          busy={busy}
          onConfirm={doSubmit}
          onCancel={() => setConfirming(false)}
        />
      )}
    </form>
  );
}

export function AdjustForm({ wallet, onSubmit, onClose }) {
  const [type, setType] = useState("ADJUSTMENT_CREDIT");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const debit = type === "ADJUSTMENT_DEBIT";
  const balance = Number(wallet.balance);
  const after = debit ? balance - amount : balance + amount;
  const min = Number(wallet.minBalanceToReceiveJobs);
  const willBlock = debit && amount > 0 && wallet.canReceiveJobs && after < min;

  const submit = (e) => {
    e.preventDefault();
    if (amount < 1) { setError("Vui lòng nhập số tiền lớn hơn 0"); return; }
    if (!reason.trim()) { setError("Vui lòng nhập lý do điều chỉnh"); return; }
    setError("");
    setConfirming(true);
  };

  const doSubmit = async () => {
    setBusy(true);
    try {
      await onSubmit({ type, amount, reason });
      onClose();
    } catch (e) {
      setConfirming(false);
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <form className="wl-form" onSubmit={submit} noValidate>
      <h3>Điều chỉnh số dư</h3>

      <div className="wl-segment" role="radiogroup" aria-label="Loại điều chỉnh">
        <button
          type="button" role="radio" aria-checked={!debit}
          className={!debit ? "active" : ""} onClick={() => setType("ADJUSTMENT_CREDIT")}
        >
          Tăng số dư
        </button>
        <button
          type="button" role="radio" aria-checked={debit}
          className={debit ? "active wl-segment-debit" : ""} onClick={() => setType("ADJUSTMENT_DEBIT")}
        >
          Giảm số dư
        </button>
      </div>

      <label htmlFor="wl-adj-amount">Số tiền (VND)</label>
      <MoneyInput id="wl-adj-amount" className="wl-input" value={amount} onChange={setAmount} placeholder="Ví dụ: 50.000" autoFocus />

      <label htmlFor="wl-adj-reason">Lý do <small>(bắt buộc, lưu vào sổ cái)</small></label>
      <textarea
        id="wl-adj-reason" className="wl-input wl-textarea" rows={3} maxLength={REASON_MAX} value={reason}
        onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: Sửa nhầm hoa hồng đơn TN-1042"
      />
      <small className="wa-counter">{reason.length}/{REASON_MAX}</small>

      {amount > 0 && (
        <p className="wl-preview">Số dư sau điều chỉnh: <b className={after < 0 ? "wl-neg" : ""}>{formatVnd(after)}</b></p>
      )}
      {willBlock && (
        <p className="wl-warning">
          <AlertTriangle size={14} aria-hidden="true" />
          Số dư sau điều chỉnh thấp hơn mức tối thiểu ({formatVnd(min)}), thợ sẽ không nhận được đơn mới.
        </p>
      )}
      {error && <p className="wl-form-error" role="alert">{error}</p>}

      <div className="wa-actions">
        <button type="button" className="wa-cancel" onClick={onClose}>Đóng</button>
        <button type="submit" className={debit ? "wa-reject" : "wa-approve"}>Tiếp tục</button>
      </div>

      {confirming && (
        <ConfirmDialog
          title={debit ? "Xác nhận giảm số dư" : "Xác nhận tăng số dư"}
          lines={[
            `${debit ? "Trừ" : "Cộng"} ${formatVnd(amount)} ${debit ? "khỏi" : "vào"} ví của ${wallet.workerName}?`,
            `Số dư: ${formatVnd(balance)} -> ${formatVnd(after)}`,
            `Lý do: ${reason.trim()}`,
          ]}
          confirmLabel={debit ? "Xác nhận giảm" : "Xác nhận tăng"}
          danger={debit}
          busy={busy}
          onConfirm={doSubmit}
          onCancel={() => setConfirming(false)}
        />
      )}
    </form>
  );
}

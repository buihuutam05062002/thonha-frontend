import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import MoneyInput from "../../../components/ui/MoneyInput";
import { formatVnd } from "../../../utils/format";
import {
  Button, CONTROL, Chip, ConfirmDialog, ErrorText, Note, Textarea, cn,
} from "../../../components/admin/ui";

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];
const REASON_MAX = 500;
const REF_MAX = 60;

const FORM = "flex flex-col gap-2 rounded-[14px] border-[1px] border-line bg-surface p-16px";
const LABEL = "mt-1 text-[13px] font-semibold text-ink";

function Optional({ children }) {
  return <small className="font-normal text-subtle">{children}</small>;
}

/** Nạp tiền: thợ đã nộp tiền hoa hồng cho công ty. Mã tham chiếu giúp chống ghi nhận trùng. */
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
    <form className={FORM} onSubmit={submit} noValidate>
      <h3 className="m-0 mb-1 text-[15px] font-bold text-brand-dark">Nạp tiền vào ví</h3>

      <label htmlFor="wl-topup-amount" className={LABEL}>Số tiền (VND)</label>
      <MoneyInput id="wl-topup-amount" className={cn(CONTROL, "w-full")} value={amount} onChange={setAmount} placeholder="Ví dụ: 500.000" autoFocus />
      <div className="flex flex-wrap gap-1.5">
        {QUICK_AMOUNTS.map((v) => (
          <Chip variant="action" key={v} onClick={() => setAmount(v)}>{formatVnd(v)}</Chip>
        ))}
      </div>

      <label htmlFor="wl-topup-ref" className={LABEL}>Mã tham chiếu ngân hàng <Optional>(không bắt buộc)</Optional></label>
      <input
        id="wl-topup-ref" className={cn(CONTROL, "w-full")} value={referenceCode} maxLength={REF_MAX}
        onChange={(e) => setReferenceCode(e.target.value)} placeholder="Ví dụ: FT26284123456"
      />
      <p className="m-0 text-[11.5px] text-subtle">Cùng một mã chỉ được ghi nhận một lần, tránh nạp trùng khi bấm nhầm hai lần.</p>

      <label htmlFor="wl-topup-note" className={LABEL}>Ghi chú <Optional>(không bắt buộc)</Optional></label>
      <input id="wl-topup-note" className={cn(CONTROL, "w-full")} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />

      {amount > 0 && <p className="m-0 mt-1 text-[13px] text-ink">Số dư sau khi nạp: <b>{formatVnd(after)}</b></p>}
      <ErrorText>{error}</ErrorText>

      <div className="mt-1.5 flex gap-2.5">
        <Button variant="neutral" size="lg" className="flex-1" onClick={onClose}>Đóng</Button>
        <Button type="submit" size="lg" className="flex-1">Tiếp tục</Button>
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

/** Điều chỉnh tăng/giảm để sửa sai sót. Bắt buộc có lý do, được lưu vào sổ cái. */
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

  const seg = (active, activeClass) =>
    cn(
      "flex-1 cursor-pointer rounded-full border-0 px-2.5 py-[7px] text-[13px] transition-colors",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      active ? `${activeClass} font-semibold text-white` : "bg-transparent text-ink hover:bg-slate-200",
    );

  return (
    <form className={FORM} onSubmit={submit} noValidate>
      <h3 className="m-0 mb-1 text-[15px] font-bold text-brand-dark">Điều chỉnh số dư</h3>

      <div className="flex gap-[3px] rounded-full bg-slate-100 p-[3px]" role="radiogroup" aria-label="Loại điều chỉnh">
        <button type="button" role="radio" aria-checked={!debit} className={seg(!debit, "bg-green-600")} onClick={() => setType("ADJUSTMENT_CREDIT")}>
          Tăng số dư
        </button>
        <button type="button" role="radio" aria-checked={debit} className={seg(debit, "bg-red-500")} onClick={() => setType("ADJUSTMENT_DEBIT")}>
          Giảm số dư
        </button>
      </div>

      <label htmlFor="wl-adj-amount" className={LABEL}>Số tiền (VND)</label>
      <MoneyInput id="wl-adj-amount" className={cn(CONTROL, "w-full")} value={amount} onChange={setAmount} placeholder="Ví dụ: 50.000" autoFocus />

      <label htmlFor="wl-adj-reason" className={LABEL}>Lý do <Optional>(bắt buộc, lưu vào sổ cái)</Optional></label>
      <Textarea
        id="wl-adj-reason" className="w-full resize-y" rows={3} maxLength={REASON_MAX} value={reason}
        onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: Sửa nhầm hoa hồng đơn TN-1042"
      />
      <small className="self-end text-[11.5px] text-subtle">{reason.length}/{REASON_MAX}</small>

      {amount > 0 && (
        <p className="m-0 mt-1 text-[13px] text-ink">
          Số dư sau điều chỉnh: <b className={after < 0 ? "text-red-700" : ""}>{formatVnd(after)}</b>
        </p>
      )}
      {willBlock && (
        <Note className="flex items-start gap-1.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>Số dư sau điều chỉnh thấp hơn mức tối thiểu ({formatVnd(min)}), thợ sẽ không nhận được đơn mới.</span>
        </Note>
      )}
      <ErrorText>{error}</ErrorText>

      <div className="mt-1.5 flex gap-2.5">
        <Button variant="neutral" size="lg" className="flex-1" onClick={onClose}>Đóng</Button>
        <Button type="submit" size="lg" variant={debit ? "danger" : "success"} className="flex-1">Tiếp tục</Button>
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

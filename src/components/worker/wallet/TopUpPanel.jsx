import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import { Check, Copy } from "lucide-react";
import { parseApiError } from "../../../api/apiError";
import { createTopUp, getTopUp } from "../../../api/walletApi";
import { formatMoneyInput, formatVnd, parseMoneyInput } from "../../../utils/format";
import "./TopUpPanel.css";

const POLL_MS = 3000;
const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];

function InfoRow({ label, value, must }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard?.writeText(String(value)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
    };
    return (
        <div className={`tu-row${must ? " must" : ""}`}>
            <div className="tu-row-text">
                <div className="tu-row-label">{label}{must && <span className="tu-badge">Bắt buộc</span>}</div>
                <div className="tu-row-value">{value}</div>
            </div>
            <button type="button" className={`tu-copy${copied ? " done" : ""}`} onClick={copy} aria-label={`Sao chép ${label}`}>
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? "Đã chép" : "Chép"}
            </button>
        </div>
    );
}

/**
 * Thợ tự nạp tiền vào ví bằng chuyển khoản QR (SePay).
 * Nhập số tiền -> nhận QR -> quét bằng app ngân hàng -> hệ thống tự cộng tiền khi nhận được (thường vài giây).
 * onPaid(topUp) được gọi khi bấm "Xong" sau khi nạp thành công; onCancel quay lại màn trước.
 */
export function TopUpPanel({ onPaid, onCancel }) {
    const [amountText, setAmountText] = useState("");
    const [topUp, setTopUp] = useState(null);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const amount = parseMoneyInput(amountText);
    const pending = topUp?.status === "PENDING_PAYMENT";
    const paid = topUp?.status === "SUCCESS";

    // Đang chờ tiền về thì hỏi lại định kỳ (webhook SePay thường về trong vài giây)
    useEffect(() => {
        if (!pending) return undefined;
        const id = setInterval(() => {
            if (document.visibilityState !== "visible") return;
            getTopUp(topUp.topUpId)
                .then((t) => { if (mounted.current) setTopUp(t); })
                .catch(() => {});
        }, POLL_MS);
        return () => clearInterval(id);
    }, [pending, topUp?.topUpId]);

    const create = useCallback(async () => {
        if (!amount) { setError("Vui lòng nhập số tiền cần nạp."); return; }
        setCreating(true);
        setError("");
        try {
            const t = await createTopUp(amount);
            if (mounted.current) setTopUp(t);
        } catch (e) {
            if (mounted.current) setError(parseApiError(e).message || "Không tạo được mã nạp tiền.");
        } finally {
            if (mounted.current) setCreating(false);
        }
    }, [amount]);

    if (paid) {
        return (
            <div className="tu tu-done">
                <div className="tu-done-icon"><Check size={32} aria-hidden="true" /></div>
                <h6>Nạp tiền thành công</h6>
                <p>Đã cộng <b>{formatVnd(topUp.paidAmount ?? topUp.amount)}</b> vào ví.</p>
                {topUp.balance != null && <p className="tu-balance">Số dư mới: <b>{formatVnd(topUp.balance)}</b></p>}
                <button type="button" className="tu-btn tu-btn-primary tu-btn-block" onClick={() => onPaid?.(topUp)}>Xong</button>
            </div>
        );
    }

    if (pending) {
        return (
            <div className="tu">
                <div className="tu-total">
                    <small>Số tiền cần chuyển</small>
                    <strong>{formatVnd(topUp.amount)}</strong>
                </div>
                <div className="tu-qr">
                    <img src={topUp.qrUrl} alt="Mã QR nạp tiền vào ví" />
                </div>
                <p className="tu-qr-note">Quét mã bằng app ngân hàng — số tiền và nội dung đã điền sẵn.</p>

                <div className="tu-info">
                    <InfoRow label="Nội dung chuyển khoản" value={topUp.paymentCode} must />
                    <InfoRow label="Số tiền" value={String(Math.round(Number(topUp.amount)))} />
                    <InfoRow label={`Ngân hàng ${topUp.bankName}`} value={topUp.bankAccount} />
                    <InfoRow label="Chủ tài khoản" value={topUp.accountHolder} />
                </div>

                <div className="tu-wait" role="status">
                    <Spinner animation="border" size="sm" style={{ color: "#f5820d", flex: "none" }} />
                    <span>Đang chờ tiền về — hệ thống tự cộng vào ví, bạn không cần bấm gì thêm.</span>
                </div>
                <button type="button" className="tu-link" onClick={() => setTopUp(null)}>Đổi số tiền khác</button>
            </div>
        );
    }

    return (
        <div className="tu">
            <label htmlFor="topup-amount" className="tu-label">Số tiền muốn nạp</label>
            <div className="tu-input-wrap">
                <input
                    id="topup-amount"
                    className="tu-input"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatMoneyInput(amount)}
                    onChange={(e) => { setAmountText(e.target.value); setError(""); }}
                    autoComplete="off"
                />
                <span className="tu-input-suffix">đ</span>
            </div>
            <div className="tu-chips">
                {QUICK_AMOUNTS.map((v) => (
                    <button key={v} type="button" className={`tu-chip${amount === v ? " active" : ""}`}
                            onClick={() => { setAmountText(String(v)); setError(""); }}>
                        {formatVnd(v)}
                    </button>
                ))}
            </div>
            <p className="tu-hint">
                Nạp từ 10.000đ đến 50.000.000đ. Tiền được cộng vào ví hoa hồng ngay khi hệ thống nhận được chuyển khoản.
            </p>
            {error && <div className="tu-error" role="alert">{error}</div>}
            <div className="tu-actions">
                <button type="button" className="tu-btn" onClick={onCancel} disabled={creating}>Quay lại</button>
                <button type="button" className="tu-btn tu-btn-primary" onClick={create} disabled={creating || !amount}>
                    {creating ? "Đang tạo mã..." : "Tạo mã QR"}
                </button>
            </div>
        </div>
    );
}

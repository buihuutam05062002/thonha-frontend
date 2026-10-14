import {useCallback, useEffect, useState} from 'react';
import {Banknote, Check, Copy} from 'lucide-react';
import {createBankTransferPayment, getPayment} from '../../api/paymentApi';
import {formatVnd} from '../../utils/format';

const ACCENT = '#F5820D';
const POLL_MS = 4000;
// Chỉ thanh toán online được khi đã có thợ phụ trách và đơn chưa hoàn thành (khớp backend)
const PAYABLE_STATUSES = ['MATCHED', 'ON_THE_WAY', 'IN_PROGRESS'];

const box = {marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 14};

function CopyRow({label, value}) {
    const [copied, setCopied] = useState(false);

    function copy() {
        navigator.clipboard?.writeText(String(value)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
    }

    return (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderTop: '1px solid #f3f4f6'}}>
            <div style={{minWidth: 0}}>
                <div style={{fontSize: 12, color: '#6b7280'}}>{label}</div>
                <div style={{fontWeight: 600, wordBreak: 'break-all'}}>{value}</div>
            </div>
            <button type="button" onClick={copy} aria-label={`Sao chép ${label}`}
                    style={{border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12}}>
                {copied ? <Check size={14} aria-hidden="true"/> : <Copy size={14} aria-hidden="true"/>}
                {copied ? 'Đã chép' : 'Chép'}
            </button>
        </div>
    );
}

/**
 * Khung thanh toán chuyển khoản QR cho khách.
 * - requestStatus: trạng thái đơn; acceptedAmount: số tiền báo giá đã chấp nhận (null nếu chưa có)
 * - version: đổi giá trị này để tải lại trạng thái thanh toán (vd khi nhận thông báo PAYMENT_SUCCESS)
 */
export default function PaymentPanel({requestId, requestStatus, acceptedAmount, version}) {
    const [payment, setPayment] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        return getPayment(requestId)
            .then((data) => setPayment(data ?? null))
            .catch(() => {})
            .finally(() => setLoaded(true));
    }, [requestId]);

    useEffect(() => {
        load();
    }, [load, version]);

    // Đang chờ tiền về thì hỏi lại định kỳ (webhook của SePay thường về trong vài giây)
    const pending = payment?.status === 'PENDING_PAYMENT';
    useEffect(() => {
        if (!pending) return undefined;
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') load();
        }, POLL_MS);
        return () => clearInterval(id);
    }, [pending, load]);

    async function createQr() {
        setBusy(true);
        setError('');
        try {
            setPayment(await createBankTransferPayment(requestId));
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    if (!loaded) return null;

    if (payment?.status === 'SUCCESS') {
        return (
            <div style={{...box, background: '#ecfdf3', borderColor: '#abefc6', color: '#067647'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600}}>
                    <Check size={18} aria-hidden="true"/>
                    {payment.method === 'BANK_TRANSFER' ? 'Đã thanh toán chuyển khoản' : 'Đã thanh toán tiền mặt'}
                </div>
                <div style={{marginTop: 4, fontSize: 14}}>Số tiền: <b>{formatVnd(payment.amount)}</b></div>
            </div>
        );
    }

    if (!PAYABLE_STATUSES.includes(requestStatus) || acceptedAmount == null) return null;

    const outdated = pending && Number(payment.amount) !== Number(acceptedAmount);

    return (
        <div style={box}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6}}>
                <Banknote size={18} color={ACCENT} aria-hidden="true"/>
                Thanh toán chuyển khoản
            </div>
            <div style={{fontSize: 14, marginBottom: 8}}>
                Số tiền theo báo giá đã chấp nhận: <b>{formatVnd(acceptedAmount)}</b>.
                Bạn cũng có thể trả tiền mặt trực tiếp cho thợ.
            </div>

            {error && <div style={{color: '#b42318', fontSize: 13, margin: '6px 0'}}>{error}</div>}

            {(!pending || outdated) && (
                <button type="button" onClick={createQr} disabled={busy}
                        style={{border: 0, borderRadius: 8, background: ACCENT, color: '#fff', padding: '9px 12px', fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.5 : 1}}>
                    {busy ? 'Đang tạo...' : outdated ? 'Báo giá đã đổi - tạo lại mã QR' : 'Thanh toán bằng QR'}
                </button>
            )}

            {pending && !outdated && (
                <div>
                    <div style={{display: 'flex', justifyContent: 'center', margin: '8px 0'}}>
                        <img src={payment.qrUrl} alt="Mã QR chuyển khoản" width={220} height={220}
                             style={{border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff'}}/>
                    </div>
                    <div style={{fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 6}}>
                        Quét mã bằng app ngân hàng. Giữ nguyên số tiền và nội dung chuyển khoản.
                    </div>
                    <CopyRow label="Số tiền" value={String(Math.round(Number(payment.amount)))}/>
                    <CopyRow label="Nội dung chuyển khoản (bắt buộc)" value={payment.paymentCode}/>
                    <CopyRow label={`Ngân hàng ${payment.bankName}`} value={payment.bankAccount}/>
                    <CopyRow label="Chủ tài khoản" value={payment.accountHolder}/>
                    <div style={{fontSize: 13, color: '#6b7280', marginTop: 8}}>
                        Hệ thống tự xác nhận khi nhận được tiền (thường trong vài giây), bạn không cần bấm gì thêm.
                    </div>
                </div>
            )}
        </div>
    );
}

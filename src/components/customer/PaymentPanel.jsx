import {useCallback, useEffect, useState} from 'react';
import {Banknote, Check} from 'lucide-react';
import {getPayment} from '../../api/paymentApi';
import {formatVnd} from '../../utils/format';

const ACCENT = '#F5820D';
// Chỉ hiện hướng dẫn thanh toán khi đã có thợ phụ trách và đơn chưa hoàn thành
const ACTIVE_STATUSES = ['MATCHED', 'ON_THE_WAY', 'IN_PROGRESS'];

const box = {marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 14};

/**
 * Thông tin thanh toán cho khách: khách trả trực tiếp cho thợ (tiền mặt hoặc chuyển khoản riêng), không có QR của hệ thống.
 * - requestStatus: trạng thái đơn; acceptedAmount: số tiền báo giá đã chấp nhận (null nếu chưa có)
 * - version: đổi giá trị này để tải lại trạng thái thanh toán
 */
export default function PaymentPanel({requestId, requestStatus, acceptedAmount, version}) {
    const [payment, setPayment] = useState(null);
    const [loaded, setLoaded] = useState(false);

    const load = useCallback(() => {
        return getPayment(requestId)
            .then((data) => setPayment(data ?? null))
            .catch(() => {})
            .finally(() => setLoaded(true));
    }, [requestId]);

    useEffect(() => {
        load();
    }, [load, version]);

    if (!loaded) return null;

    if (payment?.status === 'SUCCESS') {
        return (
            <div style={{...box, background: '#ecfdf3', borderColor: '#abefc6', color: '#067647'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600}}>
                    <Check size={18} aria-hidden="true"/>
                    Đã thanh toán cho thợ
                </div>
                <div style={{marginTop: 4, fontSize: 14}}>Số tiền: <b>{formatVnd(payment.amount)}</b></div>
            </div>
        );
    }

    if (!ACTIVE_STATUSES.includes(requestStatus) || acceptedAmount == null) return null;

    return (
        <div style={box}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6}}>
                <Banknote size={18} color={ACCENT} aria-hidden="true"/>
                Thanh toán trực tiếp cho thợ
            </div>
            <div style={{fontSize: 14}}>
                Số tiền theo báo giá đã chấp nhận: <b>{formatVnd(acceptedAmount)}</b>.
            </div>
            <div style={{fontSize: 13, color: '#6b7280', marginTop: 6}}>
                Sau khi thợ sửa xong, bạn trả tiền mặt hoặc chuyển khoản trực tiếp cho thợ.
                Hệ thống không thu tiền thay thợ.
            </div>
        </div>
    );
}

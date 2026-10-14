import {useCallback, useEffect, useRef, useState} from 'react';
import {BadgeDollarSign} from 'lucide-react';
import {
    QUOTATION_MIN_AMOUNT,
    acceptQuotation,
    createQuotation,
    getQuotationsByRequest,
    rejectQuotation,
} from '../../api/quotationApi';
import {useAuth} from '../../auth/useAuth';
import {useConfirm} from '../ui/confirm/confirmContext';
import {useUserTopics} from '../../hooks/useUserTopics';
import {formatVnd} from '../../utils/format';

const ACCENT = '#F5820D';
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN', {hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'}) : '');

const TONE = {
    PENDING: {bg: '#fff7ed', fg: '#c2410c'},
    ACCEPTED: {bg: '#ecfdf3', fg: '#067647'},
    REJECTED: {bg: '#fef3f2', fg: '#b42318'},
    EXPIRED: {bg: '#f3f4f6', fg: '#6b7280'},
};

/**
 * Báo giá của một yêu cầu. role = "worker": gửi báo giá; role = "customer": chấp nhận / từ chối.
 * `active` = yêu cầu còn đang thực hiện (thợ chỉ gửi được khi active).
 * `onLoaded(list)` báo danh sách báo giá cho component cha (vd: điền sẵn giá hoàn thành).
 */
export default function QuotationPanel({requestId, role, active = true, onLoaded}) {
    const userId = useAuth().user?.id;
    const confirm = useConfirm();
    const [list, setList] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const onLoadedRef = useRef(onLoaded);
    useEffect(() => {
        onLoadedRef.current = onLoaded;
    });

    const load = useCallback(async () => {
        try {
            const data = await getQuotationsByRequest(requestId);
            setList(data);
            setLoadError('');
            onLoadedRef.current?.(data);
        } catch (e) {
            setLoadError(e.message);
        }
    }, [requestId]);

    useEffect(() => {
        load();
    }, [load]);

    const topic = role === 'worker' ? 'matching' : 'requests';
    const connected = useUserTopics(userId, [topic], (msg) => {
        if (msg?.requestId && Number(msg.requestId) !== Number(requestId)) return;
        if (['NEW_QUOTATION', 'QUOTATION_ACCEPTED', 'QUOTATION_REJECTED'].includes(msg?.type)) load();
    });
    useEffect(() => {
        if (connected) load(); // bù sự kiện bị lỡ khi mất mạng
    }, [connected, load]);

    async function run(fn) {
        setBusy(true);
        setError('');
        try {
            await fn();
            await load();
        } catch (e) {
            setError(e.message);
            load(); // trạng thái có thể đã đổi (vd: thợ vừa gửi báo giá mới)
        } finally {
            setBusy(false);
        }
    }

    function submit(e) {
        e.preventDefault();
        const value = Number(amount);
        if (!Number.isFinite(value) || value < QUOTATION_MIN_AMOUNT) {
            setError(`Số tiền tối thiểu là ${formatVnd(QUOTATION_MIN_AMOUNT)}`);
            return;
        }
        run(async () => {
            await createQuotation(requestId, value, note);
            setAmount('');
            setNote('');
        });
    }

    // khách chưa nhận được báo giá nào thì không cần hiện khung
    if (role === 'customer' && list.length === 0 && !loadError) return null;

    return (
        <div style={{marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 14}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 10}}>
                <BadgeDollarSign size={18} color={ACCENT} aria-hidden="true"/>
                Báo giá
            </div>

            {loadError && <div style={{color: '#b42318', fontSize: 13}}>{loadError}</div>}

            {role === 'worker' && active && (
                <form onSubmit={submit} style={{display: 'flex', flexDirection: 'column', gap: 8, marginBottom: list.length ? 12 : 0}}>
                    <input type="number" min={QUOTATION_MIN_AMOUNT} step="1000" inputMode="numeric" value={amount}
                           onChange={(e) => setAmount(e.target.value)} placeholder="Số tiền báo giá (đ), VD: 350000" disabled={busy}
                           style={{border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 14}}/>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} disabled={busy}
                              placeholder="Ghi chú cho khách (hạng mục, vật tư...) - không bắt buộc"
                              style={{border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 14, resize: 'vertical'}}/>
                    <button type="submit" disabled={busy || !amount}
                            style={{border: 0, borderRadius: 8, background: ACCENT, color: '#fff', padding: '9px 12px', fontWeight: 600, cursor: 'pointer', opacity: busy || !amount ? 0.5 : 1}}>
                        {busy ? 'Đang gửi...' : 'Gửi báo giá cho khách'}
                    </button>
                    <span style={{fontSize: 12, color: '#6b7280'}}>Gửi báo giá mới sẽ thay thế báo giá đang chờ khách phản hồi.</span>
                </form>
            )}
            {role === 'worker' && !active && list.length === 0 && (
                <div style={{fontSize: 13, color: '#6b7280'}}>Yêu cầu đã kết thúc.</div>
            )}

            {error && <div style={{color: '#b42318', fontSize: 13, margin: '6px 0'}}>{error}</div>}

            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                {list.map((q) => {
                    const tone = TONE[q.status] ?? TONE.EXPIRED;
                    return (
                        <div key={q.id} style={{border: '1px solid #e5e7eb', borderRadius: 10, padding: 10}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8}}>
                                <b style={{fontSize: 16}}>{formatVnd(q.totalAmount)}</b>
                                <span style={{background: tone.bg, color: tone.fg, borderRadius: 999, fontSize: 12, padding: '2px 10px'}}>
                                    {q.statusDescription}
                                </span>
                            </div>
                            {q.note && <div style={{fontSize: 13, margin: '6px 0 0', whiteSpace: 'pre-wrap'}}>{q.note}</div>}
                            <div style={{fontSize: 11, color: '#9ca3af', marginTop: 4}}>
                                {role === 'customer' ? `Thợ ${q.workerName} | ` : ''}{fmt(q.createdAt)}
                            </div>
                            {role === 'customer' && q.actionable && (
                                <div style={{display: 'flex', gap: 8, marginTop: 8}}>
                                    <button type="button" disabled={busy} onClick={() => run(() => acceptQuotation(q.id))}
                                            style={{flex: 1, border: 0, borderRadius: 8, background: ACCENT, color: '#fff', padding: '8px 10px', fontWeight: 600, cursor: 'pointer'}}>
                                        Chấp nhận
                                    </button>
                                    <button type="button" disabled={busy}
                                            onClick={async () => {
                                                const ok = await confirm({title: 'Từ chối báo giá?', message: 'Thợ sẽ được thông báo là bạn từ chối báo giá này.', confirmText: 'Từ chối', danger: true});
                                                if (ok) run(() => rejectQuotation(q.id));
                                            }}
                                            style={{flex: 1, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', padding: '8px 10px', cursor: 'pointer'}}>
                                        Từ chối
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

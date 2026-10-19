import {useCallback, useEffect, useMemo, useState} from 'react';
import {AlertTriangle, X} from 'lucide-react';
import {toast} from 'react-toastify';
import {
    COMPLAINT_REASON_LABELS,
    complaintReasonLabel,
    complaintStatusLabel,
    createComplaint,
    fetchMyComplaints,
} from '../../api/complaintApi';
import {useAuth} from '../../auth/useAuth';
import {useUserTopics} from '../../hooks/useUserTopics';
import {useConfirm} from '../ui/confirm/confirmContext';

const ACCENT = '#F5820D';
const DESC_MAX = 2000;
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Thợ khiếu nại khách: chỉ các lý do phù hợp (các lý do còn lại nói về chất lượng/thái độ của thợ)
const REASONS_BY_ROLE = {
    customer: Object.keys(COMPLAINT_REASON_LABELS),
    worker: ['RUDE_BEHAVIOR', 'OTHER'],
};

const TONE = {
    PENDING: {background: '#fdf0dc', color: '#94530f'},
    PROCESSING: {background: '#d6e6f7', color: '#1b5a9a'},
    RESOLVED: {background: '#cfead9', color: '#1e7e34'},
    REJECTED: {background: '#f6cdd0', color: '#b02a37'},
};

const OPEN = ['PENDING', 'PROCESSING'];

/**
 * Khiếu nại cho một đơn, dùng cho cả khách (role = "customer") và thợ (role = "worker").
 * Hiện các khiếu nại mình đã gửi cho đơn này (kèm kết luận của admin) và form gửi khiếu nại mới.
 * Mỗi người chỉ có 1 khiếu nại đang mở trên 1 đơn, nên đang có khiếu nại mở thì ẩn nút gửi thêm.
 * Tiến trình xử lý cập nhật realtime qua /topic/user/{id}/complaints. Component cha quyết định khi nào hiển thị
 * (đơn đã có thợ và chưa bị huỷ).
 */
export default function ComplaintPanel({requestId, role}) {
    const userId = useAuth().user?.id;
    const confirm = useConfirm();
    const reasons = REASONS_BY_ROLE[role] ?? REASONS_BY_ROLE.customer;

    const [loaded, setLoaded] = useState(false);
    const [items, setItems] = useState([]);
    const [loadError, setLoadError] = useState('');

    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const load = useCallback(async () => {
        try {
            setItems(await fetchMyComplaints({requestId}));
            setLoadError('');
        } catch (e) {
            setLoadError(e.message);
        } finally {
            setLoaded(true);
        }
    }, [requestId]);

    useEffect(() => {
        load();
    }, [load]);

    // admin nhận xử lý / kết luận -> cập nhật ngay
    useUserTopics(userId, ['complaints'], (msg) => {
        if (Number(msg?.requestId) === Number(requestId)) load();
    });

    const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
    useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

    function pickFiles(e) {
        const picked = Array.from(e.target.files ?? []);
        e.target.value = ''; // cho phép chọn lại cùng một file
        if (picked.length === 0) return;
        const next = [...files];
        for (const f of picked) {
            if (!IMAGE_TYPES.includes(f.type)) {
                setError('Chỉ nhận ảnh JPG, PNG hoặc WEBP');
                return;
            }
            if (f.size > MAX_IMAGE_BYTES) {
                setError('Mỗi ảnh tối đa 5 MB');
                return;
            }
            if (next.length >= MAX_IMAGES) {
                setError(`Chỉ đính kèm tối đa ${MAX_IMAGES} ảnh`);
                return;
            }
            next.push(f);
        }
        setError('');
        setFiles(next);
    }

    function reset() {
        setOpen(false);
        setReason('');
        setDescription('');
        setFiles([]);
        setError('');
    }

    async function submit(e) {
        e.preventDefault();
        if (busy) return;
        if (!reason) { setError('Vui lòng chọn lý do khiếu nại'); return; }
        if (!description.trim()) { setError('Vui lòng mô tả vấn đề'); return; }

        const ok = await confirm({
            title: 'Gửi khiếu nại?',
            message: `Lý do: ${COMPLAINT_REASON_LABELS[reason]}`
                + (files.length ? `\nKèm ${files.length} ảnh bằng chứng.` : '')
                + '\nKhiếu nại sẽ được chuyển tới quản trị viên xem xét. Trong lúc đang xử lý, bạn chưa thể gửi khiếu nại khác cho đơn này.',
            confirmText: 'Gửi khiếu nại',
            cancelText: 'Xem lại',
        });
        if (!ok) return;

        setBusy(true);
        setError('');
        try {
            await createComplaint({requestId, reason, description, files});
            reset();
            toast.success('Đã gửi khiếu nại. Chúng tôi sẽ xem xét và phản hồi sớm nhất.');
            setSent(true);
            await load();
        } catch (err) {
            setError(err.message);
            load();
        } finally {
            setBusy(false);
        }
    }

    if (!loaded) return null;

    const hasOpen = items.some((c) => OPEN.includes(c.status));
    const box = {marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 14};
    const input = {
        width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px',
        fontSize: 14, boxSizing: 'border-box', background: '#fff',
    };

    return (
        <div style={box}>
            <div style={{fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6}}>
                <AlertTriangle size={16} aria-hidden="true" color={ACCENT}/> Khiếu nại
            </div>

            {loadError && items.length === 0 && (
                <div style={{color: '#b42318', fontSize: 13, marginBottom: 8}}>{loadError}</div>
            )}

            {items.map((c) => (
                <div key={c.id} style={{border: '1px solid #f0f0f0', borderRadius: 10, padding: 10, marginBottom: 10}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8}}>
                        <b style={{fontSize: 14}}>{complaintReasonLabel(c)}</b>
                        <span style={{...TONE[c.status], borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'}}>
                            {complaintStatusLabel(c)}
                        </span>
                    </div>
                    <p style={{margin: '6px 0 0', fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{c.description}</p>
                    {c.images?.length > 0 && (
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8}}>
                            {c.images.map((url, i) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer noopener">
                                    <img src={url} alt={`Ảnh khiếu nại ${i + 1}`}
                                         style={{width: 64, height: 64, objectFit: 'cover', borderRadius: 8}}/>
                                </a>
                            ))}
                        </div>
                    )}
                    <div style={{fontSize: 12, color: '#6b7280', marginTop: 6}}>
                        Gửi lúc {new Date(c.createdAt).toLocaleString('vi-VN')}
                        {c.handledByName && c.status === 'PROCESSING' ? ` | ${c.handledByName} đang xử lý` : ''}
                    </div>
                    {c.resolution && (
                        <div style={{
                            marginTop: 8, borderRadius: 8, padding: '8px 10px', fontSize: 14,
                            background: c.status === 'RESOLVED' ? '#e8f6ed' : '#fdecec',
                        }}>
                            <b style={{fontSize: 13}}>Kết luận của quản trị viên</b>
                            <p style={{margin: '4px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{c.resolution}</p>
                        </div>
                    )}
                </div>
            ))}

            {hasOpen && (
                <div style={{fontSize: 13, color: '#6b7280'}}>
                    Khiếu nại của bạn đang được xử lý, bạn sẽ nhận thông báo ngay khi có kết luận.
                </div>
            )}

            {!hasOpen && !open && (
                <>
                    {items.length === 0 && (
                        <div style={{fontSize: 13, color: '#6b7280', marginBottom: 8}}>
                            {role === 'worker'
                                ? 'Gặp vấn đề với khách trong đơn này? Gửi khiếu nại để chúng tôi hỗ trợ.'
                                : 'Chưa hài lòng về đơn này? Gửi khiếu nại để chúng tôi hỗ trợ.'}
                        </div>
                    )}
                    {sent && (
                        <div style={{fontSize: 13, color: '#1e7e34', marginBottom: 8}}>Đã gửi khiếu nại.</div>
                    )}
                    <button type="button" onClick={() => { setSent(false); setOpen(true); }}
                            style={{border: `1px solid ${ACCENT}`, background: '#fff', color: ACCENT, borderRadius: 8, padding: '8px 14px', fontWeight: 600, cursor: 'pointer'}}>
                        Gửi khiếu nại
                    </button>
                </>
            )}

            {!hasOpen && open && (
                <form onSubmit={submit}>
                    <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}} htmlFor={`cp-reason-${requestId}`}>
                        Lý do
                    </label>
                    <select id={`cp-reason-${requestId}`} value={reason} onChange={(e) => setReason(e.target.value)}
                            disabled={busy} style={input}>
                        <option value="">-- Chọn lý do --</option>
                        {reasons.map((r) => (
                            <option key={r} value={r}>{COMPLAINT_REASON_LABELS[r]}</option>
                        ))}
                    </select>

                    <label style={{display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px'}} htmlFor={`cp-desc-${requestId}`}>
                        Mô tả vấn đề
                    </label>
                    <textarea id={`cp-desc-${requestId}`} value={description} rows={4} maxLength={DESC_MAX}
                              onChange={(e) => setDescription(e.target.value)} disabled={busy}
                              placeholder="Mô tả cụ thể chuyện đã xảy ra để chúng tôi xử lý nhanh hơn"
                              style={{...input, resize: 'vertical'}}/>
                    <div style={{textAlign: 'right', fontSize: 12, color: '#6b7280'}}>{description.length}/{DESC_MAX}</div>

                    <div style={{fontSize: 13, fontWeight: 600, margin: '6px 0 4px'}}>
                        Ảnh bằng chứng <span style={{fontWeight: 400, color: '#6b7280'}}>(không bắt buộc, tối đa {MAX_IMAGES} ảnh, 5 MB/ảnh)</span>
                    </div>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                        {previews.map((src, i) => (
                            <div key={src} style={{position: 'relative'}}>
                                <img src={src} alt={`Ảnh đã chọn ${i + 1}`}
                                     style={{width: 64, height: 64, objectFit: 'cover', borderRadius: 8, display: 'block'}}/>
                                <button type="button" aria-label={`Bỏ ảnh ${i + 1}`} disabled={busy}
                                        onClick={() => setFiles((fs) => fs.filter((_, idx) => idx !== i))}
                                        style={{position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 0, background: '#374151', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer'}}>
                                    <X size={12} aria-hidden="true"/>
                                </button>
                            </div>
                        ))}
                        {files.length < MAX_IMAGES && (
                            <label style={{width: 64, height: 64, border: '1px dashed #9ca3af', borderRadius: 8, display: 'grid', placeItems: 'center', cursor: busy ? 'not-allowed' : 'pointer', color: '#6b7280', fontSize: 24}}>
                                +
                                <input type="file" accept={IMAGE_TYPES.join(',')} multiple hidden disabled={busy} onChange={pickFiles}/>
                            </label>
                        )}
                    </div>

                    {error && <div role="alert" style={{color: '#b42318', fontSize: 13, marginTop: 8}}>{error}</div>}

                    <div style={{display: 'flex', gap: 8, marginTop: 12}}>
                        <button type="button" onClick={reset} disabled={busy}
                                style={{flex: 1, border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '10px 12px', cursor: 'pointer'}}>
                            Huỷ
                        </button>
                        <button type="submit" disabled={busy}
                                style={{flex: 2, border: 0, borderRadius: 8, background: ACCENT, color: '#fff', padding: '10px 12px', fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.6 : 1}}>
                            {busy ? 'Đang gửi...' : 'Gửi khiếu nại'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

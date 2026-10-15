import {useCallback, useEffect, useState} from 'react';
import {Star} from 'lucide-react';
import {REVIEW_MAX_COMMENT, createReview, getReviewByRequest} from '../../api/reviewApi';
import {useAuth} from '../../auth/useAuth';
import {useUserTopics} from '../../hooks/useUserTopics';
import {toast} from 'react-toastify';
import {useConfirm} from '../ui/confirm/confirmContext';

const ACCENT = '#F5820D';
const LABELS = ['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Rất tốt'];

function Stars({value, size = 20, onPick, onHover}) {
    return (
        <div style={{display: 'flex', gap: 4}} onMouseLeave={() => onHover?.(0)}>
            {[1, 2, 3, 4, 5].map((n) => {
                const star = (
                    <Star size={size} aria-hidden="true" color={n <= value ? ACCENT : '#d1d5db'} fill={n <= value ? ACCENT : 'none'}/>
                );
                return onPick ? (
                    <button key={n} type="button" aria-label={`${n} sao`} onClick={() => onPick(n)} onMouseEnter={() => onHover?.(n)}
                            style={{border: 0, background: 'none', padding: 2, cursor: 'pointer'}}>
                        {star}
                    </button>
                ) : <span key={n}>{star}</span>;
            })}
        </div>
    );
}


export default function ReviewPanel({requestId, role}) {
    const userId = useAuth().user?.id;
    const confirm = useConfirm();
    const [loaded, setLoaded] = useState(false);
    const [review, setReview] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            setReview(await getReviewByRequest(requestId));
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

    useUserTopics(role === 'worker' ? userId : null, ['matching'], (msg) => {
        if (msg?.type === 'REVIEW_RECEIVED' && Number(msg.requestId) === Number(requestId)) load();
    });

    async function submit(e) {
        e.preventDefault();
        if (rating < 1 || busy) return;

        const ok = await confirm({
            title: 'Gửi đánh giá?',
            message: `Bạn đánh giá thợ ${rating}/5 sao${comment.trim() ? ' kèm nhận xét' : ''}.\nĐánh giá đã gửi sẽ không thể chỉnh sửa.`,
            confirmText: 'Gửi đánh giá',
            cancelText: 'Xem lại',
        });
        if (!ok) return;

        setBusy(true);
        setError('');
        try {
            setReview(await createReview(requestId, rating, comment));
            toast.success('Cảm ơn bạn đã đánh giá thợ!');
        } catch (err) {
            setError(err.message);
            load();
        } finally {
            setBusy(false);
        }
    }

    if (!loaded) return null;
    if (role === 'worker' && !review) return null;

    const box = {marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 14};

    if (loadError && !review) {
        return <div style={{...box, color: '#b42318', fontSize: 13}}>{loadError}</div>;
    }

    if (review) {
        return (
            <div style={box}>
                <div style={{fontWeight: 600, marginBottom: 8}}>
                    {role === 'customer' ? 'Đánh giá của bạn' : `Đánh giá của ${review.customerName}`}
                </div>
                <Stars value={review.rating}/>
                {review.comment && <p style={{margin: '8px 0 0', fontSize: 14, whiteSpace: 'pre-wrap'}}>{review.comment}</p>}
            </div>
        );
    }

    const shown = hover || rating;
    return (
        <form onSubmit={submit} style={box}>
            <div style={{fontWeight: 600, marginBottom: 4}}>Đánh giá thợ</div>
            <div style={{fontSize: 13, color: '#6b7280', marginBottom: 8}}>Bạn thấy dịch vụ lần này thế nào?</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <Stars value={shown} size={28} onPick={setRating} onHover={setHover}/>
                <span style={{fontSize: 13, color: ACCENT}}>{LABELS[shown]}</span>
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={REVIEW_MAX_COMMENT}
                      disabled={busy} placeholder="Nhận xét về thợ (thái độ, tay nghề, đúng giờ...) - không bắt buộc"
                      style={{width: '100%', marginTop: 10, border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box'}}/>
            {error && <div style={{color: '#b42318', fontSize: 13, marginTop: 6}}>{error}</div>}
            <button type="submit" disabled={busy || rating < 1}
                    style={{marginTop: 10, width: '100%', border: 0, borderRadius: 8, background: ACCENT, color: '#fff', padding: '10px 12px', fontWeight: 600, cursor: 'pointer', opacity: busy || rating < 1 ? 0.5 : 1}}>
                {busy ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
        </form>
    );
}

import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ArrowLeft, LogOut, Plus, User} from 'lucide-react';
import {useAuth} from '../../auth/useAuth';
import {useUserTopics} from '../../hooks/useUserTopics';
import {searchMyRepairRequests, fetchMySummary} from '../../api/repairRequestApi';
import {fetchMyWarrantyClaims} from '../../api/warrantyClaimApi';
import {
    STAGES, LABELS, BADGE_TONE, REQUEST_FILTERS, WARRANTY_LABELS, WARRANTY_TONE,
} from './requestStatus';
import {formatVnd, formatDateTime} from '../../utils/format';

const ACTIVE = REQUEST_FILTERS.find((f) => f.key === 'active').statuses;
const EMPTY_SUMMARY = {pendingQuotations: [], awaitingReview: []};

function Stages({status}) {
    const cur = STAGES.indexOf(status);
    return (
        <ol className="dash-stages">
            {STAGES.map((s, i) => (
                <li key={s} className={`${i <= cur ? 'on' : ''} ${i === cur ? 'cur' : ''}`.trim()}>
                    <span className="bar"/>
                    <em>{LABELS[s]}</em>
                </li>
            ))}
        </ol>
    );
}

export default function DashboardPage() {
    const {user, logout} = useAuth();
    const nav = useNavigate();

    const signOut = async () => {
        await logout();
        nav('/auth', {replace: true});
    };
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const timer = useRef(null);

    const load = useCallback(() => {
        return Promise.all([
            searchMyRepairRequests({statuses: ACTIVE, page: 0, size: 3}),
            searchMyRepairRequests({statuses: [], page: 0, size: 3}),
            // Các nguồn phụ: lỗi thì chỉ khối đó trống, không làm hỏng cả trang
            fetchMyWarrantyClaims().catch(() => []),
            fetchMySummary().catch(() => EMPTY_SUMMARY),
        ])
            .then(([active, recent, claims, summary]) => {
                setData({active: active.content, recent: recent.content, claims, summary});
                setError('');
            })
            .catch((e) => setError(e.message));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Có tin realtime thì tải lại sau 300ms (gộp nhiều tin dồn dập thành một lần tải)
    const onMessage = useCallback(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(load, 300);
    }, [load]);
    useEffect(() => () => clearTimeout(timer.current), []);
    useUserTopics(user?.id, ['requests'], onMessage);

    const current = data?.active?.[0] ?? null; // yêu cầu đang xử lý mới nhất

    const todo = data ? [
        ...data.summary.pendingQuotations.map((q) => ({
            key: `q${q.quotationId}`,
            requestId: q.requestId,
            title: 'Báo giá chờ duyệt',
            sub: `#${q.requestCode} · ${formatVnd(q.totalAmount)} · Thợ ${q.workerName}`,
        })),
        ...data.summary.awaitingReview.map((r) => ({
            key: `r${r.requestId}`,
            requestId: r.requestId,
            title: 'Đánh giá thợ',
            sub: `#${r.requestCode} · ${r.workerName ?? 'Thợ'} · Hoàn thành ${formatDateTime(r.completedAt, '')}`,
        })),
    ] : [];

    return (
        <div className="dash-page">
            <header className="topbar dash-topbar">
                <button type="button" className="icon-btn" onClick={() => nav('/')} aria-label="Về trang chủ">
                    <ArrowLeft size={22} aria-hidden="true"/>
                </button>
                <h1>Tổng quan</h1>
                <div className="dash-topbar-actions">
                    <button type="button" className="dash-tb-btn primary" onClick={() => nav('/create')}
                            aria-label="Tạo yêu cầu">
                        <Plus size={18} aria-hidden="true"/><span>Tạo yêu cầu</span>
                    </button>
                    <button type="button" className="dash-tb-btn" onClick={() => nav('/profile')}
                            aria-label="Hồ sơ">
                        <User size={18} aria-hidden="true"/><span>Hồ sơ</span>
                    </button>
                    <button type="button" className="dash-tb-btn danger" onClick={signOut}
                            aria-label="Đăng xuất">
                        <LogOut size={18} aria-hidden="true"/><span>Đăng xuất</span>
                    </button>
                </div>
            </header>

            <main className="dash">
            <h2 className="dash-hello">Xin chào, {user?.fullName ?? 'bạn'}</h2>

            {error && <p role="alert">Không tải được dữ liệu: {error}</p>}
            {!data && !error && <p>Đang tải…</p>}

            {data && (
                <>
                    <section className="dash-grid top">
                        <article className="dash-card">
                            {current ? (
                                <>
                                    <div className="dash-row">
                                        <div className="grow">
                                            <small>YÊU CẦU ĐANG XỬ LÝ</small>
                                            <h2>#{current.requestCode} · {current.categoryName}</h2>
                                        </div>
                                        <span className={`status-badge ${BADGE_TONE[current.status]}`}>
                                            {LABELS[current.status] ?? current.status}
                                        </span>
                                    </div>
                                    <Stages status={current.status}/>
                                    <div className="dash-row">
                                        <div className="grow">
                                            <b>{current.workerName ?? 'Đang tìm thợ…'}</b>
                                        </div>
                                        <div className="dash-actions">
                                            <button className="customer-action primary"
                                                    onClick={() => nav(`/request/${current.id}`)}>
                                                Theo dõi
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <small>YÊU CẦU ĐANG XỬ LÝ</small>
                                    <p>Bạn chưa có yêu cầu nào đang xử lý.</p>
                                    <div className="dash-actions">
                                        <button className="customer-action primary" onClick={() => nav('/create')}>
                                            Tạo yêu cầu sửa chữa
                                        </button>
                                    </div>
                                </>
                            )}
                        </article>

                        <article className="dash-card">
                            <small>CẦN BẠN XỬ LÝ</small>
                            {todo.length === 0 && <p>Hiện không có việc nào cần bạn xử lý.</p>}
                            {todo.map((t) => (
                                <Link key={t.key} to={`/request/${t.requestId}`} className="dash-todo">
                                    <b>{t.title}</b>
                                    <span className="muted">{t.sub}</span>
                                </Link>
                            ))}
                        </article>
                    </section>

                    <section className="dash-grid two">
                        <article className="dash-card">
                            <h2>Bảo hành</h2>
                            {data.claims.length === 0 && <p>Chưa có yêu cầu bảo hành nào.</p>}
                            {data.claims.slice(0, 3).map((c) => (
                                <div className="dash-row" key={c.id}>
                                    <div className="grow">
                                        <b>#{c.requestCode} · {c.categoryName}</b>
                                        <div className="muted">
                                            {c.status === 'REJECTED' && c.rejectReason
                                                ? `Lý do từ chối: ${c.rejectReason}`
                                                : c.scheduledAt
                                                    ? `Thợ hẹn ${formatDateTime(c.scheduledAt, '')}`
                                                    : `Gửi lúc ${formatDateTime(c.createdAt, '')}`}
                                        </div>
                                    </div>
                                    <span className={`status-badge ${WARRANTY_TONE[c.status]}`}>
                                        {WARRANTY_LABELS[c.status] ?? c.status}
                                    </span>
                                </div>
                            ))}
                        </article>

                        <article className="dash-card">
                            <div className="dash-row">
                                <h2 className="grow">Yêu cầu gần đây</h2>
                                <Link to="/requests">Xem tất cả</Link>
                            </div>
                            {data.recent.length === 0 && <p>Chưa có yêu cầu nào.</p>}
                            {data.recent.map((r) => (
                                <div className="dash-row" key={r.id}>
                                    <div className="grow">
                                        <b>#{r.requestCode} · {r.categoryName}</b>
                                        <div className="muted">{formatDateTime(r.createdAt, '')}</div>
                                    </div>
                                    <span className={`status-badge ${BADGE_TONE[r.status]}`}>
                                        {LABELS[r.status] ?? r.status}
                                    </span>
                                </div>
                            ))}
                        </article>
                    </section>
                </>
            )}
            </main>
        </div>
    );
}
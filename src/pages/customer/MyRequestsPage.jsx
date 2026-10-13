import {ArrowLeft, ClipboardList} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {searchMyRepairRequests} from '../../api/repairRequestApi';
import {useAuth} from '../../auth/useAuth';
import {useUserTopics} from '../../hooks/useUserTopics';
import {BADGE_TONE, LABELS, REQUEST_FILTERS} from './requestStatus';
import {formatDateTime} from '../../utils/format';

const FALLBACK_POLL_MS = 15000;
const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

function RequestCard({r, onOpen}) {
    return (
        <div
            className="address-card"
            role="button"
            tabIndex={0}
            style={{cursor: 'pointer'}}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen();
                }
            }}
        >
            <span className="address-icon"><ClipboardList size={20}/></span>
            <div className="address-main">
                <b>{r.requestCode} | {r.categoryName}</b>
                <span>{r.addressText}</span>
                <span className="muted">
                    {formatDateTime(r.createdAt, '')}
                    {r.workerName && r.status !== 'CANCELLED' && r.status !== 'NOT_FOUND'
                        ? ` | Thợ: ${r.workerName}` : ''}
                </span>
            </div>
            <span className={`status-badge ${BADGE_TONE[r.status]}`}>{LABELS[r.status] ?? r.status}</span>
        </div>
    );
}

export default function MyRequestsPage() {
    const nav = useNavigate();
    const [filterKey, setFilterKey] = useState('all');
    const [keywordInput, setKeywordInput] = useState('');
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(0);

    const [data, setData] = useState(null);
    // Trang (bộ lọc|từ khoá|trang) mà dữ liệu hiện có đã tải xong; khác với truy vấn hiện tại = đang tải.
    const [loadedKey, setLoadedKey] = useState(null);
    const [error, setError] = useState('');

    const refreshTimer = useRef(null);
    const requestSeq = useRef(0);
    const userId = useAuth().user?.id;


    useEffect(() => {
        const id = setTimeout(() => {
            setKeyword(keywordInput.trim());
            setPage(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(id);
    }, [keywordInput]);

    const queryKey = `${filterKey}|${keyword}|${page}`;
    const loading = loadedKey !== queryKey;

    // Dùng chuỗi .then (không async/await) để mọi setState nằm trong callback bất đồng bộ —
    // gọi load() trong effect không vi phạm rule react-hooks/set-state-in-effect.
    const load = useCallback((showError = true) => {
        const seq = ++requestSeq.current;
        const key = `${filterKey}|${keyword}|${page}`;
        const statuses = REQUEST_FILTERS.find((f) => f.key === filterKey)?.statuses ?? [];
        return searchMyRepairRequests({statuses, keyword, page, size: PAGE_SIZE})
            .then((res) => {
                if (seq !== requestSeq.current) return;
                if (res.content.length === 0 && page > 0 && res.totalPages > 0) {
                    setPage(res.totalPages - 1);
                    return;
                }
                setData(res);
                setError('');
            })
            .catch((e) => {
                if (seq === requestSeq.current && showError) setError(e.message);
            })
            .finally(() => {
                if (seq === requestSeq.current) setLoadedKey(key);
            });
    }, [filterKey, keyword, page]);

    useEffect(() => {
        load();
    }, [load]);


    const handleMessage = useCallback(() => {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => load(false), 300);
    }, [load]);
    useEffect(() => () => clearTimeout(refreshTimer.current), []);
    const wsConnected = useUserTopics(userId, ['requests'], handleMessage);

    useEffect(() => {
        if (wsConnected) load(false);
    }, [wsConnected, load]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') load(false);
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [load]);


    useEffect(() => {
        if (wsConnected) return undefined;
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') load(false);
        }, FALLBACK_POLL_MS);
        return () => clearInterval(id);
    }, [wsConnected, load]);

    const chooseFilter = (key) => {
        setFilterKey(key);
        setPage(0);
    };

    const clearFilters = () => {
        setFilterKey('all');
        setKeywordInput('');
        setKeyword('');
        setPage(0);
    };

    const list = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const isFiltering = filterKey !== 'all' || keyword !== '';

    return (
        <div className="page">
            <main className="shell">
                <header className="topbar">
                    <button type="button" className="icon-btn" onClick={() => nav('/')} aria-label="Về trang chủ">
                        <ArrowLeft size={22} aria-hidden="true"/>
                    </button>
                    <h1>Yêu cầu của tôi</h1>
                </header>

                <div className="body profile-body">
                    <input
                        type="search"
                        className="input rq-search"
                        placeholder="Tìm theo mã đơn"
                        aria-label="Tìm theo mã đơn"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                    />

                    <div className="rq-filters" role="group" aria-label="Lọc theo trạng thái">
                        {REQUEST_FILTERS.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                className="rq-filter"
                                aria-pressed={filterKey === f.key}
                                onClick={() => chooseFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {error && !data && (
                        <div className="notice">
                            <p>{error}</p>
                            <button type="button" className="btn secondary small" onClick={() => { setLoadedKey(null); load(); }}>Thử lại</button>
                        </div>
                    )}

                    {!data && !error && <p className="muted">Đang tải...</p>}

                    {data && list.length === 0 && (
                        <div className="notice">
                            {isFiltering ? (
                                <>
                                    <p>Không tìm thấy yêu cầu nào phù hợp.</p>
                                    <button type="button" className="btn secondary small" onClick={clearFilters}>Xoá bộ lọc</button>
                                </>
                            ) : (
                                <p>Bạn chưa có yêu cầu sửa chữa nào.</p>
                            )}
                        </div>
                    )}

                    {list.length > 0 && (
                        <>
                            <div className="section-title">
                                <b>{isFiltering ? 'Kết quả' : 'Tất cả yêu cầu'}</b>
                                <span>{data.totalElements} yêu cầu</span>
                            </div>
                            <div className={`address-list rq-list ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
                                {list.map((r) => <RequestCard key={r.id} r={r} onOpen={() => nav(`/request/${r.id}`)}/>)}
                            </div>
                        </>
                    )}

                    {totalPages > 1 && (
                        <nav className="rq-pager" aria-label="Phân trang">
                            <button type="button" className="btn secondary small" disabled={page <= 0} onClick={() => setPage(page - 1)}>
                                Trước
                            </button>
                            <span className="muted">Trang {page + 1} / {totalPages}</span>
                            <button type="button" className="btn secondary small" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
                                Sau
                            </button>
                        </nav>
                    )}
                </div>

                <div className="footer">
                    <button type="button" className="btn primary" onClick={() => nav('/create')}>Tạo yêu cầu mới</button>
                </div>
            </main>
        </div>
    );
}

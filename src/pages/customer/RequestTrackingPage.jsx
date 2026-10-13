import {ArrowLeft, RefreshCw} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {cancelRepairRequest, getRepairRequestById, getWorkerLocation} from '../../api/repairRequestApi';
import WorkerTrackingMap from '../../components/customer/WorkerTrackingMap';
import ChatBox from '../../components/chat/ChatBox';
import QuotationPanel from '../../components/chat/QuotationPanel';
import ReviewPanel from '../../components/chat/ReviewPanel';
import ComplaintPanel from '../../components/chat/ComplaintPanel';
import {useAuth} from '../../auth/useAuth';
import {useConfirm} from '../../components/ui/confirm/confirmContext';
import {useUserTopics} from '../../hooks/useUserTopics';
import {
    BADGE_TONE,
    CANCELLABLE,
    COMPLAINABLE,
    LABELS,
    PRIORITY_LABELS,
    STAGES,
    TERMINAL,
} from './requestStatus';
import {formatDateTime} from '../../utils/format';


const FALLBACK_POLL_MS = 8000;

export default function RequestTrackingPage({requestId, onBack, onCreateAnother, onViewAll}) {
    const [request, setRequest] = useState(null);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [actionError, setActionError] = useState('');
    const [workerLoc, setWorkerLoc] = useState(null);
    const refreshTimer = useRef(null);
    const userId = useAuth().user?.id;
    const confirm = useConfirm();

    // Dùng chuỗi .then (không async/await) để setState chỉ nằm trong callback bất đồng bộ —
    // gọi load() trong effect không vi phạm rule react-hooks/set-state-in-effect.
    const load = useCallback((showError = true) => {
        return getRepairRequestById(requestId)
            .then((data) => {
                setRequest(data);
                setError('');
            })
            .catch((e) => {
                if (showError) setError(e.message);
            });
    }, [requestId]);


    useEffect(() => {
        load();
    }, [load]);

    const live = !!request && !TERMINAL.includes(request.status);
    const tracking = request?.status === 'ON_THE_WAY' && request.lat != null && request.lng != null;


    const loadWorkerLocation = useCallback(() => {
        // bỏ qua lỗi: sẽ nhận vị trí qua WebSocket hoặc lần thử sau
        return getWorkerLocation(requestId).then(setWorkerLoc).catch(() => {});
    }, [requestId]);
    useEffect(() => {
        if (tracking) loadWorkerLocation();
    }, [tracking, loadWorkerLocation]);
    // Chỉ hiển thị vị trí thợ khi đang theo dõi (thay cho việc setWorkerLoc(null) trong effect)
    const shownWorkerLoc = tracking ? workerLoc : null;


    const handleMessage = useCallback((msg) => {
        if (msg?.requestId && Number(msg.requestId) !== Number(requestId)) return;
        if (msg?.type === 'WORKER_LOCATION') {
            setWorkerLoc({lat: msg.lat, lng: msg.lng, updatedAt: msg.timestamp});
            return;
        }
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => load(false), 300);
    }, [requestId, load]);
    useEffect(() => () => clearTimeout(refreshTimer.current), []);


    const wsConnected = useUserTopics(live ? userId : null, ['requests', 'tracking'], handleMessage);


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
        if (!live || wsConnected) return undefined;
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') {
                load(false);
                if (tracking) loadWorkerLocation();
            }
        }, FALLBACK_POLL_MS);
        return () => clearInterval(id);
    }, [live, wsConnected, load, tracking, loadWorkerLocation]);

    async function cancel() {
        if (!(await confirm({title: 'Huỷ yêu cầu?', message: 'Bạn chắc chắn muốn huỷ yêu cầu này?', confirmText: 'Huỷ yêu cầu', cancelText: 'Giữ lại', danger: true}))) return;
        setCancelling(true);
        setActionError('');
        try {
            setRequest(await cancelRepairRequest(requestId));
        } catch (e) {
            setActionError(e.message);
            load(false);
        } finally {
            setCancelling(false);
        }
    }

    if (error && !request) {
        return (
            <div className="page">
                <main className="shell">
                    <div className="body">
                        <div className="notice">
                            <p>{error}</p>
                            <button type="button" className="btn secondary small" onClick={() => load()}>
                                Thử lại
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="page">
                <main className="shell">
                    <p className="muted" style={{margin: 'auto'}}>Đang tải...</p>
                </main>
            </div>
        );
    }


    const stageKey = request.status === 'MATCHING' ? 'PENDING_MATCH' : request.status;
    const stageIndex = STAGES.indexOf(stageKey);
    const isTerminalBad = request.status === 'NOT_FOUND' || request.status === 'CANCELLED';
    const showWorker = !!request.workerName && request.status !== 'CANCELLED' && request.status !== 'NOT_FOUND';
    const canCancel = CANCELLABLE.includes(request.status);

    return (
        <div className="page">
            <main className="shell">
                <header className="topbar">
                    {onBack ? (
                        <button type="button" className="icon-btn" onClick={onBack} aria-label="Quay lại">
                            <ArrowLeft size={22} aria-hidden="true"/>
                        </button>
                    ) : <span className="icon-spacer"/>}
                    <h1>Yêu cầu {request.requestCode}</h1>
                </header>

                <div className="body">
                    <span className={`status-badge ${BADGE_TONE[request.status]}`}>{LABELS[request.status] ?? request.status}</span>
                    <h2 style={{margin: '10px 0 2px'}}>{request.categoryName}</h2>
                    <p className="muted" style={{margin: 0}}>{request.addressText}</p>

                    {showWorker && (
                        <p style={{margin: '12px 0 0'}}>Thợ phụ trách: <b>{request.workerName}</b></p>
                    )}

                    {request.status === 'COMPLETED' && request.workerId != null && (
                        <ReviewPanel requestId={requestId} role="customer"/>
                    )}

                    {showWorker && request.workerId != null && COMPLAINABLE.includes(request.status) && (
                        <ComplaintPanel requestId={requestId} role="customer"/>
                    )}

                    {showWorker && request.workerId != null && (
                        <QuotationPanel requestId={requestId} role="customer" active={!TERMINAL.includes(request.status)}/>
                    )}

                    {showWorker && request.workerId != null && (
                        <ChatBox requestId={requestId}/>
                    )}

                    {isTerminalBad ? (
                        <div className="notice">
                            <p>
                                {request.status === 'NOT_FOUND'
                                    ? 'Hiện chưa có thợ nào sẵn sàng gần bạn. Bạn có thể thử tạo lại yêu cầu sau ít phút.'
                                    : 'Yêu cầu này đã được huỷ.'}
                            </p>
                        </div>
                    ) : (
                        <ol className="timeline" aria-label="Tiến trình yêu cầu">
                            {STAGES.map((s, i) => (
                                <li key={s} className={i < stageIndex ? 'done' : i === stageIndex ? 'current' : ''}>
                                    {LABELS[s]}
                                </li>
                            ))}
                        </ol>
                    )}

                    {tracking && (
                        <>
                            <p className="section-title" style={{marginTop: 20}}><span>Vị trí thợ</span></p>
                            <WorkerTrackingMap customer={{lat: Number(request.lat), lng: Number(request.lng)}} worker={shownWorkerLoc}/>
                            <p className="muted" style={{margin: '6px 0'}}>
                                {shownWorkerLoc
                                    ? `Cập nhật lúc ${new Date(shownWorkerLoc.updatedAt).toLocaleTimeString('vi-VN')}`
                                    : 'Đang chờ vị trí của thợ...'}
                            </p>
                        </>
                    )}

                    <p className="section-title" style={{marginTop: 20}}><span>Thông tin yêu cầu</span></p>
                    <p style={{margin: '6px 0', whiteSpace: 'pre-wrap'}}>{request.description}</p>
                    <p className="muted" style={{margin: '6px 0'}}>
                        Mức độ ưu tiên: {PRIORITY_LABELS[request.priorityLevel] ?? request.priorityLevel}
                        {request.createdAt ? ` | Gửi lúc ${formatDateTime(request.createdAt, '')}` : ''}
                    </p>

                    {request.attachmentUrls?.length > 0 && (
                        <>
                            <p className="section-title" style={{marginTop: 20}}><span>Hình ảnh đã gửi</span></p>
                            <div className="media-grid">
                                {request.attachmentUrls.map((url) => (
                                    <div className="thumb" key={url}>
                                        <img src={url} alt="Ảnh sự cố đã gửi"/>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {actionError && <div className="error" style={{marginTop: 16}}>{actionError}</div>}

                    {!TERMINAL.includes(request.status) && (
                        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20}}>
                            <button type="button" className="btn secondary small" onClick={() => load()}>
                                <RefreshCw size={16} aria-hidden="true" style={{marginRight: 6}}/>
                                Cập nhật ngay
                            </button>
                            {canCancel && (
                                <button type="button" className="btn danger small" onClick={cancel} disabled={cancelling}>
                                    {cancelling ? 'Đang huỷ...' : 'Huỷ yêu cầu'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="footer">
                    {onViewAll && (
                        <button type="button" className="btn secondary" style={{marginBottom: 10}} onClick={onViewAll}>
                            Yêu cầu của tôi
                        </button>
                    )}
                    <button type="button" className="btn primary" onClick={onCreateAnother}>Tạo yêu cầu khác</button>
                </div>
            </main>
        </div>
    );
}

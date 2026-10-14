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

// Chỉ dùng khi WebSocket không kết nối được (mạng yếu, server restart...)
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

    const load = useCallback(async (showError = true) => {
        try {
            const data = await getRepairRequestById(requestId);
            setRequest(data);
            setError('');
        } catch (e) {
            if (showError) setError(e.message);
        }
    }, [requestId]);

    // tải lần đầu
    useEffect(() => {
        load();
    }, [load]);

    const live = !!request && !TERMINAL.includes(request.status);
    const tracking = request?.status === 'ON_THE_WAY' && request.lat != null && request.lng != null;

    // Thợ đang di chuyển: lấy vị trí gần nhất ngay (khách mở/tải lại trang giữa chừng vẫn thấy thợ)
    const loadWorkerLocation = useCallback(async () => {
        try {
            setWorkerLoc(await getWorkerLocation(requestId));
        } catch {
            /* bỏ qua: sẽ nhận vị trí qua WebSocket hoặc lần thử sau */
        }
    }, [requestId]);
    useEffect(() => {
        if (tracking) loadWorkerLocation();
        else setWorkerLoc(null);
    }, [tracking, loadWorkerLocation]);

    // ---- Realtime: BE đẩy sự kiện về /topic/user/{id}/requests, FE chỉ cần tải lại yêu cầu ----
    const handleMessage = useCallback((msg) => {
        if (msg?.requestId && Number(msg.requestId) !== Number(requestId)) return; // sự kiện của yêu cầu khác
        if (msg?.type === 'WORKER_LOCATION') { // vị trí thợ: chỉ cập nhật bản đồ, không cần tải lại yêu cầu
            setWorkerLoc({lat: msg.lat, lng: msg.lng, updatedAt: msg.timestamp});
            return;
        }
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => load(false), 300); // gộp các sự kiện đến liên tiếp
    }, [requestId, load]);
    useEffect(() => () => clearTimeout(refreshTimer.current), []);

    // yêu cầu đã kết thúc thì ngắt kết nối (truyền null)
    const wsConnected = useUserTopics(live ? userId : null, ['requests', 'tracking'], handleMessage);

    // mỗi lần (kết nối lại) thành công: tải lại để bù các sự kiện bị lỡ lúc mất mạng
    useEffect(() => {
        if (wsConnected) load(false);
    }, [wsConnected, load]);

    // quay lại tab thì tải lại
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') load(false);
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [load]);

    // dự phòng: chỉ polling khi WebSocket đang không kết nối
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
            load(false); // trạng thái có thể đã đổi (vd: thợ vừa bắt đầu sửa) -> cập nhật lại màn hình
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

    // "Đang ghép thợ" nằm cùng chặng với "Chờ ghép thợ" trên timeline
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
                            <WorkerTrackingMap customer={{lat: Number(request.lat), lng: Number(request.lng)}} worker={workerLoc}/>
                            <p className="muted" style={{margin: '6px 0'}}>
                                {workerLoc
                                    ? `Cập nhật lúc ${new Date(workerLoc.updatedAt).toLocaleTimeString('vi-VN')}`
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

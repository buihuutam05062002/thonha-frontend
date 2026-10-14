import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ImagePlus, MessageCircle, Send, X} from 'lucide-react';
import {
    CHAT_MAX_IMAGES,
    CHAT_MAX_IMAGE_BYTES,
    CHAT_PAGE_SIZE,
    getChatByRequest,
    getChatMessages,
    markChatSeen,
    sendChatMessage,
} from '../../api/chatApi';
import {useAuth} from '../../auth/useAuth';
import {useUserTopics} from '../../hooks/useUserTopics';

const ACCENT = '#F5820D';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const time = d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
    return d.toDateString() === new Date().toDateString() ? time : `${d.toLocaleDateString('vi-VN')} ${time}`;
};

function mergeById(list, incoming) {
    const map = new Map(list.map((m) => [m.id, m]));
    incoming.forEach((m) => map.set(m.id, m));
    return [...map.values()].sort((a, b) => a.id - b.id);
}

/**
 * Khung chat giữa khách và thợ cho một yêu cầu. Dùng cho cả hai phía.
 * Chỉ nên render khi yêu cầu đã có thợ nhận (BE trả lỗi nếu chưa có).
 */
export default function ChatBox({requestId}) {
    const userId = useAuth().user?.id;
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState('');
    const listRef = useRef(null);
    const fileRef = useRef(null);
    const stickBottom = useRef(true);
    const openRef = useRef(open);
    const chatIdRef = useRef(null);

    useEffect(() => {
        openRef.current = open;
    });

    const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
    useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

    const loadLatest = useCallback(async (chatId) => {
        const page = await getChatMessages(chatId);
        setMessages((prev) => mergeById(prev, page));
        setHasMore(page.length >= CHAT_PAGE_SIZE);
    }, []);

    const init = useCallback(async () => {
        try {
            const c = await getChatByRequest(requestId);
            chatIdRef.current = c.id;
            setChat(c);
            setUnread(c.unreadCount ?? 0);
            setLoadError('');
            await loadLatest(c.id);
        } catch (e) {
            setLoadError(e.message);
        }
    }, [requestId, loadLatest]);

    useEffect(() => {
        init();
    }, [init]);

    const seen = useCallback((chatId) => {
        markChatSeen(chatId).catch(() => {});
        setUnread(0);
    }, []);

    const handleEvent = useCallback((evt) => {
        if (!evt || evt.chatId !== chatIdRef.current) return;
        if (evt.type === 'NEW_MESSAGE' && evt.message) {
            setMessages((prev) => mergeById(prev, [evt.message]));
            if (openRef.current && document.visibilityState === 'visible') seen(evt.chatId);
            else setUnread((n) => n + 1);
        } else if (evt.type === 'MESSAGES_SEEN') {
            setMessages((prev) => prev.map((m) => (m.senderId === userId ? {...m, seen: true} : m)));
        }
    }, [userId, seen]);

    const wsConnected = useUserTopics(userId, ['chat'], handleEvent);
    // kết nối lại thành công: bù các tin bị lỡ lúc mất mạng
    useEffect(() => {
        if (wsConnected && chatIdRef.current) loadLatest(chatIdRef.current).catch(() => {});
    }, [wsConnected, loadLatest]);

    useEffect(() => {
        if (open && chat) seen(chat.id);
    }, [open, chat, seen]);

    // tự cuộn xuống cuối khi có tin mới (trừ lúc người dùng đang đọc tin cũ)
    useEffect(() => {
        const el = listRef.current;
        if (open && el && stickBottom.current) el.scrollTop = el.scrollHeight;
    }, [messages, open]);

    const onScroll = () => {
        const el = listRef.current;
        if (el) stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };

    async function loadOlder() {
        if (!chat || messages.length === 0) return;
        const el = listRef.current;
        const prevHeight = el?.scrollHeight ?? 0;
        try {
            const page = await getChatMessages(chat.id, messages[0].id);
            stickBottom.current = false;
            setMessages((prev) => mergeById(prev, page));
            setHasMore(page.length >= CHAT_PAGE_SIZE);
            requestAnimationFrame(() => {
                if (el) el.scrollTop = el.scrollHeight - prevHeight;
            });
        } catch (e) {
            setError(e.message);
        }
    }

    function pickFiles(e) {
        const picked = [...(e.target.files ?? [])];
        e.target.value = '';
        setError('');
        const next = [...files];
        for (const f of picked) {
            if (!ALLOWED_TYPES.includes(f.type)) {
                setError('Chỉ gửi được ảnh JPG, PNG hoặc WEBP');
                continue;
            }
            if (f.size > CHAT_MAX_IMAGE_BYTES) {
                setError('Mỗi ảnh tối đa 5 MB');
                continue;
            }
            if (next.length >= CHAT_MAX_IMAGES) {
                setError(`Tối đa ${CHAT_MAX_IMAGES} ảnh mỗi tin nhắn`);
                break;
            }
            next.push(f);
        }
        setFiles(next);
    }

    async function send(e) {
        e?.preventDefault();
        const content = text.trim();
        if (!chat || sending || (!content && files.length === 0)) return;
        setSending(true);
        setError('');
        try {
            const msg = await sendChatMessage(chat.id, content, files);
            stickBottom.current = true;
            setMessages((prev) => mergeById(prev, [msg]));
            setText('');
            setFiles([]);
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) send(e);
    };

    if (loadError) {
        return (
            <div style={{marginTop: 16, fontSize: 13, color: '#b42318'}}>
                Không mở được chat: {loadError}{' '}
                <button type="button" onClick={init} style={{border: 0, background: 'none', color: ACCENT, cursor: 'pointer'}}>
                    Thử lại
                </button>
            </div>
        );
    }
    if (!chat) return null;

    return (
        <div style={{marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', overflow: 'hidden'}}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
                    border: 0, background: '#fff7ed', cursor: 'pointer', textAlign: 'left', fontWeight: 600,
                }}
            >
                <MessageCircle size={18} color={ACCENT} aria-hidden="true"/>
                <span style={{flex: 1}}>Nhắn tin với {chat.otherUserName}</span>
                {unread > 0 && (
                    <span style={{
                        background: '#dc2626', color: '#fff', borderRadius: 999, fontSize: 12,
                        minWidth: 20, height: 20, lineHeight: '20px', textAlign: 'center', padding: '0 6px',
                    }}>{unread}</span>
                )}
                <span style={{fontSize: 12, color: '#6b7280'}}>{open ? 'Thu gọn' : 'Mở'}</span>
            </button>

            {open && (
                <div>
                    <div ref={listRef} onScroll={onScroll}
                         style={{height: 320, overflowY: 'auto', padding: 12, background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 8}}>
                        {hasMore && (
                            <button type="button" onClick={loadOlder}
                                    style={{alignSelf: 'center', border: 0, background: 'none', color: ACCENT, fontSize: 12, cursor: 'pointer'}}>
                                Xem tin cũ hơn
                            </button>
                        )}
                        {messages.length === 0 && (
                            <p style={{margin: 'auto', color: '#9ca3af', fontSize: 13}}>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.</p>
                        )}
                        {messages.map((m, i) => {
                            const mine = m.senderId === userId;
                            const lastMine = mine && !messages.slice(i + 1).some((x) => x.senderId === userId);
                            return (
                                <div key={m.id} style={{alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%'}}>
                                    <div style={{
                                        background: mine ? ACCENT : '#fff', color: mine ? '#fff' : '#111827',
                                        border: mine ? 0 : '1px solid #e5e7eb', borderRadius: 12, padding: '8px 12px',
                                        whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14,
                                    }}>
                                        {m.images?.length > 0 && (
                                            <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: m.content ? 6 : 0}}>
                                                {m.images.map((url) => (
                                                    <a key={url} href={url} target="_blank" rel="noreferrer">
                                                        <img src={url} alt="Ảnh trong tin nhắn"
                                                             style={{width: 120, height: 120, objectFit: 'cover', borderRadius: 8, display: 'block'}}/>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {m.content}
                                    </div>
                                    <div style={{fontSize: 11, color: '#9ca3af', marginTop: 2, textAlign: mine ? 'right' : 'left'}}>
                                        {fmtTime(m.sentAt)}{lastMine && m.seen ? ' | Đã xem' : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {chat.canSend ? (
                        <form onSubmit={send} style={{borderTop: '1px solid #e5e7eb', padding: 10}}>
                            {previews.length > 0 && (
                                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8}}>
                                    {previews.map((url, i) => (
                                        <div key={url} style={{position: 'relative'}}>
                                            <img src={url} alt="Ảnh đã chọn" style={{width: 56, height: 56, objectFit: 'cover', borderRadius: 8}}/>
                                            <button type="button" aria-label="Bỏ ảnh"
                                                    onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                                                    style={{position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, border: 0, background: '#111827', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                <X size={12} aria-hidden="true"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {error && <div style={{color: '#b42318', fontSize: 12, marginBottom: 6}}>{error}</div>}
                            <div style={{display: 'flex', gap: 8, alignItems: 'flex-end'}}>
                                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={pickFiles}/>
                                <button type="button" aria-label="Đính kèm ảnh" onClick={() => fileRef.current?.click()} disabled={sending}
                                        style={{border: 0, background: 'none', cursor: 'pointer', padding: 8, color: '#6b7280'}}>
                                    <ImagePlus size={20} aria-hidden="true"/>
                                </button>
                                <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown}
                                          rows={1} maxLength={2000} placeholder="Nhập tin nhắn..." disabled={sending}
                                          style={{flex: 1, resize: 'none', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 14, maxHeight: 96}}/>
                                <button type="submit" aria-label="Gửi" disabled={sending || (!text.trim() && files.length === 0)}
                                        style={{border: 0, borderRadius: 8, background: ACCENT, color: '#fff', padding: '9px 12px', cursor: 'pointer', opacity: sending || (!text.trim() && files.length === 0) ? 0.5 : 1}}>
                                    <Send size={18} aria-hidden="true"/>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p style={{margin: 0, padding: 10, borderTop: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', textAlign: 'center'}}>
                            Yêu cầu đã kết thúc, không thể gửi thêm tin nhắn.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

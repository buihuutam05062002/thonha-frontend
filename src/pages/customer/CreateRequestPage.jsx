import {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    ArrowLeft, Camera, Check, Droplet, Loader2, LocateFixed, Refrigerator, Sparkles, WashingMachine, Wind, Wrench, X, Zap,
} from 'lucide-react';
import {createRepairRequest} from '../../api/repairRequestApi';
import {classifyIncident} from '../../api/aiApi';
import {stepperTrackStyle, stepperFillStyle} from '../../utils/stepper';
import {autocompleteAddress, getCurrentPosition, getPlaceDetail, reverseGeocode} from '../../api/mapApi';
import {getCategories} from '../../api/categoryApi';
import {getAddresses} from '../../api/addressApi';
import RequestTrackingPage from './RequestTrackingPage.jsx';
import logoImg from '../../assets/logo.png';

const ICONS = {
    zap: Zap,
    droplet: Droplet,
    wind: Wind,
    refrigerator: Refrigerator,
    'washing-machine': WashingMachine,
    wrench: Wrench,
};

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 30;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const TOTAL_STEPS = 4;
const STEP_LABELS = ['Dịch vụ', 'Sự cố', 'Địa chỉ', 'Xác nhận'];

const EMPTY_FORM = {
    categoryId: null,
    description: '',
    mucDoUuTien: 'MEDIUM',
    addressId: null,
    addressSnapshot: '',
    lat: null,
    lng: null,
};

export default function CreateRequestPage() {
    const nav = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(EMPTY_FORM);
    const [categories, setCategories] = useState([]);
    const [catState, setCatState] = useState('loading');
    const [media, setMedia] = useState([]);
    const [mediaError, setMediaError] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const [aiResult, setAiResult] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);
    const [addresses, setAddresses] = useState([]);
    const [addressLoading, setAddressLoading] = useState(true);
    const [showOtherAddresses, setShowOtherAddresses] = useState(false);
    const selectedAddress =
        addresses.find((address) => address.id === form.addressId) ||
        addresses.find((address) => address.defaultAddress);

    // Cập nhật ref trong effect (không ghi ref lúc render — rule react-hooks/refs).
    const mediaRef = useRef(media);
    useEffect(() => {
        mediaRef.current = media;
    }, [media]);
    const idRef = useRef(0);

    // catState khởi tạo sẵn là 'loading' nên lần tải đầu không cần setState đồng bộ trong effect.
    const loadCategories = useCallback(() => {
        getCategories()
            .then((list) => {
                setCategories(list);
                setCatState('ready');
            })
            .catch(() => setCatState('error'));
    }, []);

    // Nút "Thử lại": hiện lại "Đang tải..." trong event handler rồi gọi lại.
    const retryCategories = () => {
        setCatState('loading');
        loadCategories();
    };

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    useEffect(() => {
        let mounted = true;

        getAddresses()
            .then((list) => {
                if (!mounted) return;

                setAddresses(list);

                const defaultAddress = list.find((address) => address.defaultAddress);

                if (defaultAddress) {
                    setForm((f) => ({
                        ...f,
                        addressId: defaultAddress.id,
                        addressSnapshot: defaultAddress.fullAddress,
                        lat: defaultAddress.lat,
                        lng: defaultAddress.lng,
                    }));
                }
            })
            .catch(() => {
                if (mounted) {
                    setError('Không tải được địa chỉ đã lưu');
                }
            })
            .finally(() => {
                if (mounted) {
                    setAddressLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => () => mediaRef.current.forEach((m) => URL.revokeObjectURL(m.url)), []);


    const setField = (name, value) => {
        setForm((f) => ({...f, [name]: value}));
        setError('');
    };

    function addFiles(fileList) {
        let images = media.filter((m) => !m.isVideo).length;
        let videos = media.filter((m) => m.isVideo).length;
        const accepted = [];
        const errs = new Set();
        for (const f of Array.from(fileList)) {
            if (!ALLOWED_TYPES.includes(f.type)) {
                errs.add('Chỉ nhận ảnh JPG, PNG, WEBP hoặc video MP4');
                continue;
            }
            const isVideo = f.type === 'video/mp4';
            if (isVideo) {
                if (videos >= MAX_VIDEOS) {
                    errs.add(`Chỉ được đính kèm tối đa ${MAX_VIDEOS} video`);
                    continue;
                }
                if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
                    errs.add(`Video tối đa ${MAX_VIDEO_MB} MB`);
                    continue;
                }
                videos += 1;
            } else {
                if (images >= MAX_IMAGES) {
                    errs.add(`Chỉ được đính kèm tối đa ${MAX_IMAGES} ảnh`);
                    continue;
                }
                if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
                    errs.add(`Mỗi ảnh tối đa ${MAX_IMAGE_MB} MB`);
                    continue;
                }
                images += 1;
            }
            idRef.current += 1;
            accepted.push({id: idRef.current, file: f, isVideo, url: URL.createObjectURL(f)});
        }
        setMedia((m) => [...m, ...accepted]);
        setMediaError([...errs].join('. '));
    }

    function removeMedia(id) {
        setMedia((list) => {
            const target = list.find((m) => m.id === id);
            if (target) URL.revokeObjectURL(target.url);
            return list.filter((m) => m.id !== id);
        });
        setMediaError('');
    }


    async function analyzeWithAi() {
        const images = media.filter((m) => !m.isVideo).map((m) => m.file);
        if (form.description.trim().length < 5 && images.length === 0) {
            setAiError('Hãy mô tả sự cố hoặc thêm ảnh để AI phân tích');
            return;
        }
        setAiLoading(true);
        setAiError('');
        setAiResult(null);
        try {
            setAiResult(await classifyIncident(form.description.trim(), images));
        } catch (e) {
            setAiError(e.message);
        } finally {
            setAiLoading(false);
        }
    }

    function applyAiCategory() {
        if (aiResult?.categoryId) setField('categoryId', aiResult.categoryId);
    }

    function applyAiSummary() {
        if (aiResult?.summary) setField('description', aiResult.summary.slice(0, 2000));
    }

    function validate(n) {
        if (n === 1 && !form.categoryId) return 'Vui lòng chọn danh mục dịch vụ';
        if (n === 2 && form.description.trim().length < 10) return 'Mô tả cần ít nhất 10 ký tự để thợ hiểu sự cố';
        if (n === 3 && !form.addressSnapshot.trim()) return 'Vui lòng nhập địa chỉ cần sửa';
        return '';
    }

    function next() {
        const e = validate(step);
        if (e) {
            setError(e);
            return;
        }
        setError('');
        setStep((s) => s + 1);
    }

    function back() {
        setError('');
        setStep((s) => Math.max(1, s - 1));
    }

    async function submit() {
        for (let n = 1; n <= 3; n += 1) {
            const e = validate(n);
            if (e) {
                setStep(n);
                setError(e);
                return;
            }
        }
        setSubmitting(true);
        setError('');
        try {

            const data = {
                categoryId: form.categoryId,
                description: form.description.trim(),
                priorityLevel: form.mucDoUuTien,
                addressId: form.addressId,
                addressText: form.addressSnapshot.trim(),
                lat: form.lat,
                lng: form.lng,
            };
            const res = await createRepairRequest(data, media.map((m) => m.file));
            setResult(res);
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    }

    function reset() {
        media.forEach((m) => URL.revokeObjectURL(m.url));
        setMedia([]);
        setMediaError('');
        setForm(EMPTY_FORM);
        setResult(null);
        setError('');
        setAiResult(null);
        setAiError('');
        setStep(1);
    }

    function onAddressType(value) {
        setField('addressId', null);
        setField('addressSnapshot', value);
        setField('lat', null);
        setField('lng', null);

        clearTimeout(debounceRef.current);

        if (value.trim().length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                setSuggestions(await autocompleteAddress(value));
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            }
        }, 300);
    }

    async function pickSuggestion(s) {
        setShowSuggestions(false);
        setField('addressId', null);
        setField('addressSnapshot', s.description);
        try {
            const detail = await getPlaceDetail(s.placeId);
            setField('lat', detail.lat);
            setField('lng', detail.lng);
        } catch {
            setError('Không lấy được toạ độ, bạn thử chọn lại gợi ý khác');
        }
    }

    const [locating, setLocating] = useState(false);


    async function useMyLocation() {
        setLocating(true);
        setError('');
        try {
            const {lat, lng} = await getCurrentPosition();
            const text = await reverseGeocode(lat, lng);
            setSuggestions([]);
            setShowSuggestions(false);
            setField('addressId', null);
            if (text) setField('addressSnapshot', text);
            setField('lat', lat);
            setField('lng', lng);
            if (!text) setError('Đã lấy được vị trí nhưng chưa tìm ra tên địa chỉ, bạn hãy nhập địa chỉ thủ công');
        } catch (e) {
            setError(e.message);
        } finally {
            setLocating(false);
        }
    }

    const category = categories.find((c) => c.id === form.categoryId);

    if (result) {
        return <RequestTrackingPage requestId={result.id} onCreateAnother={reset} onViewAll={() => nav('/requests')}/>;
    }

    return (
        <div className="page">
            <main className="shell">
                <header className="topbar request-topbar">
                    <div className="request-topbar-left">
                        {step > 1 ? (
                            <button type="button" className="icon-btn" onClick={back} aria-label="Quay lại bước trước">
                                <ArrowLeft size={22} aria-hidden="true"/>
                            </button>
                        ) : (
                            <button type="button" className="icon-btn" onClick={() => nav('/')} aria-label="Về trang chủ">
                                <ArrowLeft size={22} aria-hidden="true"/>
                            </button>
                        )}
                        <img src={logoImg} alt="Thợ Nhà" className="request-logo"/>
                        <div>
                            <h1>Tạo yêu cầu sửa chữa</h1>
                            <span>Hoàn thành vài bước để tìm người thợ phù hợp</span>
                        </div>
                    </div>
                    <div className="request-topbar-step">Bước <strong>{step}</strong>/{TOTAL_STEPS}</div>
                </header>

                <div className="stepper" role="img" aria-label={`Bước ${step} trên ${TOTAL_STEPS}`}>
                    <div className="stepper-track" style={stepperTrackStyle(TOTAL_STEPS)}/>
                    <div className="stepper-fill" style={stepperFillStyle(TOTAL_STEPS, step - 1)}/>
                    {STEP_LABELS.map((label, i) => (
                        <div key={label}
                             className={`stepper-item${i < step - 1 ? ' done' : ''}${i === step - 1 ? ' current' : ''}`}>
                            <span className="stepper-dot">{i < step - 1 ? <Check size={14} aria-hidden="true"/> : i + 1}</span>
                            <b>{label}</b>
                        </div>
                    ))}
                </div>
                <p className="step-no">Bước {step}/{TOTAL_STEPS} | {STEP_LABELS[step - 1]}</p>

                <div className="body">
                    {step === 1 && (
                        <section>
                            <h2>Thiết bị của bạn thuộc nhóm nào?</h2>
                            {catState === 'loading' && <p className="muted">Đang tải danh mục...</p>}
                            {catState === 'error' && (
                                <div className="notice">
                                    <p>Không tải được danh mục dịch vụ.</p>
                                    <button type="button" className="btn secondary small" onClick={retryCategories}>Thử
                                        lại
                                    </button>
                                </div>
                            )}
                            {catState === 'ready' && (
                                <div className="tiles" role="radiogroup" aria-label="Danh mục dịch vụ">
                                    {categories.map((c) => {
                                        const Icon = ICONS[c.icon] || Wrench;
                                        const selected = form.categoryId === c.id;
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={selected}
                                                className={`tile${selected ? ' sel' : ''}`}
                                                onClick={() => setField('categoryId', c.id)}
                                            >
                                                <span className="tile-icon"><Icon size={22} aria-hidden="true"/></span>
                                                <span>{c.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {step === 2 && (
                        <section>
                            <h2>Mô tả sự cố</h2>
                            <label className="label" htmlFor="description">Bạn đang gặp vấn đề gì?</label>
                            <textarea
                                id="description"
                                className="input area"
                                rows={5}
                                maxLength={2000}
                                placeholder="Ví dụ: Điều hòa chạy nhưng không lạnh, dàn nóng có tiếng ồn..."
                                value={form.description}
                                onChange={(e) => setField('description', e.target.value)}
                            />
                            <p className="counter">{form.description.length}/2000</p>

                            <span className="label">Hình ảnh hoặc video (không bắt buộc)</span>
                            <div className="media-grid">
                                {media.map((m) => (
                                    <div className="thumb" key={m.id}>
                                        {m.isVideo
                                            ? <video src={m.url} muted preload="metadata"
                                                     aria-label={`Video ${m.file.name}`}/>
                                            : <img src={m.url} alt={`Ảnh ${m.file.name}`}/>}
                                        <button type="button" className="thumb-x" onClick={() => removeMedia(m.id)}
                                                aria-label={`Xoá ${m.file.name}`}>
                                            <X size={14} aria-hidden="true"/>
                                        </button>
                                    </div>
                                ))}
                                <label className="thumb add">
                                    <Camera size={22} aria-hidden="true"/>
                                    <span>Thêm</span>
                                    <input
                                        type="file"
                                        accept={ALLOWED_TYPES.join(',')}
                                        multiple
                                        onChange={(e) => {
                                            addFiles(e.target.files);
                                            e.target.value = '';
                                        }}
                                    />
                                </label>
                            </div>
                            <p className="hint">Tối đa {MAX_IMAGES} ảnh (mỗi ảnh {MAX_IMAGE_MB} MB)
                                và {MAX_VIDEOS} video MP4 ({MAX_VIDEO_MB} MB).</p>
                            {mediaError && <p className="error" role="alert">{mediaError}</p>}

                            <div className="ai-box">
                                <button type="button" className="btn secondary" onClick={analyzeWithAi}
                                        disabled={aiLoading} aria-busy={aiLoading}>
                                    {aiLoading
                                        ? <Loader2 size={18} className="spin" aria-hidden="true"/>
                                        : <Sparkles size={18} aria-hidden="true"/>}
                                    {aiLoading ? 'AI đang phân tích...' : 'Phân tích bằng AI'}
                                </button>
                                <p className="hint">AI đọc mô tả và ảnh để gợi ý loại sửa chữa (điện, nước, máy giặt...).
                                    Bạn vẫn có thể tự chọn lại.</p>
                                {aiError && <p className="error" role="alert">{aiError}</p>}

                                {aiResult && (
                                    <div className="ai-result" role="status">
                                        {aiResult.categoryId ? (
                                            <>
                                                <p>
                                                    <Sparkles size={16} aria-hidden="true"/>{' '}
                                                    AI gợi ý: <strong>{aiResult.categoryName}</strong>
                                                    {' '}({Math.round((aiResult.confidence ?? 0) * 100)}%)
                                                </p>
                                                {aiResult.reason && <p className="hint">{aiResult.reason}</p>}
                                                {form.categoryId === aiResult.categoryId ? (
                                                    <p className="hint"><Check size={14} aria-hidden="true"/> Đã khớp với danh mục bạn chọn.</p>
                                                ) : (
                                                    <button type="button" className="btn primary small"
                                                            onClick={applyAiCategory}>
                                                        Đổi sang "{aiResult.categoryName}"
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <p>AI chưa chắc chắn về loại sự cố, bạn hãy tự chọn danh mục ở bước 1 nhé.</p>
                                        )}
                                        {aiResult.summary && (
                                            <div className="ai-summary">
                                                <p className="hint">Tóm tắt: {aiResult.summary}</p>
                                                <button type="button" className="btn secondary small"
                                                        onClick={applyAiSummary}>
                                                    Dùng làm mô tả
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <span className="label">Mức độ</span>
                            <div className="chips" role="radiogroup" aria-label="Mức độ ưu tiên">
                                {[['MEDIUM', 'Thường'], ['URGENT', 'Khẩn cấp']].map(([v, l]) => (
                                    <button
                                        key={v}
                                        type="button"
                                        role="radio"
                                        aria-checked={form.mucDoUuTien === v}
                                        className={`chip${form.mucDoUuTien === v ? ' sel' : ''}`}
                                        onClick={() => setField('mucDoUuTien', v)}
                                    >{l}</button>
                                ))}
                            </div>
                        </section>
                    )}

                    {step === 3 && (
                        <section>
                            <h2>Địa chỉ cần sửa</h2>

                            {addressLoading ? (
                                <p className="hint">Đang tải địa chỉ đã lưu...</p>
                            ) : (
                                <>
                                    {selectedAddress && (
                                        <>
                                            <div className="saved-address-header">
                            <span className="label">
                                Địa chỉ đã lưu
                            </span>

                                                {addresses.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="saved-address-toggle"
                                                        onClick={() =>
                                                            setShowOtherAddresses(
                                                                (value) => !value
                                                            )
                                                        }
                                                    >
                                                        {showOtherAddresses
                                                            ? 'Thu gọn'
                                                            : 'Chọn địa chỉ khác'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Địa chỉ đang được chọn */}
                                            <button
                                                type="button"
                                                className={`address-card${
                                                    form.addressId === selectedAddress.id
                                                        ? ' sel'
                                                        : ''
                                                }`}
                                                onClick={() => {
                                                    setField(
                                                        'addressId',
                                                        selectedAddress.id
                                                    );
                                                    setField(
                                                        'addressSnapshot',
                                                        selectedAddress.fullAddress
                                                    );
                                                    setField(
                                                        'lat',
                                                        selectedAddress.lat
                                                    );
                                                    setField(
                                                        'lng',
                                                        selectedAddress.lng
                                                    );

                                                    setSuggestions([]);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <div className="address-card-content">
                                                    <div className="address-card-title">
                                                        <strong>
                                                            {selectedAddress.label}
                                                        </strong>

                                                        {selectedAddress.defaultAddress && (
                                                            <span className="address-default">
                                                                Mặc định
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p>
                                                        {selectedAddress.fullAddress}
                                                    </p>
                                                </div>

                                                {form.addressId === selectedAddress.id && (
                                                    <Check size={20} aria-hidden="true" />
                                                )}
                                            </button>

                                            {/* Các địa chỉ khác */}
                                            {showOtherAddresses && (
                                                <div className="address-list">
                                                    {addresses
                                                        .filter(
                                                            (address) =>
                                                                address.id !==
                                                                selectedAddress.id
                                                        )
                                                        .map((address) => (
                                                            <button
                                                                key={address.id}
                                                                type="button"
                                                                className="address-card"
                                                                onClick={() => {
                                                                    setField(
                                                                        'addressId',
                                                                        address.id
                                                                    );
                                                                    setField(
                                                                        'addressSnapshot',
                                                                        address.fullAddress
                                                                    );
                                                                    setField(
                                                                        'lat',
                                                                        address.lat
                                                                    );
                                                                    setField(
                                                                        'lng',
                                                                        address.lng
                                                                    );

                                                                    setSuggestions([]);
                                                                    setShowSuggestions(false);


                                                                    setShowOtherAddresses(false);
                                                                }}
                                                            >
                                                                <div className="address-card-content">
                                                                    <div className="address-card-title">
                                                                        <strong>
                                                                            {address.label}
                                                                        </strong>
                                                                    </div>

                                                                    <p>
                                                                        {address.fullAddress}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <span className="label">
                                        Hoặc nhập địa chỉ khác
                                    </span>

                                    <div style={{position: 'relative'}}>
                                        <input
                                            id="addressText"
                                            className="input"
                                            type="text"
                                            autoComplete="off"
                                            maxLength={255}
                                            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                                            value={form.addressSnapshot}
                                            onChange={(e) =>
                                                onAddressType(e.target.value)
                                            }
                                            onFocus={() => {
                                                if (suggestions.length) {
                                                    setShowSuggestions(true);
                                                }
                                            }}
                                            onBlur={() => {
                                                setTimeout(
                                                    () =>
                                                        setShowSuggestions(false),
                                                    150
                                                );
                                            }}
                                        />

                                        {showSuggestions &&
                                            suggestions.length > 0 && (
                                                <ul className="suggestions">
                                                    {suggestions.map((s) => (
                                                        <li key={s.placeId}>
                                                            <button
                                                                type="button"
                                                                onMouseDown={() =>
                                                                    pickSuggestion(s)
                                                                }
                                                            >
                                                                <b>{s.chinh}</b>

                                                                {s.phu && (
                                                                    <span className="desc">
                                                                        {s.phu}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn secondary"
                                        onClick={useMyLocation}
                                        disabled={locating}
                                    >
                                        <LocateFixed size={18} aria-hidden="true"/>
                                        {locating ? 'Đang lấy vị trí...' : 'Dùng vị trí hiện tại'}
                                    </button>

                                    {form.lat == null &&
                                        form.addressSnapshot.trim() && (
                                            <p className="hint">
                                                Nên chọn một địa chỉ trong danh sách gợi ý để xác định
                                                vị trí chính xác. Nếu không, hệ thống sẽ tự tìm vị trí
                                                từ địa chỉ bạn nhập.
                                            </p>
                                        )}
                                </>
                            )}
                        </section>
                    )}

                    {step === 4 && (
                        <section>
                            <h2>Kiểm tra lại yêu cầu</h2>
                            <dl className="summary">
                                <div>
                                    <dt>Thiết bị</dt>
                                    <dd>{category?.name}</dd>
                                </div>
                                <div>
                                    <dt>Sự cố</dt>
                                    <dd>{form.description.trim()}</dd>
                                </div>
                                <div>
                                    <dt>Mức độ</dt>
                                    <dd>{form.mucDoUuTien === 'URGENT' ? 'Khẩn cấp' : 'Thường'}</dd>
                                </div>
                                <div>
                                    <dt>Đính kèm</dt>
                                    <dd>{media.length ? `${media.length} tệp` : 'Không có'}</dd>
                                </div>
                                <div>
                                    <dt>Địa chỉ</dt>
                                    <dd>{form.addressSnapshot.trim()}</dd>
                                </div>
                            </dl>
                            <p className="hint">Bấm nút quay lại nếu cần sửa thông tin ở bước trước.</p>
                        </section>
                    )}

                    {error && <p className="error" role="alert">{error}</p>}
                </div>

                <div className="footer">
                    {step < TOTAL_STEPS ? (
                        <button type="button" className="btn primary" onClick={next}>Tiếp tục</button>
                    ) : (
                        <button type="button" className="btn primary" onClick={submit} disabled={submitting}>
                            {submitting ? 'Đang gửi...' : 'Tạo yêu cầu'}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}

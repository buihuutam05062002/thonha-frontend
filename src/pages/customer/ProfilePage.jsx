import {useEffect, useState, useRef} from 'react';
import {ArrowLeft, Camera, Home, LocateFixed, LogOut, MapPin, Pencil, Plus, Save, Trash2, UserCircle} from 'lucide-react';
import {getMe, updateProfile as updateMe, uploadAvatar} from '../../api/authApi';
import {saveSession} from '../../api/session';
import {useAuth} from '../../auth/useAuth';
import {useConfirm} from '../../components/ui/confirm/confirmContext';
import {getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress} from '../../api/addressApi';
import {autocompleteAddress, getCurrentPosition, getPlaceDetail, reverseGeocode} from '../../api/mapApi';

const emptyAddress = {label: '', fullAddress: '', lat: '', lng: '', defaultAddress: false};
const MAX_AVATAR_MB = 10;

export default function ProfilePage({onBack, onLoggedOut}) {
    const {logout} = useAuth();
    const confirm = useConfirm();
    const [user, setUser] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [name, setName] = useState('');
    const [address, setAddress] = useState(emptyAddress);
    const [editingId, setEditingId] = useState(null); 
    const [showAddress, setShowAddress] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);
    const fileRef = useRef(null);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const [u, a] = await Promise.all([getMe(), getAddresses()]);
            setUser(u);
            setName(u.fullName || '');
            setAddresses(a);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function save(e) {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const u = await updateMe({fullName: name});
            setUser(u);
            saveSession({user: u}); 
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function onPickAvatar(e) {
        const file = e.target.files?.[0];
        e.target.value = ''; 
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Chỉ chấp nhận file ảnh');
            return;
        }
        if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
            setError(`Ảnh tối đa ${MAX_AVATAR_MB}MB`);
            return;
        }
        setUploading(true);
        setError('');
        try {
            const u = await uploadAvatar(file);
            setUser(u);
            saveSession({user: u});
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    }

    function openAddAddress() {
        setEditingId(null);
        setAddress(emptyAddress);
        setSuggestions([]);
        setShowAddress(true);
        setError('');
    }

    function openEditAddress(a) {
        setEditingId(a.id);
        setAddress({
            label: a.label || '',
            fullAddress: a.fullAddress || '',
            lat: a.lat ?? '',
            lng: a.lng ?? '',
            defaultAddress: !!a.defaultAddress
        });
        setSuggestions([]);
        setShowAddress(true);
        setError('');
    }

    function closeAddressForm() {
        setShowAddress(false);
        setEditingId(null);
        setAddress(emptyAddress);
    }

    async function submitAddress(e) {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                label: address.label,
                fullAddress: address.fullAddress,
                lat: address.lat !== '' && address.lat != null ? Number(address.lat) : null,
                lng: address.lng !== '' && address.lng != null ? Number(address.lng) : null,
                defaultAddress: !!address.defaultAddress 
            };
            if (editingId) await updateAddress(editingId, payload);
            else await createAddress(payload);
            closeAddressForm();
            setAddresses(await getAddresses());
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    function onAddressType(value) {
        setAddress((a) => ({...a, fullAddress: value, lat: '', lng: ''}));
        clearTimeout(debounceRef.current);
        if (value.trim().length < 3) {
            setSuggestions([]);
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
        setAddress((a) => ({...a, fullAddress: s.description}));
        try {
            const detail = await getPlaceDetail(s.placeId);
            setAddress((a) => ({...a, lat: detail.lat, lng: detail.lng}));
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
            setAddress((a) => ({...a, fullAddress: text || a.fullAddress, lat, lng}));
            if (!text) setError('Đã lấy được vị trí nhưng chưa tìm ra tên địa chỉ, bạn hãy nhập địa chỉ thủ công');
        } catch (e) {
            setError(e.message);
        } finally {
            setLocating(false);
        }
    }

    async function makeDefault(id) {
        try {
            await setDefaultAddress(id);
            setAddresses(await getAddresses());
        } catch (e) {
            setError(e.message);
        }
    }

    async function removeAddress(id) {
        if (!(await confirm({title: 'Xóa địa chỉ?', message: 'Địa chỉ này sẽ bị xóa khỏi hồ sơ của bạn.', confirmText: 'Xóa', danger: true}))) return;
        try {
            await deleteAddress(id);
            if (editingId === id) closeAddressForm();
            setAddresses(await getAddresses());
        } catch (e) {
            setError(e.message);
        }
    }

    async function signOut() {
        await logout();
        onLoggedOut();
    }

    if (loading) return <div className="page">
        <main className="shell">
            <div className="body"><p className="muted">Đang tải hồ sơ...</p></div>
        </main>
    </div>;

    return <div className="page">
        <main className="shell">
            <header className="topbar">
                <button className="icon-btn" onClick={onBack}><ArrowLeft/></button>
                <h1>Hồ sơ</h1>
            </header>
            <div className="body profile-body">
                <div className="profile-head">
                    <div className="profile-avatar">
                        {user?.avatarUrl ? <img src={user.avatarUrl} alt=""/> : <UserCircle size={48}/>}
                    </div>
                    <div>
                        <h2>{user?.fullName}</h2>
                        <span className="role">Khách hàng</span>
                        <div>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar}/>
                            <button type="button" className="btn secondary" disabled={uploading}
                                    onClick={() => fileRef.current?.click()}>
                                <Camera size={16}/>{uploading ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}
                            </button>
                        </div>
                    </div>
                </div>

                <form onSubmit={save}>
                    <label className="label">Họ và tên
                        <input className="input" value={name} onChange={e => setName(e.target.value)}
                               required maxLength={100}/>
                    </label>
                    <label className="label">Email
                        <input className="input" value={user?.email || 'Chưa cập nhật'} readOnly/>
                    </label>
                    <label className="label">Số điện thoại
                        <input className="input" value={user?.phoneNumber || 'Chưa cập nhật'} readOnly/>
                    </label>
                    {error && <div className="error">{error}</div>}
                    <button className="btn primary" disabled={saving}>
                        <Save size={18}/>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </form>

                <div className="section-title">
                    <b>Địa chỉ đã lưu</b>
                    <span>{addresses.length} địa chỉ</span>
                </div>
                <div className="address-list">
                    {addresses.map(a => <div className="address-card" key={a.id}>
                        <span className="address-icon">{a.defaultAddress ? <Home size={20}/> : <MapPin size={20}/>}</span>
                        <div className="address-main">
                            <b>{a.label} {a.defaultAddress && <span className="default-badge">Mặc định</span>}</b>
                            <span>{a.fullAddress}</span>
                            <div className="address-actions">
                                {!a.defaultAddress && <button onClick={() => makeDefault(a.id)}>Đặt mặc định</button>}
                                <button onClick={() => openEditAddress(a)}><Pencil size={14}/> Sửa</button>
                                <button onClick={() => removeAddress(a.id)}><Trash2 size={14}/> Xóa</button>
                            </div>
                        </div>
                    </div>)}
                </div>

                {!showAddress
                    ? <button className="btn secondary" onClick={openAddAddress}>
                        <Plus size={18}/>Thêm địa chỉ mới
                    </button>
                    : <form className="address-form" onSubmit={submitAddress}>
                        <h3>{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</h3>
                        <label className="label">Tên gọi
                            <input className="input" value={address.label}
                                   onChange={e => setAddress({...address, label: e.target.value})}
                                   placeholder="Nhà riêng" required/>
                        </label>
                        <label className="label">Địa chỉ
                            <div style={{position: 'relative'}}>
                                <input
                                    className="input"
                                    value={address.fullAddress}
                                    onChange={(e) => onAddressType(e.target.value)}
                                    onFocus={() => suggestions.length && setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                    placeholder="Số nhà, đường, phường/xã..."
                                    autoComplete="off"
                                    required
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="suggestions">
                                        {suggestions.map((s) => (
                                            <li key={s.placeId}>
                                                <button type="button" onMouseDown={() => pickSuggestion(s)}>
                                                    <b>{s.chinh}</b>
                                                    {s.phu && <span className="desc">{s.phu}</span>}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </label>
                        <button type="button" className="btn secondary" onClick={useMyLocation} disabled={locating}>
                            <LocateFixed size={18}/>{locating ? 'Đang lấy vị trí...' : 'Dùng vị trí hiện tại'}
                        </button>
                        <label className="check">
                            <input type="checkbox"
                                   checked={address.defaultAddress}
                                   onChange={e => setAddress({...address, defaultAddress: e.target.checked})}/>
                            Đặt làm địa chỉ mặc định
                        </label>
                        <div className="inline-buttons">
                            <button type="button" className="btn secondary" onClick={closeAddressForm}>Hủy</button>
                            <button className="btn primary" disabled={saving}>
                                {editingId ? 'Lưu thay đổi' : 'Lưu địa chỉ'}
                            </button>
                        </div>
                    </form>}

                <div className="profile-divider"/>
                <button className="btn danger" onClick={signOut}><LogOut size={18}/>Đăng xuất</button>
            </div>
        </main>
    </div>;
}

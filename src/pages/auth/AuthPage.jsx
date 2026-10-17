import {useState} from 'react';
import {ArrowLeft, CheckCircle2, Eye, EyeOff, LogIn, UserPlus} from 'lucide-react';
import {Link} from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import {login, register} from '../../api/authApi';
import {saveSession} from '../../api/session';

export default function AuthPage({onAuthenticated}) {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({fullName: '', account: '', email: '', phoneNumber: '', password: '', confirmPassword: ''});
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const change = (k, v) => {
        setForm((f) => ({...f, [k]: v}));
        setError('');
    };

    async function submit(e) {
        e.preventDefault();
        setError('');
        if (mode === 'register' && form.password !== form.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        setLoading(true);
        try {
            if (mode === 'login') {
                const res = await login({account: form.account, password: form.password});
                saveSession(res);
                onAuthenticated?.(res.user);
            } else {
                const res = await register({
                    fullName: form.fullName, email: form.email,
                    phoneNumber: form.phoneNumber, password: form.password
                });
                // Hiện thông báo trước rồi mới lưu phiên: lưu phiên xong App sẽ chuyển khỏi trang này ngay
                setSuccess('Tạo tài khoản thành công! Đang đăng nhập cho bạn...');
                setTimeout(() => {
                    saveSession(res);
                    onAuthenticated?.(res.user);
                }, 1500);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return <div className="customer-ui auth-page">
        <div className="auth-topbar">
            <Link to="/" className="auth-back"><ArrowLeft size={16} aria-hidden="true" style={{verticalAlign: '-3px', marginRight: 6}}/>Về trang chủ</Link>
            <span>Hỗ trợ khách hàng | Thợ Nhà</span>
        </div>
        <main className="shell auth-shell">
            <div className="auth-brand">
                <div className="auth-brand-logo-wrap">
                    <img src={logoImg} alt="Thợ Nhà" className="auth-brand-logo" />
                </div>
                <div className="auth-brand-copy">
                    <span className="auth-kicker">NỀN TẢNG SỬA CHỮA TẠI NHÀ</span>
                    <b>Thợ Nhà</b>
                    <span>Đặt thợ nhanh chóng, theo dõi yêu cầu dễ dàng và minh bạch.</span>
                </div>
                <div className="auth-benefits">
                    <div><CheckCircle2 size={18}/><span>Kết nối thợ phù hợp gần khu vực</span></div>
                    <div><CheckCircle2 size={18}/><span>Theo dõi yêu cầu trong một tài khoản</span></div>
                    <div><CheckCircle2 size={18}/><span>Thông tin yêu cầu rõ ràng, dễ kiểm soát</span></div>
                </div>
            </div>
            <div className="auth-body">
                <div className='auth-mobile-brand'>
                    <img src={logoImg} alt="" />
                    <b>Thợ nhà</b>
                </div>
                <div className="auth-tabs">
                    <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}><LogIn size={18}/>Đăng
                        nhập
                    </button>
                    <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}><UserPlus
                        size={18}/>Đăng ký
                    </button>
                </div>
                <h1>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản khách hàng'}</h1>
                <p className="muted">{mode === 'login' ? 'Đăng nhập để tạo và theo dõi yêu cầu sửa chữa.' : 'Dùng email hoặc số điện thoại để đăng ký tài khoản.'}</p>
                <form onSubmit={submit}>
                    {mode === 'register' && <><label className="label">Họ và tên<input className="input"
                                                                                       value={form.fullName}
                                                                                       onChange={e => change('fullName', e.target.value)}
                                                                                       placeholder="Nguyễn Văn A"
                                                                                       required/></label><label
                        className="label">Email<input className="input" type="email" value={form.email}
                                                      onChange={e => change('email', e.target.value)}
                                                      placeholder="ban@example.com"/></label><label className="label">Số
                        điện thoại<input className="input" value={form.phoneNumber}
                                         onChange={e => change('phoneNumber', e.target.value)}
                                         placeholder="0901234567"/></label></>}
                    {mode === 'login' &&
                        <label className="label">Email hoặc số điện thoại<input className="input" value={form.account}
                                                                                onChange={e => change('account', e.target.value)}
                                                                                placeholder="Email hoặc 090..."
                                                                                autoComplete="username"
                                                                                required/></label>}
                    <label className="label">Mật khẩu
                        <div style={{position: 'relative'}}>
                            <input className="input" type={showPassword ? 'text' : 'password'} minLength="6"
                                   value={form.password}
                                   onChange={e => change('password', e.target.value)}
                                   placeholder="Tối thiểu 6 ký tự"
                                   autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                   style={{paddingRight: 44}}
                                   required/>
                            <button type="button" onClick={() => setShowPassword(s => !s)}
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    style={{position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                        border: 0, background: 'transparent', cursor: 'pointer', padding: 6,
                                        display: 'flex', color: '#6b7280'}}>
                                {showPassword ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}
                            </button>
                        </div>
                    </label>
                    {mode === 'register' && (
                        <label className="label">Xác nhận mật khẩu
                            <input className="input" type={showPassword ? 'text' : 'password'} minLength="6"
                                   value={form.confirmPassword}
                                   onChange={e => change('confirmPassword', e.target.value)}
                                   placeholder="Nhập lại mật khẩu"
                                   autoComplete="new-password"
                                   required/>
                        </label>
                    )}
                    {error && <div className="error">{error}</div>}
                    {success && (
                        <div role="status" style={{margin: '14px 0 0', padding: '10px 14px', borderRadius: 10,
                            background: '#ecfdf3', color: '#067647', fontSize: 14, fontWeight: 500}}>
                            {success}
                        </div>
                    )}
                    <button className="btn primary auth-submit"
                            disabled={loading || !!success}>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
                </form>
            </div>
        </main>
    </div>;
}

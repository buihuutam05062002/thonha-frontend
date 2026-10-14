import {useState} from 'react';
import {ArrowLeft, CheckCircle2, LogIn, UserPlus} from 'lucide-react';
import {Link} from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import {login, register} from '../../api/authApi';
import {saveSession} from '../../api/session';

export default function AuthPage({onAuthenticated}) {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({fullName: '', account: '', email: '', phoneNumber: '', password: ''});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const change = (k, v) => {
        setForm((f) => ({...f, [k]: v}));
        setError('');
    };

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = mode === 'login'
                ? {account: form.account, password: form.password}
                : {fullName: form.fullName, email: form.email, phoneNumber: form.phoneNumber, password: form.password};
            const res = mode === 'login' ? await login(data) : await register(data);
            saveSession(res); // phiên đổi -> AuthRoute tự chuyển hướng
            onAuthenticated?.(res.user);
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
                    <label className="label">Mật khẩu<input className="input" type="password" minLength="6"
                                                            value={form.password}
                                                            onChange={e => change('password', e.target.value)}
                                                            placeholder="Tối thiểu 6 ký tự"
                                                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                                            required/></label>
                    {error && <div className="error">{error}</div>}
                    <button className="btn primary auth-submit"
                            disabled={loading}>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
                </form>
            </div>
        </main>
    </div>;
}

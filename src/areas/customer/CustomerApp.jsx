import {Routes, Route, Link, useNavigate, useParams, Navigate} from 'react-router-dom';
import CreateRequestPage from '../../pages/customer/CreateRequestPage.jsx';
import ProfilePage from '../../pages/customer/ProfilePage.jsx';
import RequestTrackingPage from '../../pages/customer/RequestTrackingPage.jsx';
import MyRequestsPage from '../../pages/customer/MyRequestsPage.jsx';
import RequireAuth from '../../auth/RequireAuth.jsx';
import {useAuth} from '../../auth/useAuth';
import logoImg from '../../assets/logo.png';
import {ArrowRight, Zap, Droplet, Snowflake, Wrench, Settings, Copyright} from 'lucide-react';

function CustomerHeader({user}) {
    const nav = useNavigate();
    const {logout} = useAuth();
    const signOut = async () => {
        await logout();
        nav('/auth', {replace: true});
    };

    return <header className="customer-navbar">
        <div className="customer-navbar-inner">
            <Link className="customer-brand" to="/">
                <img src={logoImg} alt="Thợ Nhà"/>
                <div><strong>Thợ Nhà</strong><span>Sửa chữa tại nhà</span></div>
            </Link>
            <nav className="customer-nav">
                <Link to="/">Trang chủ</Link>
                <a href="#services">Dịch vụ</a>
                <a href="#process">Cách hoạt động</a>
                {user ? <>
                    <Link to="/requests">Yêu cầu của tôi</Link>
                    <Link to="/profile">Hồ sơ</Link>
                    <Link to={user.roles?.includes('WORKER') ? '/worker/dashboard' : '/worker'}>Khu vực thợ</Link>
                    <button className="customer-primary" onClick={() => nav('/create')}>Tạo yêu cầu</button>
                    <button className="customer-login" onClick={signOut}>Đăng xuất</button>
                </> : <Link className="customer-login" to="/auth">Đăng nhập</Link>}
            </nav>
        </div>
    </header>;
}

function Landing() {
    const {user: u, hasRole} = useAuth();
    const nav = useNavigate();
    if (hasRole('ADMIN')) return <Navigate to="/admin" replace/>;
    if (hasRole('WORKER') && !hasRole('CUSTOMER')) return <Navigate to="/worker" replace/>;

    const services = [
        {Icon: Zap, title: 'Điện dân dụng', desc: 'Sửa điện, ổ cắm, công tắc, đèn và các sự cố điện trong nhà.'},
        {Icon: Droplet, title: 'Nước & đường ống', desc: 'Xử lý rò rỉ, tắc nghẽn, vòi nước và hệ thống cấp thoát nước.'},
        {Icon: Snowflake, title: 'Điện lạnh', desc: 'Kiểm tra, sửa chữa và bảo dưỡng điều hòa, tủ lạnh và thiết bị lạnh.'},
        {Icon: Wrench, title: 'Sửa chữa gia dụng', desc: 'Kết nối thợ phù hợp cho các nhu cầu sửa chữa khác trong gia đình.'},
    ];

    return <div className="customer-landing">
        <CustomerHeader user={u}/>
        <section className="customer-hero">
            <div className="customer-hero-inner">
                <div>
                    <span className="customer-eyebrow">Dịch vụ sửa chữa tại nhà | Nhanh | Minh bạch</span>
                    <h1>Tìm đúng người thợ cho mọi việc trong nhà.</h1>
                    <p>Chỉ cần mô tả vấn đề, chọn địa chỉ và thời gian phù hợp. Thợ Nhà giúp bạn gửi yêu cầu đến những người thợ phù hợp gần khu vực của bạn.</p>
                    <div className="customer-hero-actions">
                        {u ? <button className="customer-action primary" onClick={() => nav('/create')}>Tạo yêu cầu sửa chữa <ArrowRight size={18} className="ms-2" aria-hidden="true"/></button> : <Link className="customer-action primary" to="/auth">Đăng nhập để bắt đầu <ArrowRight size={18} className="ms-2" aria-hidden="true"/></Link>}
                        <a className="customer-action secondary" href="#services">Xem dịch vụ</a>
                    </div>
                </div>
                <div className="customer-hero-card">
                    <div className="icon-box"><Settings size={48} className="text-warning" /></div>
                    <h3>Một nơi cho mọi nhu cầu sửa chữa</h3>
                    <p>Chọn danh mục, mô tả sự cố, gửi hình ảnh và địa chỉ. Bạn có thể theo dõi trạng thái yêu cầu ngay trên tài khoản.</p>
                    <div className="d-flex gap-3 mt-4 flex-wrap">
                        <div><strong className="fs-5">4 bước</strong><div className="small text-muted">Tạo yêu cầu</div></div>
                        <div><strong className="fs-5">24/7</strong><div className="small text-muted">Gửi yêu cầu</div></div>
                    </div>
                </div>
            </div>
        </section>

        <section id="services" className="customer-section">
            <div className="customer-section-heading">
                <h2>Dịch vụ phổ biến</h2>
                <p>Chọn đúng nhóm công việc để Thợ Nhà kết nối yêu cầu của bạn với hệ thống dịch vụ phù hợp.</p>
            </div>
            <div className="customer-service-grid">
                {services.map(({Icon, title, desc}) => <article className="customer-service-card" key={title}>
                    <div className="customer-service-icon"><Icon size={32} className="text-warning" /></div>
                    <h3>{title}</h3><p>{desc}</p>
                </article>)}
            </div>
        </section>

        <section id="process" className="customer-section" style={{paddingTop: 10}}>
            <div className="customer-section-heading"><h2>Cách hoạt động</h2><p>Luồng đặt dịch vụ đơn giản, giống tinh thần giao diện Thợ nhưng tập trung vào trải nghiệm khách hàng.</p></div>
            <div className="customer-service-grid">
                {[['01','Tạo yêu cầu','Chọn danh mục và mô tả vấn đề cần sửa.'],['02','Chọn địa chỉ','Dùng địa chỉ đã lưu hoặc nhập địa chỉ mới.'],['03','Gửi yêu cầu','Chọn thời gian và gửi yêu cầu đến hệ thống.'],['04','Theo dõi','Xem trạng thái xử lý và thông tin yêu cầu.']].map(([n,t,d]) => <article className="customer-service-card" key={n}>
                    <div className="customer-service-icon" style={{fontSize: 16, fontWeight: 800, color: '#f5820d'}}>{n}</div><h3>{t}</h3><p>{d}</p>
                </article>)}
            </div>
        </section>

        <section className="customer-cta">
            <div className="customer-cta-inner">
                <div><h2>Cần sửa chữa ngay hôm nay?</h2><p>Tạo yêu cầu trong vài phút và theo dõi toàn bộ quá trình.</p></div>
                {u ? <button className="customer-action primary" onClick={() => nav('/create')}>Tạo yêu cầu ngay</button> : <Link className="customer-action primary" to="/auth">Đăng nhập / Đăng ký</Link>}
            </div>
        </section>
        <footer className="customer-footer"><Copyright size={13} aria-hidden="true" style={{verticalAlign: '-2px'}}/> 2026 Thợ Nhà | Nền tảng kết nối dịch vụ sửa chữa tại nhà</footer>
    </div>;
}

function RequestRoute() {
    const {id} = useParams();
    const nav = useNavigate();
    return <RequestTrackingPage requestId={Number(id)} onBack={() => nav('/requests')} onCreateAnother={() => nav('/create')} onViewAll={() => nav('/requests')}/>;
}

function ProfileRoute() {
    const nav = useNavigate();
    return <ProfilePage onBack={() => nav('/')} onLoggedOut={() => nav('/auth', {replace: true})}/>;
}

function CustomerRoute({children}) { return <div className="customer-ui">{children}</div>; }

export default function CustomerApp() {
    return <CustomerRoute><Routes>
        <Route index element={<Landing/>}/>
        <Route element={<RequireAuth/>}>
            <Route path="create" element={<CreateRequestPage/>}/>
            <Route path="profile" element={<ProfileRoute/>}/>
            <Route path="requests" element={<MyRequestsPage/>}/>
            <Route path="request/:id" element={<RequestRoute/>}/>
        </Route>
        <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes></CustomerRoute>;
}

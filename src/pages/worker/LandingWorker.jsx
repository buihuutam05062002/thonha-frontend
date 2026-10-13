import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Navbar,
  Nav,
} from "react-bootstrap";
import logoImg from "../../assets/logo.png"; 
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { ArrowRight, DollarSign, Clock, MapPin, Shield } from "lucide-react";

export default function LandingWorker() {
  const navigate = useNavigate();
  const { user, isAuthenticated: loggedIn, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/worker", { replace: true });
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      {/* Header Landing Page */}
      <Navbar bg="white" expand="lg" className="worker-landing-navbar border-bottom sticky-top py-3">
        <Container className="worker-landing-navbar-inner">
          <Navbar.Brand as={Link} to="/">
            <img
              src={logoImg}
              alt="Thợ Nhà"
              className="worker-landing-logo"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="landing-navbar" />
          <Navbar.Collapse id="landing-navbar">
            <Nav className="ms-auto align-items-center gap-2 flex-nowrap worker-landing-nav">
              <Nav.Link href="#about" className="fw-semibold text-dark text-nowrap worker-landing-nav-link">
                Về chúng tôi
              </Nav.Link>
              <Nav.Link href="#benefits" className="fw-semibold text-dark text-nowrap worker-landing-nav-link">
                Quyền lợi
              </Nav.Link>
              <Nav.Link href="#process" className="fw-semibold text-dark text-nowrap worker-landing-nav-link">
                Quy trình
              </Nav.Link>
              {loggedIn ? (
                <>
                  <Button
                    variant="outline-secondary"
                    className="fw-bold px-4 rounded-pill worker-account-btn"
                    onClick={() => navigate(user?.roles?.includes("WORKER") ? "/worker/dashboard" : "/worker/register")}
                  >
                    {user?.roles?.includes("WORKER") ? "Bảng điều khiển" : "Tài khoản"}
                  </Button>
                  <Button
                    variant="outline-primary"
                    className="fw-bold px-4 rounded-pill border-2 worker-login-btn"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline-primary"
                  className="fw-bold px-4 rounded-pill border-2 worker-landing-login"
                  onClick={() => navigate("/auth")}
                >
                  Đăng nhập
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section id="about" className="py-5 bg-white border-bottom">
        <Container className="py-4">
          <Row className="align-items-center g-4">
            <Col lg={7}>
              <span
                className="badge px-3 py-2 rounded-pill mb-3 fw-semibold"
                style={{ backgroundColor: "#FFF4E6", color: "#F5820D" }}
              >
                Gia nhập cộng đồng 10.000+ Thợ Nhà
              </span>
              <h1 className="display-5 fw-bold text-dark mb-3">
                Tăng thu nhập thụ động & chủ động thời gian làm việc
              </h1>
              <p className="lead text-muted mb-4">
                Thợ Nhà kết nối bạn trực tiếp với hàng ngàn khách hàng có nhu
                cầu sửa chữa điện, nước, điện lạnh gần khu vực của bạn.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="fw-bold px-4 py-3 rounded-3 border-0 shadow-sm"
                  style={{ backgroundColor: "#F5820D", color: "#FFF" }}
                  onClick={() => navigate("/worker/register")}
                >
                  Đăng ký trở thành Thợ ngay <ArrowRight size={18} className="ms-2" aria-hidden="true" />
                </Button>
              </div>
            </Col>
            <Col lg={5} className="text-center">
              <Card
                className="border-0 shadow-lg rounded-4 p-4 text-start"
                style={{ backgroundColor: "#FFF7ED" }}
              >
                <h5 className="fw-bold mb-3 text-dark">Ước tính thu nhập</h5>
                <div className="d-flex align-items-baseline gap-2 mb-2">
                  <span
                    className="display-6 fw-bold"
                    style={{ color: "#F5820D" }}
                  >
                    12 - 25 Triệu
                  </span>
                  <span className="text-muted fw-semibold">/ tháng</span>
                </div>
                <p className="small text-muted mb-0">
                  Nhận việc linh hoạt theo thời gian rảnh, nhận tiền ngay sau
                  khi hoàn thành công việc.
                </p>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-5">
        <Container className="py-4">
          <div className="text-center max-w-2xl mx-auto mb-5">
            <h2 className="fw-bold text-dark">Tại sao nên chọn Thợ Nhà?</h2>
            <p className="text-muted">
              Chúng tôi cung cấp giải pháp toàn diện giúp bạn an tâm tác nghiệp
            </p>
          </div>

          <Row className="g-4">
            {[
              {
                title: "Thu nhập hấp dẫn",
                desc: "Nhận 100% thù lao ngay sau khi hoàn thành đơn hàng. Chiết khấu minh bạch.",
                Icon: DollarSign,
              },
              {
                title: "Chủ động thời gian",
                desc: "Bật nhận việc khi rảnh, tắt khi bận. Bạn hoàn toàn làm chủ lịch trình.",
                Icon: Clock,
              },
              {
                title: "Đơn hàng liên tục",
                desc: "Hệ thống tự động điều phối đơn hàng gần vị trí của bạn nhất.",
                Icon: MapPin,
              },
              {
                title: "Hỗ trợ 24/7",
                desc: "Đội ngũ hỗ trợ giải quyết sự cố, bảo hiểm tai nạn lao động khi tác nghiệp.",
                Icon: Shield,
              },
            ].map((item, idx) => (
              <Col key={idx} md={6} lg={3}>
                <Card className="border-0 shadow-sm rounded-4 h-100 p-3">
                  <Card.Body>
                    <div className="fs-1 mb-3 text-warning"><item.Icon size={32} /></div>
                    <h5 className="fw-bold text-dark mb-2">{item.title}</h5>
                    <p className="text-muted small mb-0">{item.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Process Section */}
      <section id="process" className="worker-process-section py-5 bg-white border-top">
        <Container className="py-4">
          <div className="text-center mb-5">
            <span className="worker-section-kicker">QUY TRÌNH ĐƠN GIẢN</span>
            <h2 className="fw-bold text-dark mt-2 mb-2">Bắt đầu nhận việc chỉ với 3 bước</h2>
            <p className="text-muted mb-0">Hồ sơ rõ ràng, quy trình minh bạch, chủ động thời gian làm việc.</p>
          </div>
          <Row className="g-4">
            {[
              { n: "01", title: "Tạo hồ sơ", desc: "Điền thông tin nghề nghiệp và chuyên môn của bạn." },
              { n: "02", title: "Xác thực hồ sơ", desc: "Bổ sung giấy tờ để Thợ Nhà kiểm tra và phê duyệt." },
              { n: "03", title: "Nhận việc", desc: "Bật trạng thái nhận việc và bắt đầu kết nối khách hàng." },
            ].map((item) => (
              <Col key={item.n} md={4}>
                <div className="worker-process-card h-100">
                  <span className="worker-process-number">{item.n}</span>
                  <h5 className="fw-bold text-dark mt-3 mb-2">{item.title}</h5>
                  <p className="text-muted small mb-0">{item.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-5 mt-auto" style={{ backgroundColor: "#1E293B" }}>
        <Container className="text-center text-white py-3">
          <h3 className="fw-bold mb-3">Sẵn sàng nâng cao thu nhập của bạn?</h3>
          <p className="text-white-50 mb-4">
            Chỉ mất 5 phút để hoàn tất hồ sơ đăng ký.
          </p>
          <Button
            size="lg"
            className="fw-bold px-5 py-3 rounded-3 border-0"
            style={{ backgroundColor: "#F5820D", color: "#FFF" }}
            onClick={() => navigate("/worker/register")}
          >
            Đăng ký hồ sơ ngay
          </Button>
        </Container>
      </section>
    </div>
  );
}

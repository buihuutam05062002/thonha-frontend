import { useState } from "react";
import logoImg from "../../assets/logo.png";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const NAV_ITEMS = [
  { name: "Về chúng tôi", href: "/worker#about" },
  { name: "Quyền lợi", href: "/worker#benefits" },
  { name: "Quy trình", href: "/worker#process" },
];

export function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated: loggedIn, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/worker");
  };

  return (
    <Navbar
      bg="white"
      expand="lg"
      className="worker-register-navbar border-bottom sticky-top py-3 w-100"
    >
      <Container className="worker-register-navbar-inner">
        <Navbar.Brand as={Link} to="/worker" className="worker-register-brand">
          <img
            src={logoImg}
            alt="Thợ Nhà"
            className="worker-header-logo"
          />
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="register-navbar"
          onClick={() => setMenuOpen((v) => !v)}
        />

        <Navbar.Collapse id="register-navbar" in={menuOpen}>
          <Nav className="ms-auto align-items-center worker-register-nav">
            {NAV_ITEMS.map((item) => (
              <Nav.Link
                key={item.name}
                as={Link}
                to={item.href}
                className="fw-semibold text-dark worker-register-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </Nav.Link>
            ))}

            {loggedIn ? (
              <>
                <Button
                  variant="outline-secondary"
                  className="fw-bold px-4 rounded-pill worker-account-btn"
                  onClick={() => navigate("/profile")}
                >
                  Tài khoản
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
                className="fw-bold px-4 rounded-pill border-2 worker-login-btn"
                onClick={() => navigate("/auth")}
              >
                Đăng nhập
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

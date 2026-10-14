import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getRequestOffer } from "../../api/offerApi";
import { parseApiError } from "../../api/apiError";
import logoImg from "../../assets/logo.png";
import "../../styles/worker-request-accept.css";

function LogoImg({ height = 40 }) {
  return (
    <img
      src={logoImg}
      alt="Thợ Nhà"
      style={{ height, width: "auto", display: "block" }}
    />
  );
}

export default function OrderAcceptedPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getRequestOffer(requestId)
      .then((data) => {
        if (cancelled) return;
        if (data.result !== "ACCEPTED") {
          navigate(`/worker/request/${requestId}`, { replace: true });
          return;
        }
        setOffer(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            parseApiError(err).message || "Không tải được thông tin đơn.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const handleStartNavigation = () => {
    navigate(`/worker/request/${requestId}/navigate`);
  };

  const handleCallCustomer = () => {
    if (offer?.customerPhone) {
      window.location.href = `tel:${offer.customerPhone}`;
    }
  };

  if (loading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light">
        <div className="text-center">
          <Spinner
            animation="border"
            style={{ color: "#F5820D" }}
            className="mb-2"
          />
          <div className="text-secondary small fw-medium">
            Đang tải thông tin đơn hàng...
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light p-3">
        <Card
          className="border-0 shadow-sm rounded-4 p-4 text-center"
          style={{ maxWidth: "400px" }}
        >
          <p className="text-danger small fw-semibold mb-3">
            {error || "Không tìm thấy dữ liệu đơn hàng."}
          </p>
          <Button
            variant="light"
            className="rounded-3 fw-bold text-secondary"
            onClick={() => navigate("/worker/dashboard")}
          >
            ← Quay lại Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const customerInitials = offer.customerName
    ? offer.customerName
        .split(" ")
        .map((n) => n[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    : "KH";

  return (
    <div className="order-accepted-wrapper d-flex flex-column">
      {/* Header chính */}
      <header className="sticky-top bg-white border-bottom px-3 px-md-4 py-3 shadow-sm z-3">
        <Container
          fluid="md"
          className="d-flex align-items-center justify-content-between p-0"
        >
          <div className="d-flex align-items-center gap-3">
            <LogoImg height={36} />
          </div>
          <div className="d-flex align-items-center bg-success-subtle text-success-emphasis px-3 py-1 rounded-pill gap-2 border border-success-subtle">
            <span
              className="rounded-circle d-inline-block"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#22C55E",
              }}
            />
            <span className="small fw-bold text-success">
              Đã nhận đơn #{offer.requestCode || offer.id}
            </span>
          </div>
        </Container>
      </header>

      {/* Main Body */}
      <Container
        fluid="md"
        className="py-4 py-md-5 flex-grow-1 d-flex flex-column justify-content-center align-items-center"
      >
        {error && (
          <Alert
            variant="danger"
            className="w-100 rounded-3 border-0 shadow-sm mb-4"
            style={{ maxWidth: "680px" }}
          >
            {error}
          </Alert>
        )}

        <Card
          className="success-card w-100 rounded-4 border-0 p-4 p-md-5 text-center"
          style={{ maxWidth: "680px" }}
        >
          {/* Success Icon */}
          <div className="d-flex flex-column align-items-center mb-4">
            <div className="success-icon-wrapper mb-3">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="#22C55E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="h3 fw-bold text-dark mb-2">
              Bạn đã nhận đơn thành công!
            </h1>
            <p
              className="text-secondary small fs-md-6 mb-0"
              style={{ maxWidth: "440px" }}
            >
              Vui lòng liên hệ với khách hàng và di chuyển đến địa chỉ bên dưới
            </p>
          </div>

          {/* Card thông tin tóm tắt */}
          <div className="bg-light rounded-4 border overflow-hidden text-start mb-4 shadow-sm mx-auto w-100">
            <div className="order-info-header px-4 py-2.5 d-flex justify-content-between align-items-center text-white">
              <span className="text-uppercase fw-bold small tracking-wide">
                THÔNG TIN ĐƠN HÀNG
              </span>
              <span className="small opacity-90 fw-medium">
                Mã đơn: #{offer.requestCode || offer.id}
              </span>
            </div>

            <div className="p-4 d-flex flex-column gap-3 bg-white">
              {/* Khách hàng */}
              <div className="d-flex align-items-center gap-3">
                <div className="avatar-circle flex-shrink-0">
                  {customerInitials}
                </div>
                <div>
                  <div className="fw-bold text-dark">
                    {offer.customerName || "Khách hàng"}
                  </div>
                  <div className="small text-muted">Khách hàng cá nhân</div>
                </div>
              </div>

              <hr className="my-1 border-secondary-subtle" />

              {/* Tên Dịch vụ */}
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: "#FFF3E0",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                      stroke="#F5820D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="fw-semibold text-dark">
                  {offer.categoryName || "Dịch vụ sửa chữa"}
                </span>
              </div>

              {/* Địa chỉ */}
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-3 bg-light d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                  style={{ width: "36px", height: "36px" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                      stroke="#64748b"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="3"
                      stroke="#64748b"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="text-dark">
                  <p className="fw-semibold mb-0">
                    {offer.addressText || "Địa chỉ khách hàng"}
                  </p>
                  {offer.distance != null && (
                    <span className="small text-muted">
                      Cách bạn khoảng {offer.distance} km
                    </span>
                  )}
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="d-flex align-items-center justify-content-between gap-3 pt-1">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 bg-success-subtle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16"
                        stroke="#22C55E"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="fw-bold text-dark">
                    {offer.customerPhone || "Chưa cập nhật SĐT"}
                  </span>
                </div>
                <Badge
                  bg="success-subtle"
                  text="success"
                  className="px-2.5 py-1.5 rounded-pill fw-semibold"
                >
                  Sẵn sàng kết nối
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-column flex-sm-row gap-3 w-100">
            <Button
              onClick={handleStartNavigation}
              className="btn-direction-main flex-grow-1 py-3.5 rounded-3 d-flex align-items-center justify-content-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 11l19-9-9 19-2-8-8-2z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Bắt đầu chỉ đường</span>
            </Button>

            <Button
              onClick={handleCallCustomer}
              className="btn-call-outline flex-grow-1 py-3.5 rounded-3 d-flex align-items-center justify-content-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16"
                  stroke="#F5820D"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>Gọi khách hàng</span>
            </Button>
          </div>
        </Card>
      </Container>
    </div>
  );
}

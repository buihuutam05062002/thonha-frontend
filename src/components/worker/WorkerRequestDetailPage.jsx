import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  acceptRequest,
  getRequestOffer,
  rejectRequest,
} from "../../api/offerApi";
import { parseApiError } from "../../api/apiError";
import { useRequestNotification } from "./RequestNotificationContext";
import "../../styles/worker-request-detail.css";

export default function WorkerRequestDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { refreshProfile } = useRequestNotification();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [closed, setClosed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);

  const defaultImgs = [
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop&auto=format",
  ];

  useEffect(() => {
    let cancelled = false;
    getRequestOffer(requestId)
      .then((data) => {
        if (cancelled) return;
        setOffer(data);
        setClosed(data.result !== "PENDING");
      })
      .catch((err) => {
        if (!cancelled)
          setError(parseApiError(err).message || "Không tải được đơn.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  useEffect(() => {
    if (!offer || offer.result !== "PENDING") return;

    const deadline = Date.now() + (offer.remainingSeconds || 0) * 1000;
    let timer;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        setClosed(true);
      }
    };
    timer = setInterval(tick, 500);
    tick();
    return () => clearInterval(timer);
  }, [offer]);

  const handleAccept = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await acceptRequest(requestId);
      refreshProfile();
      navigate(`/worker/request/${requestId}/accepted`);
    } catch (err) {
      setError(
        parseApiError(err).message || "Không thể nhận đơn, vui lòng thử lại.",
      );
      setClosed(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await rejectRequest(requestId);
      navigate("/worker/dashboard");
    } catch (err) {
      setError(
        parseApiError(err).message ||
          "Không thể từ chối đơn, vui lòng thử lại.",
      );
      setClosed(true);
    } finally {
      setActionLoading(false);
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
            Đang tải thông tin đơn...
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

  const disabled = closed || actionLoading;
  
  const attachmentUrls = offer?.attachments
    ?.map((item) => (typeof item === "object" ? item.url : item))
    ?.filter(Boolean);

  const imgs =
    attachmentUrls && attachmentUrls.length > 0 ? attachmentUrls : defaultImgs;

  return (
    <div className="request-detail-wrapper d-flex flex-column">
      {/* Sticky Top Header */}
      <header className="sticky-top bg-white border-bottom px-3 px-md-4 py-3 shadow-sm z-3">
        <Container
          fluid="lg"
          className="d-flex align-items-center justify-content-between p-0"
        >
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="light"
              className="rounded-3 p-2 d-flex align-items-center justify-content-center border-0"
              style={{ width: "38px", height: "38px" }}
              onClick={() => navigate("/worker/dashboard")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M19 12H5M12 19l-7-7 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
            <h1 className="h6 h5-md fw-bold text-dark mb-0">
              Chi tiết đơn hàng #{offer.requestCode || offer.id}
            </h1>
          </div>

          <div className="d-flex align-items-center gap-2">
            {offer.priorityLevel === "URGENT" && (
              <Badge
                bg="danger"
                className="px-2.5 py-1.5 rounded-pill fw-semibold"
              >
                KHẨN CẤP
              </Badge>
            )}
            <div className="d-flex align-items-center bg-warning-subtle text-warning-emphasis px-3 py-1 rounded-pill gap-2 border border-warning-subtle">
              <span
                className="rounded-circle pulse-badge d-inline-block"
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#F5820D",
                }}
              />
              <span className="small fw-bold" style={{ color: "#F5820D" }}>
                {closed ? "Đã kết thúc" : "Đang chờ nhận"}
              </span>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <Container fluid="lg" className="py-4 flex-grow-1">
        {error && (
          <Alert variant="danger" className="rounded-3 border-0 shadow-sm mb-4">
            {error}
          </Alert>
        )}

        <Row className="g-4">
          {/* CỘT TRÁI */}
          <Col lg={7} className="d-flex flex-column gap-3">
            {/* Carousel ảnh */}
            <Card className="custom-card rounded-4 border-0 p-2">
              <div className="img-carousel-container">
                <img
                  src={imgs[activeImg] || imgs[0]}
                  alt="Ảnh sự cố"
                  className="w-100 h-100 object-fit-cover rounded-3"
                  onError={(e) => {
                    e.target.src = defaultImgs[0];
                  }}
                />
                {imgs.length > 1 && (
                  <div className="position-absolute bottom-0 start-0 end-0 d-flex justify-content-center gap-1.5 pb-3">
                    {imgs.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`carousel-dot ${i === activeImg ? "active" : ""}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Mô tả sự cố */}
            <Card className="custom-card rounded-4 border-0 p-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span
                  className="text-uppercase text-muted fw-bold tracking-wide"
                  style={{ fontSize: "0.75rem" }}
                >
                  Mô tả sự cố
                </span>
                {offer.categoryName && (
                  <Badge
                    bg="light"
                    text="dark"
                    className="px-2.5 py-1.5 rounded-2 fw-semibold border"
                  >
                    {offer.categoryName}
                  </Badge>
                )}
              </div>
              <Card.Text className="text-dark leading-relaxed mb-0">
                {offer.description || "Không có mô tả chi tiết."}
              </Card.Text>
            </Card>

            {/* 3. ĐÁNH GIÁ SƠ BỘ TỪ AI: Chỉ hiển thị khi có offer.aiAssessment */}
            {offer.aiAssessment && offer.aiAssessment.length > 0 && (
              <Card className="ai-card-bg rounded-4 p-4 border-0">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div
                    className="rounded-2 d-flex align-items-center justify-content-center text-white"
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: "#F5820D",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <span className="fw-bold text-dark small">
                    Đánh giá sơ bộ từ AI
                  </span>
                </div>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {offer.aiAssessment.map((item, idx) => (
                    <li key={idx} className="d-flex align-items-start gap-2.5">
                      <span
                        className="rounded-circle mt-2 flex-shrink-0"
                        style={{
                          width: "6px",
                          height: "6px",
                          backgroundColor: "#F5820D",
                        }}
                      />
                      <span className="small text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Col>

          {/* CỘT PHẢI */}
          <Col lg={5} className="d-flex flex-column gap-3">
            <div className="sticky-lg-top" style={{ top: "90px" }}>
              <div className="d-flex flex-column gap-3">
                {/* 2. KHOẢNG GIÁ AI: Bọc cả Card, chỉ hiện khi có priceRange */}
                {offer.priceRange && (
                  <Card className="ai-price-card rounded-4 p-4 border-0">
                    <div
                      className="text-muted fw-semibold mb-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Khoảng giá AI gợi ý
                    </div>
                    <div
                      className="h3 fw-bold mb-1"
                      style={{ color: "#F5820D" }}
                    >
                      {offer.priceRange}
                    </div>
                    <div className="text-muted small">
                      Giá tham khảo, có thể thay đổi sau khi kiểm tra thực tế
                    </div>
                  </Card>
                )}

                {/* Customer Info Card */}
                <Card className="custom-card rounded-4 border-0 p-4">
                  <div
                    className="text-uppercase text-muted fw-bold mb-3"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Thông tin khách hàng
                  </div>

                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white fs-5 flex-shrink-0"
                      style={{
                        width: "48px",
                        height: "48px",
                        backgroundColor: "#1B2A4A",
                      }}
                    >
                      {offer.customerName
                        ? offer.customerName.charAt(0).toUpperCase()
                        : "KH"}
                    </div>
                    <div>
                      <div className="fw-bold text-dark">
                        {offer.customerName || "Khách hàng"}
                      </div>

                      {/* Số sao: Ẩn cho đến khi có điểm đánh giá thật của khách */}
                      {offer.customerRating != null && (
                        <div className="d-flex align-items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <svg
                              key={i}
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill={
                                i <= Math.round(offer.customerRating)
                                  ? "#F5820D"
                                  : "#e2e8f0"
                              }
                            >
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                          ))}
                          <span className="small text-secondary fw-semibold ms-1">
                            {Number(offer.customerRating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-top d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2.5 text-secondary small">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />
                        <circle
                          cx="12"
                          cy="10"
                          r="3"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />
                      </svg>
                      <span>
                        {offer.addressText || "Chưa cập nhật địa chỉ"}
                      </span>
                    </div>

                    {/* 1. KHOẢNG CÁCH: Bỏ giá trị mặc định 1.2 km */}
                    <div className="d-flex align-items-center gap-2.5 text-secondary small">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="flex-shrink-0"
                      >
                        <path
                          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                          stroke="#F5820D"
                          strokeWidth="2"
                        />
                      </svg>
                      <span className="fw-bold" style={{ color: "#F5820D" }}>
                        {offer.distance != null
                          ? `${offer.distance} km`
                          : "Chưa xác định"}
                      </span>
                      {offer.distance != null && (
                        <span className="text-muted">từ vị trí bạn</span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Actions Button - Desktop */}
                <Card className="custom-card rounded-4 border-0 p-3 d-none d-sm-block">
                  {!closed ? (
                    <div
                      className={`small text-center fw-semibold mb-3 ${seconds > 10 ? "text-secondary" : "text-danger pulse-badge"}`}
                    >
                      ⏱️ Còn {seconds}s để phản hồi yêu cầu này
                    </div>
                  ) : (
                    <div className="small text-center text-muted mb-3">
                      Đơn đã hết hạn hoặc đã được xử lý.
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Button
                      onClick={handleAccept}
                      disabled={disabled}
                      className="btn-accept-main flex-grow-1 py-3 rounded-3"
                    >
                      {actionLoading ? "Đang xử lý..." : "Nhận đơn ngay"}
                    </Button>
                    <Button
                      variant="light"
                      onClick={handleReject}
                      disabled={disabled}
                      className="px-4 py-3 rounded-3 fw-bold text-secondary border-0"
                    >
                      Từ chối
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Actions Button - Mobile Floating Bar */}
      <div className="mobile-action-bar d-sm-none p-3">
        {!closed && (
          <div
            className={`small text-center fw-semibold mb-2 ${seconds > 10 ? "text-secondary" : "text-danger pulse-badge"}`}
          >
            ⏱️ Còn {seconds}s để phản hồi
          </div>
        )}
        <div className="d-flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={disabled}
            className="btn-accept-main flex-grow-1 py-3 rounded-3"
          >
            {actionLoading ? "Đang xử lý..." : "Nhận đơn"}
          </Button>
          <Button
            variant="light"
            onClick={handleReject}
            disabled={disabled}
            className="px-3 py-3 rounded-3 fw-bold text-secondary border-0"
          >
            Từ chối
          </Button>
        </div>
      </div>
    </div>
  );
}

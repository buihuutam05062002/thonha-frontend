import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";

export function NewRequestNotificationModal({
  isOpen,
  order,
  onClose,
  onViewDetail,
  onSkip,
  loading = false,
  error = null,
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen || !order) return;

    const deadline = Date.now() + (order.remainingSeconds ?? 45) * 1000;
    let timer;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        onClose();
      }
    };
    timer = setInterval(tick, 500);
    tick();
    return () => clearInterval(timer);
  }, [isOpen, order?.offerId]);

  if (!order) return null;

  const urgent = order.priorityLevel === "URGENT";

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={false}
      dialogClassName="modal-bottom-sheet"
      contentClassName="border-0 shadow-lg rounded-top-4 rounded-bottom-0 rounded-md-4"
    >
      <Modal.Body className="p-4">
        <div className="d-flex justify-content-center mb-3">
          <div
            className="bg-secondary opacity-25 rounded-pill"
            style={{ width: "40px", height: "4px" }}
          />
        </div>

        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: "44px",
              height: "44px",
              backgroundColor: "#FFF3E0",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="#F5820D"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="#F5820D"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="fw-bold text-dark fs-6">
              {urgent ? "Đơn KHẨN CẤP gần bạn!" : "Có đơn hàng mới gần bạn!"}
            </div>
            <div className="small text-muted">
              Phản hồi ngay để nhận đơn
              {order.requestCode && <span> · #{order.requestCode}</span>}
            </div>
          </div>
        </div>

        <div
          className="rounded-3 p-3 mb-3 border"
          style={{ backgroundColor: "#F8FAFC" }}
        >
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-2 d-flex align-items-center justify-content-center"
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#FFF3E0",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                    stroke="#F5820D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="fw-bold text-dark small">
                  {order.categoryName || "Dịch vụ sửa chữa"}
                </div>
                <div
                  className="text-muted text-truncate"
                  style={{ fontSize: "11px", maxWidth: "200px" }}
                >
                  {order.description || "Đơn dịch vụ"}
                </div>
              </div>
            </div>
            <span className="text-muted small">Vừa xong</span>
          </div>

          <div className="d-flex align-items-center gap-3 mt-2">
            {order.distance && (
              <>
                <div className="d-flex align-items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                      stroke="#F5820D"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="3"
                      stroke="#F5820D"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="fw-semibold text-secondary small">
                    {order.distance} km
                  </span>
                </div>
                <div className="vr" style={{ height: "16px" }} />
              </>
            )}
            <div className="text-secondary small text-truncate">
              {order.addressText || "Chưa có địa chỉ cụ thể"}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke={seconds > 10 ? "#6C757D" : "#DC3545"}
              strokeWidth="2"
            />
            <path
              d="M12 6v6l4 2"
              stroke={seconds > 10 ? "#6C757D" : "#DC3545"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span
            className={`small fw-medium ${seconds > 10 ? "text-muted" : "text-danger"}`}
          >
            Còn {seconds}s để phản hồi
          </span>
        </div>

        <div className="d-flex gap-2">
          <Button
            onClick={() => onViewDetail(order)}
            disabled={loading}
            className="flex-fill py-2.5 fw-bold border-0 rounded-3"
            style={{ backgroundColor: "#F5820D", color: "#FFF" }}
          >
            Xem chi tiết
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => onSkip(order)}
            disabled={loading}
            className="flex-fill py-2.5 fw-semibold rounded-3 border-secondary-subtle"
          >
            {loading ? "Đang xử lý..." : "Bỏ qua"}
          </Button>
        </div>
        {error && (
          <p className="small text-danger text-center mt-2 mb-0">{error}</p>
        )}
      </Modal.Body>
    </Modal>
  );
}

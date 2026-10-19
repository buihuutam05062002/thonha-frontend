import { Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";

export function ApprovalPending({ status, reason, onResubmit }) {
  const rejected = status === "REJECTED";
  const navigate = useNavigate();
  const { hasRole, logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate("/worker", { replace: true });
  };

  return (
    <div className="d-flex min-vh-100 bg-light align-items-center justify-content-center p-3">
      <Card
        className="border-0 shadow-sm rounded-4"
        style={{ maxWidth: "420px" }}
      >
        <Card.Body className="p-5 text-center">
          <h5 className="fw-bold text-dark mb-2">
            {rejected ? "Hồ sơ chưa được duyệt" : "Hồ sơ đang chờ duyệt"}
          </h5>
          <p className="text-muted small mb-0">
            {rejected
              ? `Hồ sơ của bạn chưa được duyệt.${reason ? ` Lý do: ${reason}.` : ""} Bạn có thể chỉnh sửa và nộp lại hồ sơ.`
              : "Chúng tôi sẽ xem xét và mở quyền nhận việc trong vòng 1-2 ngày làm việc. Bạn sẽ dùng được bảng điều khiển sau khi hồ sơ được duyệt."}
          </p>
          {rejected && onResubmit && (
            <button
              type="button"
              className="btn btn-dark rounded-pill px-4 mt-4"
              onClick={onResubmit}
            >
              Chỉnh sửa &amp; nộp lại hồ sơ
            </button>
          )}
          <div className={`d-flex flex-column flex-sm-row gap-2 justify-content-center ${rejected ? "mt-3" : "mt-4"}`}>
            {hasRole("CUSTOMER") && (
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => navigate("/")}>
                Về trang khách hàng
              </button>
            )}
            <button type="button" className="btn btn-outline-dark rounded-pill px-4" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
import { IconBell, IconSettings } from "../../icon/Index";
import { useAuth } from "../../../auth/useAuth";

export function HeaderDashboard({ onToggleNotif, pendingCount = 0 }) {
  const { user } = useAuth();
  const fullName = user?.fullName || "Thợ Nhà";
  return (
    <header className="bg-white border-bottom sticky-top z-3 px-4 py-3 d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center gap-3">
        <div
          className="rounded-circle bg-warning bg-opacity-10 text-warning fw-bold d-flex align-items-center justify-content-center"
          style={{ width: "40px", height: "40px", color: "#F5820D" }}
        >
          {fullName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-muted mb-0" style={{ fontSize: "11px" }}>Xin chào,</p>
          <p className="fw-bold text-dark mb-0 leading-tight">{fullName}</p>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <button
          onClick={onToggleNotif}
          className="btn btn-light rounded-circle p-2 position-relative border-0"
          aria-label={pendingCount > 0 ? `Thông báo, ${pendingCount} yêu cầu mới` : "Thông báo"}
        >
          <IconBell />
          {pendingCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
              {pendingCount}
            </span>
          )}
        </button>
        <button className="btn btn-light rounded-circle p-2 border-0" aria-label="Cài đặt" disabled title="Sắp ra mắt">
          <IconSettings />
        </button>
      </div>
    </header>
  );
}

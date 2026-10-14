import React, { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import { Sidebar } from "./dashboard/Sidebar";
import { HeaderDashboard } from "./dashboard/HeaderDashboard";
import { ActiveStatusCard } from "./dashboard/ActiveStatusCard";
import { OverviewStats } from "./dashboard/OverviewStats";
import { RecentOrders } from "./dashboard/RecentOrders";
import { QuickMenu } from "./dashboard/QuickMenu";
import { BottomNav } from "./dashboard/BottomNav";
import { NotificationDropdown } from "./dashboard/NotificationDropdown";
import { parseApiError } from "../../api/apiError";
import {
  getMyWorkerProfile,
  updateWorkerAvailability,
} from "../../api/workerApi";
import { ApprovalPending } from "./dashboard/ApprovalPending";
import { useNavigate } from "react-router-dom";
import { useRequestNotification } from "./RequestNotificationContext";

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const { enablePush } = useRequestNotification();

  useEffect(() => {
    let cancelled = false;
    getMyWorkerProfile()
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          navigate("/worker/register", { replace: true });
        } else {
          setProfile(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            parseApiError(err).message ||
              "Không tải được hồ sơ, vui lòng tải lại trang.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleToggle = async () => {
    if (toggling || profile?.availabilityStatus === "BUSY") return;
    setToggling(true);
    setToggleError(null);
    try {
      const next = profile.availabilityStatus !== "READY";
      if (next) enablePush();
      const updated = await updateWorkerAvailability(next);
      setProfile(updated);
    } catch (err) {
      const parsed = parseApiError(err);
      setToggleError(
        parsed.message || "Không thể đổi trạng thái, vui lòng thử lại.",
      );
      if (
        parsed.code === "WORKER_HAS_ONGOING_JOBS" ||
        parsed.code === "WORKER_NOT_APPROVED"
      ) {
        const fresh = await getMyWorkerProfile().catch(() => null);
        if (fresh) setProfile(fresh);
      }
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <Spinner animation="border" style={{ color: "#F5820D" }} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center p-3">
        <p className="text-danger mb-0">{loadError}</p>
      </div>
    );
  }

  if (!profile) return null;

  if (profile.approvalStatus !== "APPROVED") {
    return <ApprovalPending status={profile.approvalStatus} />;
  }

  return (
    <div className="d-flex min-vh-100 bg-light">
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column min-width-0">
        <HeaderDashboard onToggleNotif={() => setNotifOpen(!notifOpen)} />

        <main className="flex-grow-1 p-3 p-lg-4 pb-5">
          <Container fluid="lg" style={{ maxWidth: "900px" }}>
            <ActiveStatusCard
              status={profile.availabilityStatus}
              loading={toggling}
              error={toggleError}
              onToggle={handleToggle}
            />
            <OverviewStats />
            <RecentOrders />
            <QuickMenu />
          </Container>
        </main>
      </div>

      <BottomNav />

      {notifOpen && <NotificationDropdown />}
    </div>
  );
}

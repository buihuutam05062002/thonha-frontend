import { useCallback, useEffect, useRef, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import { Sidebar } from "../../components/worker/dashboard/Sidebar";
import { HeaderDashboard } from "../../components/worker/dashboard/HeaderDashboard";
import { ActiveStatusCard } from "../../components/worker/dashboard/ActiveStatusCard";
import { OverviewStats } from "../../components/worker/dashboard/OverviewStats";
import { IncomingRequests } from "../../components/worker/dashboard/IncomingRequests";
import { WeeklyIncome } from "../../components/worker/dashboard/WeeklyIncome";
import { ActiveOrders } from "../../components/worker/dashboard/ActiveOrders";
import { OrderDetailModal } from "../../components/worker/dashboard/OrderDetailModal";
import { RecentOrders } from "../../components/worker/dashboard/RecentOrders";
import { QuickMenu } from "../../components/worker/dashboard/QuickMenu";
import { BottomNav } from "../../components/worker/dashboard/BottomNav";
import { NotificationDropdown } from "../../components/worker/dashboard/NotificationDropdown";
import { ApprovalPending } from "../../components/worker/dashboard/ApprovalPending";
import { parseApiError } from "../../api/apiError";
import { useAuth } from "../../auth/useAuth";
import {
  getMyWorkerProfile,
  updateWorkerAvailability,
  getWorkerDashboard,
  respondToMatching,
  updateWorkerLocation,
} from "../../api/workerApi";
import { getCurrentPosition } from "../../api/mapApi";
import { useNavigate } from "react-router-dom";
import { useUserTopics } from "../../hooks/useUserTopics";
import { ScheduleModal } from "../../components/worker/schedule/ScheduleModal";
import { WalletCard } from "../../components/worker/wallet/WalletCard";
import { WalletModal } from "../../components/worker/wallet/WalletModal";


const FALLBACK_POLL_MS = 30000;

const LOCATION_PUSH_MS = 20000;

const TRACKING_PUSH_MS = 5000;

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [toggleError, setToggleError] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [dashError, setDashError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [respondError, setRespondError] = useState(null);
  const mounted = useRef(true);

  
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMyWorkerProfile()
      .then((data) => {
        if (cancelled) return;
        if (!data) navigate("/worker/register", { replace: true });
        else setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(parseApiError(err).message || "Không tải được hồ sơ, vui lòng tải lại trang.");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [navigate]);

  const approved = profile?.approvalStatus === "APPROVED";

  const loadDashboard = useCallback(async () => {
    try {
      const data = await getWorkerDashboard();
      if (!mounted.current) return;
      setDashboard(data);
      setDashError(null);
    } catch (err) {
      if (mounted.current) setDashError(parseApiError(err).message || "Không tải được dữ liệu bảng điều khiển.");
    }
  }, []);

  
  const refreshProfile = useCallback(() => {
    getMyWorkerProfile()
      .then((fresh) => { if (fresh && mounted.current) setProfile(fresh); })
      .catch(() => {});
  }, []);

  
  const refreshTimer = useRef(null);
  const handleSocketMessage = useCallback(() => {
    
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => { loadDashboard(); refreshProfile(); }, 300);
  }, [loadDashboard, refreshProfile]);
  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  const userId = authUser?.id;

  
  const handleAccountMessage = refreshProfile;
  const accountConnected = useUserTopics(profile ? userId : null, ["account"], handleAccountMessage);
  
  useEffect(() => {
    if (accountConnected) handleAccountMessage();
  }, [accountConnected, handleAccountMessage]);
  const wsConnected = useUserTopics(approved ? userId : null, ["matching"], handleSocketMessage);

  
  useEffect(() => {
    if (!approved) return undefined;
    loadDashboard();
    const onVisible = () => { if (document.visibilityState === "visible") loadDashboard(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [approved, loadDashboard]);

  
  useEffect(() => {
    if (approved && wsConnected) loadDashboard();
  }, [approved, wsConnected, loadDashboard]);

  
  useEffect(() => {
    if (!approved || wsConnected) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadDashboard();
    }, FALLBACK_POLL_MS);
    return () => clearInterval(id);
  }, [approved, wsConnected, loadDashboard]);

  
  
  const availability = profile?.availabilityStatus;
  
  const hasOngoing = (profile?.ongoingJobsCount ?? 0) > 0;
  const onTheWay = (dashboard?.activeOrders ?? []).some((o) => o.status === "ON_THE_WAY");
  useEffect(() => {
    if (!approved || (availability !== "READY" && !hasOngoing)) {
      setLocationError(null);
      return undefined;
    }
    let stopped = false;
    const pushLocation = async () => {
      try {
        const { lat, lng } = await getCurrentPosition({ maximumAge: onTheWay ? 2000 : 30000 });
        if (stopped) return;
        await updateWorkerLocation(lat, lng);
        if (!stopped) setLocationError(null);
      } catch (err) {
        if (!stopped) {
          setLocationError(
            parseApiError(err).message || err.message || "Không cập nhật được vị trí của bạn"
          );
        }
      }
    };
    pushLocation();
    const id = setInterval(pushLocation, onTheWay ? TRACKING_PUSH_MS : LOCATION_PUSH_MS);
    return () => { stopped = true; clearInterval(id); };
  }, [approved, availability, hasOngoing, onTheWay]);

  const handleToggle = async () => {
    if (toggling || profile?.availabilityStatus === "BUSY") return;
    setToggling(true);
    setToggleError(null);
    try {
      const next = profile.availabilityStatus !== "READY";
      setProfile(await updateWorkerAvailability(next));
    } catch (err) {
      const parsed = parseApiError(err);
      setToggleError(parsed.message || "Không thể đổi trạng thái, vui lòng thử lại.");
      if (parsed.code === "WORKER_HAS_ONGOING_JOBS" || parsed.code === "WORKER_NOT_APPROVED") {
        const fresh = await getMyWorkerProfile().catch(() => null);
        if (fresh) setProfile(fresh);
      }
    } finally {
      setToggling(false);
    }
  };

  const handleRespond = async (req, result) => {
    setBusyId(req.matchingLogId);
    setRespondError(null);
    try {
      await respondToMatching(req.requestId, req.matchingLogId, result);
      const fresh = await getMyWorkerProfile().catch(() => null); 
      if (fresh && mounted.current) setProfile(fresh);
    } catch (err) {
      setRespondError(parseApiError(err).message || "Không thể gửi phản hồi, vui lòng thử lại.");
    } finally {
      if (mounted.current) setBusyId(null);
      loadDashboard(); 
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

  if (!approved) {
    return (
      <ApprovalPending
        status={profile.approvalStatus}
        reason={profile.rejectReason}
        onResubmit={() => navigate("/worker/register", { state: { resubmitProfile: profile } })}
      />
    );
  }

  const user = {
    name: authUser?.fullName || "Thợ Nhà",
    specialty: profile.specialties?.map((s) => s.name).join(", "),
  };
  const incoming = dashboard?.incomingRequests ?? [];
  const orders = dashboard?.recentOrders ?? [];
  const activeOrders = dashboard?.activeOrders ?? [];
  const toggleNotif = () => setNotifOpen((v) => !v);

  return (
    <div className="d-flex min-vh-100 bg-light">
      <Sidebar user={user} pendingCount={incoming.length} onOpenNotif={toggleNotif} />

      <div className="flex-grow-1 d-flex flex-column min-width-0">
        <HeaderDashboard onToggleNotif={toggleNotif} pendingCount={incoming.length} />

        <main className="flex-grow-1 p-3 p-lg-4 pb-5">
          <Container fluid="lg" style={{ maxWidth: "900px" }}>
            {locationError && (
              <div className="alert alert-warning small" role="alert">
                Chưa lấy được vị trí của bạn nên hệ thống chưa thể giao đơn gần bạn. {locationError}
              </div>
            )}

            <ActiveStatusCard
              status={profile.availabilityStatus}
              ongoingJobs={profile.ongoingJobsCount ?? 0}
              loading={toggling}
              error={toggleError}
              onToggle={handleToggle}
            />

            {dashError && !dashboard && (
              <div className="alert alert-danger small" role="alert">
                {dashError}{" "}
                <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={loadDashboard}>Thử lại</button>
              </div>
            )}

            {!dashboard && !dashError && (
              <div className="text-center py-5"><Spinner animation="border" style={{ color: "#F5820D" }} /></div>
            )}

            {dashboard && (
              <>
                <WalletCard refreshKey={dashboard} onOpen={() => setWalletOpen(true)} />
                <IncomingRequests requests={incoming} busyId={busyId} error={respondError} onRespond={handleRespond} />
                <ActiveOrders orders={activeOrders} onSelect={setSelectedOrderId} />
                <OverviewStats summary={dashboard.summary} />
                <WeeklyIncome data={dashboard.weeklyIncome} total={dashboard.summary.incomeWeek} />
                <RecentOrders orders={orders} onSelect={setSelectedOrderId} />
                <QuickMenu onOpenSchedule={() => setScheduleOpen(true)} onOpenWallet={() => setWalletOpen(true)} onOpenEarnings={() => navigate("/worker/earnings")} />
              </>
            )}
          </Container>
        </main>
      </div>

      <BottomNav pendingCount={incoming.length} onOpenNotif={toggleNotif} />

      {selectedOrderId != null && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onChanged={() => { loadDashboard(); refreshProfile(); }}
        />
      )}

      {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}

      {walletOpen && <WalletModal onClose={() => setWalletOpen(false)} />}

      {notifOpen && <NotificationDropdown incoming={incoming} orders={orders} onClose={() => setNotifOpen(false)} />}
    </div>
  );
}

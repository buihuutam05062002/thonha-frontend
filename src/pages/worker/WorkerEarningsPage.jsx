import { useEffect, useState } from "react";
import { Container, Nav, Spinner } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sidebar } from "../../components/worker/dashboard/Sidebar";
import { HeaderDashboard } from "../../components/worker/dashboard/HeaderDashboard";
import { BottomNav } from "../../components/worker/dashboard/BottomNav";
import { IncomeTab } from "../../components/worker/earnings/IncomeTab";
import { OrderHistoryTab } from "../../components/worker/earnings/OrderHistoryTab";
import { ReviewsTab } from "../../components/worker/earnings/ReviewsTab";
import { parseApiError } from "../../api/apiError";
import { useAuth } from "../../auth/useAuth";
import { getMyWorkerProfile } from "../../api/workerApi";

const ACCENT = "#F5820D";
const TABS = [
  { key: "income", label: "Thu nhập", Component: IncomeTab },
  { key: "history", label: "Lịch sử công việc", Component: OrderHistoryTab },
  { key: "reviews", label: "Đánh giá", Component: ReviewsTab },
];

/** Trang "Thu nhập & đánh giá" của thợ: 3 tab, tab đang mở nằm trên URL (?tab=income|history|reviews). */
export default function WorkerEarningsPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab = TABS.some((t) => t.key === requested) ? requested : "income";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  // Tab nào đã mở rồi thì giữ nguyên (bộ lọc, trang đang xem), chỉ ẩn đi khi chuyển tab.
  const [visited, setVisited] = useState(() => new Set([tab]));

  useEffect(() => {
    setVisited((cur) => (cur.has(tab) ? cur : new Set(cur).add(tab)));
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    getMyWorkerProfile()
      .then((data) => {
        if (cancelled) return;
        if (!data) navigate("/worker/register", { replace: true });
        // chưa được duyệt: trang chủ thợ hiển thị đúng màn hình chờ duyệt / nộp lại hồ sơ
        else if (data.approvalStatus !== "APPROVED") navigate("/worker/dashboard", { replace: true });
        else setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(parseApiError(err).message || "Không tải được hồ sơ, vui lòng tải lại trang.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [navigate]);

  if (loading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <Spinner animation="border" style={{ color: ACCENT }} />
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

  const user = {
    name: authUser?.fullName || "Thợ Nhà",
    specialty: profile.specialties?.map((s) => s.name).join(", "),
  };
  const current = tab === "history" ? "orders" : "earnings";
  const goHome = () => navigate("/worker/dashboard"); // thông báo realtime nằm ở trang chủ thợ

  return (
    <div className="d-flex min-vh-100 bg-light">
      <Sidebar user={user} current={current} onOpenNotif={goHome} />

      <div className="flex-grow-1 d-flex flex-column min-width-0">
        <HeaderDashboard onToggleNotif={goHome} />

        <main className="flex-grow-1 p-3 p-lg-4 pb-5">
          <Container fluid="lg" style={{ maxWidth: "900px" }} className="pb-5">
            <h5 className="fw-bold text-dark mb-3">Thu nhập &amp; đánh giá</h5>

            <Nav variant="pills" className="gap-2 mb-4 flex-nowrap overflow-auto pb-1" role="tablist" aria-label="Thu nhập và đánh giá">
              {TABS.map((t) => {
                const on = t.key === tab;
                return (
                  <Nav.Item key={t.key}>
                    <Nav.Link
                      as="button"
                      type="button"
                      role="tab"
                      id={`earn-tab-${t.key}`}
                      aria-selected={on}
                      aria-controls={`earn-panel-${t.key}`}
                      active={on}
                      className="rounded-pill fw-semibold text-nowrap"
                      style={on ? { background: ACCENT, color: "#fff" } : { color: "#6B7280", background: "#fff" }}
                      onClick={() => setParams({ tab: t.key }, { replace: true })}
                    >
                      {t.label}
                    </Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>

            {TABS.map(({ key, Component }) =>
              visited.has(key) ? (
                <div
                  key={key}
                  role="tabpanel"
                  id={`earn-panel-${key}`}
                  aria-labelledby={`earn-tab-${key}`}
                  hidden={key !== tab}
                >
                  <Component active={key === tab} />
                </div>
              ) : null
            )}
          </Container>
        </main>
      </div>

      <BottomNav current={current} onOpenNotif={goHome} />
    </div>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "../../auth/RequireAuth";
import LandingWorker from "../../pages/worker/LandingWorker";
import RegisterWorkerProfilePage from "../../pages/worker/RegisterWorkerProfilePage";
import WorkerDashboard from "../../pages/worker/WorkerDashboard";
import WorkerEarningsPage from "../../pages/worker/WorkerEarningsPage";
import ScheduleWarrantyModal from "../../components/worker/warranty/ScheduleWarrantyModal";
import CompleteWarrantyPage from "../../components/worker/warranty/CompleteWarrantyPage";
import WarrantyDetailPage from "../../components/worker/warranty/WarrantyDetailPage";
import WarrantyListPage from "../../components/worker/warranty/WarrantyListPage";

export default function WorkerArea() {
  return (
    <Routes>
      <Route index element={<LandingWorker />} />
      {/* Đăng ký / nộp lại hồ sơ: chỉ cần đăng nhập (chưa có role WORKER) */}
      <Route element={<RequireAuth redirectTo="/worker" />}>
        <Route path="register" element={<RegisterWorkerProfilePage />} />
      </Route>
      {/* Khu vực làm việc: cần role WORKER, không đủ quyền thì về trang giới thiệu để đăng ký */}
      <Route element={<RequireAuth roles={["WORKER"]} redirectTo="/worker" />}>
        <Route path="dashboard" element={<WorkerDashboard />} />
        <Route path="earnings" element={<WorkerEarningsPage />} />
        <Route path="warranty" element={<WarrantyListPage />} />
        <Route path="warranty/:claimId" element={<WarrantyDetailPage />} />
        <Route
          path="warranty/:claimId/schedule"
          element={<ScheduleWarrantyModal />}
        />
        <Route
          path="warranty/:claimId/complete"
          element={<CompleteWarrantyPage />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/worker" replace />} />
    </Routes>
  );
}

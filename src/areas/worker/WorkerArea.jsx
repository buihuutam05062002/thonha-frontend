import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "../../auth/RequireAuth";
import LandingWorker from "../../pages/worker/LandingWorker";
import RegisterWorkerProfilePage from "../../pages/worker/RegisterWorkerProfilePage";
import WorkerDashboard from "../../pages/worker/WorkerDashboard";
import WorkerEarningsPage from "../../pages/worker/WorkerEarningsPage";

export default function WorkerArea() {
  return (
    <Routes>
      <Route index element={<LandingWorker />} />
      {/* Đăng ký / nộp lại hồ sơ */}
      <Route element={<RequireAuth redirectTo="/worker" />}>
        <Route path="register" element={<RegisterWorkerProfilePage />} />
      </Route>
      {/* Khu vực làm việc không đủ quyền thì về trang giới thiệu để đăng ký */}
      <Route element={<RequireAuth roles={["WORKER"]} redirectTo="/worker" />}>
        <Route path="dashboard" element={<WorkerDashboard />} />
        <Route path="earnings" element={<WorkerEarningsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/worker" replace />} />
    </Routes>
  );
}

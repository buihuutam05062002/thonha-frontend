import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "../../auth/RequireAuth";
import AdminLayout from "../../layouts/AdminLayout";
import UserManagement from "../../pages/admin/user-management/UserManagement";
import WorkerApprovalPage from "../../pages/admin/worker-approval/WorkerApprovalPage";
import WalletManagementPage from "../../pages/admin/wallets/WalletManagementPage";
import CommissionPage from "../../pages/admin/commissions/CommissionPage";
import ComplaintPage from "../../pages/admin/complaints/ComplaintPage";
import OverviewPage from "../../pages/admin/overview/OverviewPage";
import CategoryPage from "../../pages/admin/categories/CategoryPage";
import StatisticsPage from "../../pages/admin/statistics/StatisticsPage";

export default function AdminArea() {
  return (
    <Routes>
      <Route element={<RequireAuth roles={["ADMIN"]} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="categories" element={<CategoryPage />} />
          <Route path="profiles" element={<WorkerApprovalPage />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="wallets" element={<WalletManagementPage />} />
          <Route path="commissions" element={<CommissionPage />} />
          <Route path="complaints" element={<ComplaintPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          {/* Đường dẫn chưa có trang (gõ tay/bookmark cũ) -> về trang mặc định thay vì trang trống */}
          <Route path="*" element={<Navigate to="/admin/profiles" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

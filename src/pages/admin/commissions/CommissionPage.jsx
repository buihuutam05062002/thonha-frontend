import { useState } from "react";
import CommissionReport from "./CommissionReport";
import CommissionPolicies from "./CommissionPolicies";
import "../worker-approval/WorkerApprovalPage.css"; // khung trang + tab dạng viên thuốc dùng chung
import "../user-management/UserManagement.css"; // style phân trang dùng chung
import "./Commission.css";

const TABS = [
  { value: "report", label: "Báo cáo hoa hồng" },
  { value: "policies", label: "Tỷ lệ hoa hồng" },
];

export default function CommissionPage() {
  const [tab, setTab] = useState("report");

  return (
    <section className="wa-page">
      <header className="wa-header">
        <h1>Hoa hồng</h1>
        <p>Theo dõi doanh thu, hoa hồng thu được và cấu hình tỷ lệ áp dụng cho các đơn hoàn thành</p>
      </header>

      <div className="cm-panel">
        <div className="wa-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              className={tab === t.value ? "active" : ""}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "report" ? <CommissionReport /> : <CommissionPolicies />}
      </div>
    </section>
  );
}

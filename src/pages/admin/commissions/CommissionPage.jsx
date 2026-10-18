import { useState } from "react";
import { PageShell, Tabs } from "../../../components/admin/ui";
import CommissionReport from "./CommissionReport";
import CommissionPolicies from "./CommissionPolicies";

const TABS = [
  { value: "report", label: "Báo cáo hoa hồng" },
  { value: "policies", label: "Tỷ lệ hoa hồng" },
];

export default function CommissionPage() {
  const [tab, setTab] = useState("report");

  return (
    <PageShell title="Hoa hồng" subtitle="Theo dõi doanh thu, hoa hồng thu được và cấu hình tỷ lệ áp dụng cho các đơn hoàn thành">
      <Tabs items={TABS} value={tab} onChange={setTab} label="Hoa hồng" />
      {tab === "report" ? <CommissionReport /> : <CommissionPolicies />}
    </PageShell>
  );
}

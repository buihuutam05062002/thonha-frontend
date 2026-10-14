import { Card, Badge } from "react-bootstrap";
import { Wrench } from "lucide-react";
import { IconAC, IconElec, IconPaint, IconPlumbing } from "../../icon/Index";
import { formatDayTime, formatVnd } from "../../../utils/format";

const STATUS_CONFIG = {
  MATCHED: { bg: "info", text: "info", dot: "#0DCAF0" },
  ON_THE_WAY: { bg: "warning", text: "dark", dot: "#F59E0B" },
  ARRIVED: { bg: "info", text: "info", dot: "#0DCAF0" },
  IN_PROGRESS: { bg: "warning", text: "dark", dot: "#F5820D" },
  COMPLETED: { bg: "success", text: "success", dot: "#22C55E" },
  CANCELLED: { bg: "secondary", text: "secondary", dot: "#9CA3AF" },
};

function categoryIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("điện")) return { icon: <IconElec />, bg: "#FFF7ED" };
  if (n.includes("nước") || n.includes("ống")) return { icon: <IconPlumbing />, bg: "#EFF6FF" };
  if (n.includes("sơn")) return { icon: <IconPaint />, bg: "#F5F3FF" };
  if (n.includes("lạnh") || n.includes("điều hòa") || n.includes("điều hoà")) return { icon: <IconAC />, bg: "#ECFEFF" };
  return { icon: <Wrench size={20} color="#F5820D" />, bg: "#FFF4E6" };
}

export function OrderCard({ order, onClick }) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.MATCHED;
  const { icon, bg } = categoryIcon(order.categoryName);
  const done = order.status === "COMPLETED" && order.price != null;

  return (
    <Card className="border-0 shadow-sm rounded-4"
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          style={onClick ? { cursor: "pointer" } : undefined}
          onClick={onClick}
          onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}>
      <Card.Body className="p-3 d-flex align-items-center gap-3">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
             style={{ width: 44, height: 44, backgroundColor: bg }}>
          {icon}
        </div>

        <div className="flex-grow-1 min-width-0">
          <p className="mb-0 fw-bold text-dark text-truncate small">
            {order.customerName} <span className="text-muted">|</span> {order.categoryName}
          </p>
          <p className="mb-0 text-muted text-truncate" style={{ fontSize: 12 }}>{order.addressText || "-"}</p>
          <p className="mb-0 text-muted" style={{ fontSize: 11 }}>
            {formatDayTime(order.createdAt)}{done && <> | <b className="text-success">{formatVnd(order.price)}</b></>}
          </p>
        </div>

        <Badge bg={status.bg}
               className={`bg-opacity-10 text-${status.text} rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1 flex-shrink-0`}
               style={{ fontSize: 11 }}>
          <span className="rounded-circle d-inline-block" style={{ width: 6, height: 6, backgroundColor: status.dot }} />
          {order.statusLabel}
        </Badge>
      </Card.Body>
    </Card>
  );
}

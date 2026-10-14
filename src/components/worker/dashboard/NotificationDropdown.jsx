import { Card, Badge } from "react-bootstrap";
import { formatRelative, formatVnd } from "../../../utils/format";

/** Thông báo được suy ra từ dữ liệu dashboard thật (chưa có kênh thông báo riêng ở backend). */
function buildItems(incoming, orders) {
  const items = [];
  incoming.forEach((r) =>
    items.push({
      key: `in-${r.matchingLogId}`,
      msg: `Yêu cầu mới: ${r.categoryName} từ ${r.customerName}${r.addressText ? ` tại ${r.addressText}` : ""}.`,
      at: r.sentAt,
      unread: true,
    })
  );
  orders
    .filter((o) => ["COMPLETED", "CANCELLED", "MATCHED"].includes(o.status))
    .forEach((o) =>
      items.push({
        key: `or-${o.id}`,
        msg:
          o.status === "COMPLETED"
            ? `Đơn #${o.requestCode} đã hoàn thành${o.price != null ? `, thu nhập ${formatVnd(o.price)}` : ""}.`
            : o.status === "CANCELLED"
            ? `Khách đã hủy đơn #${o.requestCode} (${o.categoryName}).`
            : `Bạn đã nhận đơn #${o.requestCode} (${o.categoryName}).`,
        at: o.updatedAt || o.createdAt,
      })
    );
  return items.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
}

export function NotificationDropdown({ incoming, orders, onClose }) {
  const items = buildItems(incoming, orders);
  return (
    <>
      <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1040 }} onClick={onClose} />
      <Card className="position-fixed border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ top: "65px", right: "20px", width: "min(340px, calc(100vw - 40px))", zIndex: 1050 }}>
        <Card.Header className="bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
          <span className="fw-bold text-dark small">Thông báo</span>
          {incoming.length > 0 && <Badge bg="danger" pill>{incoming.length} mới</Badge>}
        </Card.Header>
        <div className="list-group list-group-flush" style={{ maxHeight: 360, overflowY: "auto" }}>
          {items.length === 0 && <p className="text-center text-muted small p-4 mb-0">Chưa có thông báo nào</p>}
          {items.map((n) => (
            <div key={n.key} className="list-group-item p-3 border-bottom-0">
              <p className={`mb-1 small ${n.unread ? "fw-semibold text-dark" : "text-dark"}`}>{n.msg}</p>
              <span className="text-muted" style={{ fontSize: "10px" }}>{formatRelative(n.at, { fallback: "", maxDays: 7 })}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

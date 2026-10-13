import { OrderCard } from "./OrderCard";

export function RecentOrders({ orders, onSelect }) {
  return (
    <div className="mb-4">
      <h6 className="fw-bold mb-3 text-dark">Đơn hàng gần đây</h6>
      {orders.length === 0 ? (
        <div className="bg-white rounded-4 shadow-sm text-center text-muted small p-4">
          Chưa có đơn nào. Hãy bật trạng thái <b>Sẵn sàng</b> để bắt đầu nhận việc.
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {orders.map((o) => <OrderCard key={o.id} order={o} onClick={onSelect ? () => onSelect(o.id) : undefined} />)}
        </div>
      )}
    </div>
  );
}

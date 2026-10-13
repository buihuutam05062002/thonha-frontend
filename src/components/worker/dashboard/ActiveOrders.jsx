import { Button } from "react-bootstrap";
import { OrderCard } from "./OrderCard";
import { NEXT_STEP } from "./orderFlow";

export function ActiveOrders({ orders, onSelect }) {
  if (!orders?.length) return null;
  return (
    <div className="mb-4">
      <h6 className="fw-bold mb-3 text-dark">Đơn đang thực hiện</h6>
      <div className="d-flex flex-column gap-2">
        {orders.map((o) => (
          <div key={o.id}>
            <OrderCard order={o} onClick={() => onSelect(o.id)} />
            {NEXT_STEP[o.status] && (
              <Button size="sm" variant="dark" className="rounded-pill mt-2 ms-2" onClick={() => onSelect(o.id)}>
                {NEXT_STEP[o.status].label}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { Card } from "react-bootstrap";

export function StatCard({ value, label, sub }) {
  return (
    <Card className="border-0 shadow-sm rounded-4 h-100">
      <Card.Body className="p-4 d-flex flex-column justify-content-between">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="fs-3 fw-bold text-dark">{value}</span>
          {sub}
        </div>
        <span className="text-muted small font-weight-medium">{label}</span>
      </Card.Body>
    </Card>
  );
}

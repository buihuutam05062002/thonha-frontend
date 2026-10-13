import { useEffect, useState } from "react";
import { Card, Badge, Button, Spinner } from "react-bootstrap";
import { MapPin, Clock, User } from "lucide-react";

const secondsUntil = (iso) => Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));

function useCountdown(expiresAt) {
  const [left, setLeft] = useState(() => secondsUntil(expiresAt));
  useEffect(() => {
    const tick = () => setLeft(secondsUntil(expiresAt));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return left;
}

const PRIORITY_BG = { URGENT: "danger", HIGH: "warning", MEDIUM: "info", LOW: "secondary" };

function RequestCard({ req, busy, onRespond }) {
  const left = useCountdown(req.expiresAt);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const expired = left === 0;

  return (
    <Card className="border-0 shadow-sm rounded-4" style={{ borderLeft: "4px solid #F5820D" }}>
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div className="min-width-0">
            <p className="fw-bold text-dark mb-0">{req.categoryName}</p>
            <p className="text-muted mb-0" style={{ fontSize: 11 }}>#{req.requestCode}</p>
          </div>
          <div className="d-flex flex-column align-items-end gap-1">
            <Badge bg={PRIORITY_BG[req.priority] ?? "secondary"} className="rounded-pill">{req.priorityLabel}</Badge>
            <span className={`small fw-semibold d-flex align-items-center gap-1 ${left < 60 ? "text-danger" : "text-muted"}`}>
              <Clock size={13} /> {expired ? "Hết hạn" : `${mm}:${ss}`}
            </span>
          </div>
        </div>

        <p className="small text-dark mb-2" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {req.description}
        </p>
        <div className="small text-muted d-flex flex-column gap-1 mb-3">
          <span className="d-flex align-items-center gap-2"><User size={13} /> {req.customerName}</span>
          <span className="d-flex align-items-center gap-2"><MapPin size={13} /> {req.addressText || "Chưa có địa chỉ"}</span>
        </div>

        <div className="d-flex gap-2">
          <Button variant="light" className="flex-fill rounded-pill fw-semibold"
                  disabled={busy || expired} onClick={() => onRespond(req, "REJECTED")}>
            Từ chối
          </Button>
          <Button className="flex-fill rounded-pill fw-semibold border-0" style={{ background: "#F5820D" }}
                  disabled={busy || expired} onClick={() => onRespond(req, "ACCEPTED")}>
            {busy ? <Spinner size="sm" animation="border" /> : "Nhận việc"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export function IncomingRequests({ requests, busyId, error, onRespond }) {
  if (requests.length === 0 && !error) return null;
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <h6 className="fw-bold mb-0 text-dark">Yêu cầu mới</h6>
        <Badge bg="danger" pill>{requests.length}</Badge>
      </div>
      {error && <p className="small text-danger">{error}</p>}
      <div className="d-flex flex-column gap-3">
        {requests.map((r) => (
          <RequestCard key={r.matchingLogId} req={r} busy={busyId === r.matchingLogId} onRespond={onRespond} />
        ))}
      </div>
    </div>
  );
}

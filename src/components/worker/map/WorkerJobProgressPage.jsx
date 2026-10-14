import React from "react";
import { Button, Card } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

export default function WorkerJobProgressPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  // TODO: job progress management (ARRIVED -> IN_PROGRESS -> COMPLETED)
  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light p-3">
      <Card
        className="border-0 shadow-sm rounded-4 p-4 text-center"
        style={{ maxWidth: "400px" }}
      >
        <h5 className="fw-bold mb-2">Quản lý tiến độ công việc</h5>
        <p className="text-secondary small mb-3">
          Đơn #{requestId}: bạn đã đến nơi.
        </p>
        <Button
          variant="light"
          className="rounded-3 fw-bold text-secondary"
          onClick={() => navigate("/worker/dashboard")}
        >
          Về trang chủ
        </Button>
      </Card>
    </div>
  );
}

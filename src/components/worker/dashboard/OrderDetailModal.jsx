import { useEffect, useState } from "react";
import { Modal, Spinner, Button, Form } from "react-bootstrap";
import { parseApiError } from "../../../api/apiError";
import { getWorkerRequestDetail, updateRequestStatus } from "../../../api/workerApi";
import { formatDayTime, formatVnd } from "../../../utils/format";
import { NEXT_STEP } from "./orderFlow";
import ChatBox from "../../chat/ChatBox";
import QuotationPanel from "../../chat/QuotationPanel";
import ReviewPanel from "../../chat/ReviewPanel";
import ComplaintPanel from "../../chat/ComplaintPanel";

const PRIORITY = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", URGENT: "Khẩn cấp" };
const STATUS_LABEL = {
  MATCHED: "Đã ghép thợ",
  ON_THE_WAY: "Đang di chuyển",
  IN_PROGRESS: "Đang sửa chữa",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

function Row({ label, children }) {
  return (
    <div className="mb-3">
      <div className="text-muted text-uppercase fw-bold" style={{ fontSize: 11, letterSpacing: "0.5px" }}>{label}</div>
      <div className="text-dark" style={{ whiteSpace: "pre-wrap" }}>{children || "-"}</div>
    </div>
  );
}

export function OrderDetailModal({ orderId, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setLoadError(null);
    setActionError(null);
    setPrice("");
    getWorkerRequestDetail(orderId)
      .then((d) => { if (!cancelled) setDetail(d); })
      .catch((err) => {
        if (!cancelled) setLoadError(parseApiError(err).message || "Không tải được chi tiết đơn.");
      });
    return () => { cancelled = true; };
  }, [orderId]);

  const next = detail ? NEXT_STEP[detail.status] : null;
  const completing = next?.to === "COMPLETED";

  const advance = async () => {
    if (!next || saving) return;
    if (completing && price !== "" && (Number.isNaN(Number(price)) || Number(price) < 0)) {
      setActionError("Giá không hợp lệ.");
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      const updated = await updateRequestStatus(detail.id, next.to, price);
      setDetail(updated);
      onChanged?.();
    } catch (err) {
      setActionError(parseApiError(err).message || "Không cập nhật được trạng thái, vui lòng thử lại.");
      onChanged?.(); 
    } finally {
      setSaving(false);
    }
  };

  const attachments = detail?.attachments ?? [];
  const mapUrl = detail?.lat != null && detail?.lng != null
    ? `https://www.google.com/maps?q=${detail.lat},${detail.lng}`
    : null;

  return (
    <Modal show onHide={onClose} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">
          Chi tiết đơn {detail?.requestCode ? `#${detail.requestCode}` : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!detail && !loadError && <div className="text-center py-4"><Spinner animation="border" style={{ color: "#F5820D" }} /></div>}
        {loadError && <p className="text-danger small mb-0">{loadError}</p>}
        {detail && (
          <>
            <Row label="Trạng thái">{STATUS_LABEL[detail.status] ?? detail.status}</Row>
            <Row label="Khách hàng">{detail.customerName}</Row>
            <Row label="Dịch vụ">{detail.categoryName}{detail.priorityLevel ? ` | Ưu tiên: ${PRIORITY[detail.priorityLevel] ?? detail.priorityLevel}` : ""}</Row>
            <Row label="Địa chỉ">
              {detail.addressText}
              {mapUrl && <> <a href={mapUrl} target="_blank" rel="noreferrer" className="small">Xem bản đồ</a></>}
            </Row>
            <Row label="Mô tả sự cố">{detail.description}</Row>
            {attachments.length > 0 && (
              <div className="mb-3">
                <div className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: 11, letterSpacing: "0.5px" }}>Ảnh / video đính kèm</div>
                <div className="d-flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                      {String(a.type).toUpperCase().includes("VIDEO")
                        ? <span className="badge bg-secondary">Video</span>
                        : <img src={a.url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <Row label="Tạo lúc">{formatDayTime(detail.createdAt)}</Row>
            {detail.status === "COMPLETED" && detail.finalPrice != null && (
              <Row label="Giá thực tế"><b className="text-success">{formatVnd(detail.finalPrice)}</b></Row>
            )}

            {completing && (
              <Form.Group className="mt-2">
                <Form.Label className="small fw-semibold">Giá thực tế (đ) - không bắt buộc</Form.Label>
                <Form.Control type="number" min="0" step="1000" placeholder="VD: 350000"
                              value={price} onChange={(e) => setPrice(e.target.value)} disabled={saving} />
                <Form.Text className="text-muted">Số tiền này sẽ được tính vào thu nhập của bạn.</Form.Text>
              </Form.Group>
            )}
            {detail.status === "COMPLETED" && <ReviewPanel requestId={detail.id} role="worker" />}
            {["MATCHED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED"].includes(detail.status) && (
              <ComplaintPanel requestId={detail.id} role="worker" />
            )}
            {["MATCHED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED"].includes(detail.status) && (
              <QuotationPanel
                requestId={detail.id}
                role="worker"
                active={detail.status !== "COMPLETED"}
                onLoaded={(list) => {
                  const accepted = list.find((q) => q.status === "ACCEPTED");
                  if (accepted) setPrice((p) => p || String(Math.round(Number(accepted.totalAmount))));
                }}
              />
            )}
            {(detail.status === "MATCHED" || detail.status === "ON_THE_WAY" || detail.status === "IN_PROGRESS") && (
              <ChatBox requestId={detail.id} />
            )}
            {actionError && <p className="text-danger small mt-3 mb-0">{actionError}</p>}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose}>Đóng</Button>
        {next && (
          <Button variant="dark" onClick={advance} disabled={saving}>
            {saving ? "Đang cập nhật..." : next.label}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

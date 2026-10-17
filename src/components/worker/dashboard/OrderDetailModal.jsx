import { useEffect, useState } from "react";
import { Modal, Spinner, Button} from "react-bootstrap";
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

/** Chi tiết đơn của thợ + nút chuyển sang bước kế tiếp (nhập giá khi hoàn thành). */
export function OrderDetailModal({ orderId, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [quoteSummary, setQuoteSummary] = useState({ accepted: 0, pending: 0 });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setLoadError(null);
    setActionError(null);
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
    setSaving(true);
    setActionError(null);
    try {
      const updated = await updateRequestStatus(detail.id, next.to);
      setDetail(updated);
      onChanged?.();
    } catch (err) {
      setActionError(parseApiError(err).message || "Không cập nhật được trạng thái, vui lòng thử lại.");
      onChanged?.(); // trạng thái có thể đã đổi ở nơi khác
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
                <div className="border rounded-3 bg-light small p-2 mt-2">
                  <div>Tổng báo giá khách đã chấp nhận: <b>{formatVnd(quoteSummary.accepted)}</b></div>
                  {quoteSummary.pending > 0 && (
                      <div className="text-warning-emphasis mt-1">
                        Còn {quoteSummary.pending} báo giá chờ khách phản hồi, sẽ không được tính nếu bạn hoàn thành đơn.
                      </div>
                  )}
                  {quoteSummary.accepted <= 0 && (
                      <div className="text-danger mt-1">Cần ít nhất một báo giá được khách chấp nhận mới hoàn thành được đơn.</div>
                  )}
                </div>
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
                onLoaded={(list) =>
                    setQuoteSummary({
                      accepted: list.filter((q) => q.status === "ACCEPTED").reduce((s, q) => s + Number(q.totalAmount), 0),
                      pending: list.filter((q) => q.status === "PENDING").length,
                    })
                }
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
            <Button variant="dark" onClick={advance} disabled={saving || (completing && quoteSummary.accepted <= 0)}>
            {saving ? "Đang cập nhật..." : next.label}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

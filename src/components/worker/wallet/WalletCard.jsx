import { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { getMyWallet } from "../../../api/walletApi";
import { IconWallet } from "../../icon/Index";
import { formatVnd } from "../../../utils/format";

/**
 * Thẻ số dư ví trên bảng điều khiển. `refreshKey` đổi (vd: dashboard vừa tải lại sau khi hoàn thành đơn)
 * thì tải lại số dư để thợ thấy hoa hồng vừa bị trừ.
 */
export function WalletCard({ refreshKey, onOpen }) {
  const [wallet, setWallet] = useState(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMyWallet()
      .then((w) => { if (!cancelled) { setWallet(w); setFailed(false); } })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [refreshKey, retry]);

  // lỗi mạng thoáng qua khi đã có số dư cũ thì giữ số dư cũ, không làm phiền thợ
  if (failed && !wallet) {
    return (
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-3 d-flex align-items-center justify-content-between small text-muted">
          Không tải được số dư ví.
          <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setRetry((n) => n + 1)}>Thử lại</button>
        </Card.Body>
      </Card>
    );
  }
  if (!wallet) return null;

  const blocked = !wallet.canReceiveJobs;
  const negative = Number(wallet.balance) < 0;

  return (
    <Card
      className={`border-0 shadow-sm rounded-4 mb-4 button-card ${blocked ? "border border-danger" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      aria-label={`Số dư ví ${formatVnd(wallet.balance)}. Xem lịch sử giao dịch`}
    >
      <Card.Body className="p-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 48, height: 48, backgroundColor: "#FFF4E6" }}
          >
            <IconWallet />
          </div>
          <div className="flex-grow-1">
            <div className="text-muted small">Số dư ví hoa hồng</div>
            <div className="fs-4 fw-bold" style={{ color: negative ? "#dc3545" : "#212529" }}>
              {formatVnd(wallet.balance)}
            </div>
          </div>
          <span className="text-muted small d-none d-sm-inline">Lịch sử</span>
          <ChevronRight size={18} className="text-muted" aria-hidden="true" />
        </div>

        {blocked && (
          <div className="d-flex gap-2 align-items-start mt-3 small text-danger" role="alert">
            <AlertTriangle size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
            <span>
              Số dư thấp hơn mức tối thiểu ({formatVnd(wallet.minBalanceToReceiveJobs)}), bạn tạm thời chưa nhận được đơn mới.
              Vui lòng nộp hoa hồng cho công ty để được nạp ví.
            </span>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Modal, Spinner, Button } from "react-bootstrap";
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, Plus } from "lucide-react";
import { parseApiError } from "../../../api/apiError";
import { getMyWallet, getMyWalletTransactions, isCredit, txnLabel } from "../../../api/walletApi";
import { formatDateTime, formatSignedVnd, formatVnd } from "../../../utils/format";
import { TopUpPanel } from "./TopUpPanel";
import "./TopUpPanel.css";

const ACCENT = "#F5820D";
const PAGE_SIZE = 15;

export function WalletModal({ onClose, onChanged }) {
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [moreError, setMoreError] = useState(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  // Dùng chuỗi .then để setState chỉ nằm trong callback bất đồng bộ (rule react-hooks/set-state-in-effect).
  const load = useCallback(() => {
    return getMyWallet()
        .then((w) => {
          setWallet(w);
          if (w.walletId == null) {
            setTxns([]);
            setHasMore(false);
            setNextPage(0);
            return null;
          }
          return getMyWalletTransactions({ page: 0, size: PAGE_SIZE }).then((res) => {
            setTxns(res.content);
            setHasMore(res.number + 1 < res.totalPages);
            setNextPage(1);
          });
        })
        .catch((e) => setError(parseApiError(e).message || "Không tải được thông tin ví."))
        .finally(() => setLoading(false));
  }, []);

  // Tải lại từ nút "Thử lại" / sau khi nạp tiền (chạy trong event handler nên được phép setState ngay)
  const reload = () => {
    setLoading(true);
    setError(null);
    load();
  };

  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    setMoreError(null);
    try {
      const res = await getMyWalletTransactions({ page: nextPage, size: PAGE_SIZE });
      setTxns((cur) => {
        const seen = new Set(cur.map((t) => t.id));
        return [...cur, ...res.content.filter((t) => !seen.has(t.id))];
      });
      setHasMore(res.number + 1 < res.totalPages);
      setNextPage((n) => n + 1);
    } catch (e) {
      setMoreError(parseApiError(e).message || "Không tải thêm được giao dịch.");
    } finally {
      setLoadingMore(false);
    }
  };

  const negative = wallet && Number(wallet.balance) < 0;
  const blocked = wallet && !wallet.canReceiveJobs;

  return (
      <Modal show onHide={onClose} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">{topUpOpen ? "Nạp tiền vào ví" : "Ví hoa hồng"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading && (
              <div className="text-center py-5"><Spinner animation="border" style={{ color: ACCENT }} /></div>
          )}

          {!loading && error && (
              <div className="alert alert-danger small" role="alert">
                {error}{" "}
                <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={reload}>Thử lại</button>
              </div>
          )}

          {!loading && wallet && topUpOpen && (
              <TopUpPanel
                  onCancel={() => setTopUpOpen(false)}
                  onPaid={() => { setTopUpOpen(false); onChanged?.(); reload(); }}
              />
          )}
          {!loading && wallet && !topUpOpen && (
              <>
                <div
                    className="rounded-4 p-4 mb-3 text-white"
                    style={{ background: negative ? "linear-gradient(135deg,#dc3545,#b02a37)" : `linear-gradient(135deg,#FFA94D,${ACCENT})` }}
                >
                  <div className="small opacity-75">Số dư hiện tại</div>
                  <div className="fw-bold" style={{ fontSize: 30, lineHeight: 1.2 }}>{formatVnd(wallet.balance)}</div>
                  <div className="small opacity-75 mt-1">
                    Mức tối thiểu để nhận đơn: {formatVnd(wallet.minBalanceToReceiveJobs)}
                  </div>
                  <button type="button" className="wm-topup-btn"
                          onClick={() => setTopUpOpen(true)}>
                    <Plus size={16} aria-hidden="true" /> Nạp tiền
                  </button>
                </div>

                {blocked ? (
                    <div className="alert alert-danger small d-flex gap-2 align-items-start" role="alert">
                      <AlertTriangle size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
                      <span>
                  Số dư ví đang thấp hơn mức tối thiểu nên bạn <b>tạm thời chưa nhận được đơn mới</b>.
                  Hãy bấm <b>Nạp tiền</b> và quét mã QR để nạp vào ví, hệ thống tự cộng tiền ngay khi nhận được.
                </span>
                    </div>
                ) : (
                    <p className="small text-muted mb-3">
                      Khách trả tiền trực tiếp cho bạn; hoa hồng của mỗi đơn được trừ vào ví khi đơn hoàn thành. Số dư thấp hơn mức tối thiểu thì bạn sẽ không nhận được đơn mới, hãy nạp thêm tiền bằng nút "Nạp tiền".
                    </p>
                )}

                <h6 className="fw-bold small text-uppercase text-muted mb-2" style={{ letterSpacing: "0.5px" }}>
                  Lịch sử giao dịch
                </h6>

                {txns.length === 0 ? (
                    <p className="text-center text-muted small py-4 mb-0">Chưa có giao dịch nào</p>
                ) : (
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                      {txns.map((t) => {
                        const credit = isCredit(t);
                        return (
                            <li key={t.id} className="d-flex align-items-center gap-3 border rounded-3 p-2 px-3">
                      <span
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 36, height: 36, background: credit ? "#E6F6EC" : "#FDECEC", color: credit ? "#1e7e34" : "#b02a37" }}
                          aria-hidden="true"
                      >
                        {credit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </span>
                              <div className="flex-grow-1 min-width-0">
                                <div className="fw-semibold small">{txnLabel(t)}</div>
                                {t.note && <div className="text-muted small text-break">{t.note}</div>}
                                <div className="text-muted" style={{ fontSize: 11 }}>{formatDateTime(t.createdAt)}</div>
                              </div>
                              <div className="text-end flex-shrink-0">
                                <div className="fw-bold small" style={{ color: credit ? "#1e7e34" : "#b02a37" }}>
                                  {formatSignedVnd(t.amount)}
                                </div>
                                <div className="text-muted" style={{ fontSize: 11 }}>Dư {formatVnd(t.balanceAfter)}</div>
                              </div>
                            </li>
                        );
                      })}
                    </ul>
                )}

                {moreError && <p className="text-danger small mt-2 mb-0">{moreError}</p>}
                {hasMore && (
                    <div className="d-grid mt-3">
                      <Button variant="outline-secondary" size="sm" disabled={loadingMore} onClick={loadMore}>
                        {loadingMore ? "Đang tải..." : "Xem thêm"}
                      </Button>
                    </div>
                )}
              </>
          )}
        </Modal.Body>
      </Modal>
  );
}

import { useState } from "react";
import { Phone, PlusCircle, SlidersHorizontal, CheckCircle2, AlertTriangle } from "lucide-react";
import { isCredit, txnLabel } from "../../../api/walletApi";
import { formatDateTime, formatSignedVnd, formatVnd } from "../../../utils/format";
import Pagination from "../user-management/Pagination";
import { AdjustForm, TopUpForm } from "./WalletForms";

function TransactionList({ txns, loading, error, page, onPage }) {
  if (loading && txns.content.length === 0) {
    return (
      <ul className="wl-txns" aria-busy="true">
        {[0, 1, 2].map((i) => <li key={i} className="wl-txn wa-skeleton" />)}
      </ul>
    );
  }
  if (error) return <p className="wa-empty wa-error" role="alert">{error}</p>;
  if (txns.content.length === 0) return <p className="wa-empty">Ví chưa có giao dịch nào</p>;

  return (
    <>
      <ul className={`wl-txns ${loading ? "is-loading" : ""}`}>
        {txns.content.map((t) => {
          const credit = isCredit(t);
          return (
            <li key={t.id} className="wl-txn">
              <div className="wl-txn-main">
                <span className={`wl-badge ${credit ? "wl-in" : "wl-out"}`}>{txnLabel(t)}</span>
                <p className="wl-txn-note">
                  {t.note || "-"}
                  {t.requestId != null && <small> | Đơn #{t.requestId}</small>}
                </p>
                <small className="wl-txn-time">
                  {formatDateTime(t.createdAt)} | {t.createdBy != null ? `Admin #${t.createdBy}` : "Hệ thống"}
                </small>
              </div>
              <div className="wl-txn-amt">
                <b className={credit ? "wl-in-text" : "wl-out-text"}>{formatSignedVnd(t.amount)}</b>
                <small>Số dư: {formatVnd(t.balanceAfter)}</small>
              </div>
            </li>
          );
        })}
      </ul>
      <Pagination page={page} totalPages={txns.totalPages} onChange={onPage} />
    </>
  );
}

/** Chi tiết một ví: số dư, nạp tiền / điều chỉnh, sổ cái giao dịch. Mount lại (key) khi đổi thợ để đóng form. */
export default function WalletDetail({
  wallet, loading, error, txns, txLoading, txError, txPage, onTxPage, onTopUp, onAdjust,
}) {
  const [mode, setMode] = useState(null); // null | "topup" | "adjust"

  if (loading && !wallet) {
    return <aside className="wa-detail wa-empty" aria-busy="true">Đang tải ví...</aside>;
  }
  if (error) return <aside className="wa-detail wa-empty wa-error" role="alert">{error}</aside>;
  if (!wallet) return <aside className="wa-detail wa-empty">Chọn một ví để xem chi tiết</aside>;

  const negative = Number(wallet.balance) < 0;

  return (
    <aside className="wa-detail">
      <div className="wa-detail-header">
        <h2>Chi tiết ví <small>#{wallet.workerId}</small></h2>
      </div>

      <div className="wa-profile-card">
        <span className="wa-avatar wa-avatar-lg wa-avatar-fallback">{wallet.workerName?.[0]?.toUpperCase() ?? "?"}</span>
        <div className="wa-profile-main">
          <strong>{wallet.workerName}</strong>
          <div className="wa-contact">
            <span><Phone size={13} /> {wallet.workerPhone || "-"}</span>
          </div>
        </div>
      </div>

      <div className={`wl-balance-card ${negative ? "is-negative" : ""}`}>
        <span>Số dư hiện tại</span>
        <strong>{formatVnd(wallet.balance)}</strong>
        <p className={wallet.canReceiveJobs ? "wl-ok" : "wl-blocked"}>
          {wallet.canReceiveJobs
            ? <><CheckCircle2 size={14} /> Đang đủ điều kiện nhận đơn</>
            : <><AlertTriangle size={14} /> Đang bị tạm ngừng nhận đơn mới</>}
        </p>
        <small>Mức tối thiểu để nhận đơn: {formatVnd(wallet.minBalanceToReceiveJobs)}</small>
      </div>

      {mode === null && (
        <div className="wl-action-row">
          <button type="button" className="wl-action wl-action-primary" onClick={() => setMode("topup")}>
            <PlusCircle size={15} /> Nạp tiền
          </button>
          <button type="button" className="wl-action" onClick={() => setMode("adjust")}>
            <SlidersHorizontal size={15} /> Điều chỉnh
          </button>
        </div>
      )}
      {mode === "topup" && <TopUpForm wallet={wallet} onSubmit={onTopUp} onClose={() => setMode(null)} />}
      {mode === "adjust" && <AdjustForm wallet={wallet} onSubmit={onAdjust} onClose={() => setMode(null)} />}

      <section className="wa-section">
        <h3>Lịch sử giao dịch <small>({txns.totalElements ?? 0})</small></h3>
        <TransactionList txns={txns} loading={txLoading} error={txError} page={txPage} onPage={onTxPage} />
      </section>
    </aside>
  );
}

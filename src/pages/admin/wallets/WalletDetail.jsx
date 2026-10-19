import { useState } from "react";
import { Phone, PlusCircle, SlidersHorizontal, CheckCircle2, AlertTriangle } from "lucide-react";
import { isCredit, txnLabel } from "../../../api/walletApi";
import { formatDateTime, formatSignedVnd, formatVnd } from "../../../utils/format";
import {
  Avatar, Button, DetailHeader, DetailMessage, DetailPane, DetailSection, Empty, Pagination, StatusBadge, cn,
} from "../../../components/admin/ui";
import { AdjustForm, TopUpForm } from "./WalletForms";

function TransactionList({ txns, loading, error, page, onPage }) {
  if (loading && txns.content.length === 0) {
    return (
      <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-busy="true">
        {[0, 1, 2].map((i) => <li key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
      </ul>
    );
  }
  if (error) return <Empty error>{error}</Empty>;
  if (txns.content.length === 0) return <Empty>Ví chưa có giao dịch nào</Empty>;

  return (
    <>
      <ul className={cn("m-0 flex list-none flex-col gap-2 p-0 transition-opacity", loading && "opacity-60")}>
        {txns.content.map((t) => {
          const credit = isCredit(t);
          return (
            <li key={t.id} className="flex justify-between gap-12px rounded-xl border-[1px] border-line px-12px py-2.5">
              <div className="flex min-w-0 flex-col items-start gap-[3px]">
                <StatusBadge tone={credit ? "success" : "danger"}>{txnLabel(t)}</StatusBadge>
                <p className="m-0 break-words text-[12.5px] text-ink">
                  {t.note || "-"}
                  {t.requestId != null && <small className="text-[11.5px] text-subtle"> | Đơn #{t.requestId}</small>}
                </p>
                <small className="text-[11.5px] text-subtle">
                  {formatDateTime(t.createdAt)} | {t.createdBy != null ? `Admin #${t.createdBy}` : "Hệ thống"}
                </small>
              </div>
              <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
                <b className={cn("text-sm", credit ? "text-green-700" : "text-red-700")}>{formatSignedVnd(t.amount)}</b>
                <small className="text-[11px] text-subtle">Số dư: {formatVnd(t.balanceAfter)}</small>
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

  if (loading && !wallet) return <DetailMessage busy>Đang tải ví...</DetailMessage>;
  if (error) return <DetailMessage error>{error}</DetailMessage>;
  if (!wallet) return <DetailMessage>Chọn một ví để xem chi tiết</DetailMessage>;

  const negative = Number(wallet.balance) < 0;

  return (
    <DetailPane>
      <DetailHeader title="Chi tiết ví" sub={`#${wallet.workerId}`} />

      <div className="mb-16px flex gap-3.5">
        <Avatar size="lg" name={wallet.workerName} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <strong className="text-[17px] text-ink">{wallet.workerName}</strong>
          <span className="inline-flex items-center gap-1.5 break-all text-[12.5px] text-subtle">
            <Phone size={13} aria-hidden="true" /> {wallet.workerPhone || "-"}
          </span>
        </div>
      </div>

      <div className="mb-3.5 flex flex-col gap-1 rounded-[14px] border-[1px] border-line bg-surface px-16px py-3.5">
        <span className="text-xs text-subtle">Số dư hiện tại</span>
        <strong className={cn("text-[28px] leading-tight", negative ? "text-red-700" : "text-green-700")}>{formatVnd(wallet.balance)}</strong>
        <p className={cn("m-0 mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold", wallet.canReceiveJobs ? "text-green-700" : "text-red-700")}>
          {wallet.canReceiveJobs
            ? <><CheckCircle2 size={14} aria-hidden="true" /> Đang đủ điều kiện nhận đơn</>
            : <><AlertTriangle size={14} aria-hidden="true" /> Đang bị tạm ngừng nhận đơn mới</>}
        </p>
        <small className="text-[11.5px] text-subtle">Mức tối thiểu để nhận đơn: {formatVnd(wallet.minBalanceToReceiveJobs)}</small>
      </div>

      {mode === null && (
        <div className="mb-1 flex gap-2.5">
          <Button size="lg" className="flex-1" onClick={() => setMode("topup")}><PlusCircle size={15} aria-hidden="true" /> Nạp tiền</Button>
          <Button size="lg" variant="soft" className="flex-1" onClick={() => setMode("adjust")}><SlidersHorizontal size={15} aria-hidden="true" /> Điều chỉnh</Button>
        </div>
      )}
      {mode === "topup" && <TopUpForm wallet={wallet} onSubmit={onTopUp} onClose={() => setMode(null)} />}
      {mode === "adjust" && <AdjustForm wallet={wallet} onSubmit={onAdjust} onClose={() => setMode(null)} />}

      <DetailSection title="Lịch sử giao dịch" sub={`(${txns.totalElements ?? 0})`}>
        <TransactionList txns={txns} loading={txLoading} error={txError} page={txPage} onPage={onTxPage} />
      </DetailSection>
    </DetailPane>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Phone, Clock, AlertTriangle } from "lucide-react";
import { notify as showNotice } from "../../../utils/notify";
import {
  adjustWallet, fetchWallet, fetchWalletTransactions, fetchWallets, topUpWallet,
} from "../../../api/walletApi";
import { formatRelative, formatVnd } from "../../../utils/format";
import {
  Avatar, Button, Empty, FilterBar, ListCard, ListCardSkeleton, ListCards, ListPane, PageShell, Pagination,
  SearchBox, SplitPanel, cn,
} from "../../../components/admin/ui";
import WalletDetail from "./WalletDetail";

const EMPTY_PAGE = { content: [], totalPages: 0, totalElements: 0 };
const TX_PAGE_SIZE = 8;

export default function WalletManagementPage() {
  const [keywordInput, setKeywordInput] = useState("");
  const [filters, setFilters] = useState({ keyword: "", negativeOnly: false });
  const [page, setPage] = useState(0);

  const [list, setList] = useState(EMPTY_PAGE);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [selectedId, setSelectedId] = useState(null); // id hồ sơ thợ
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [txns, setTxns] = useState(EMPTY_PAGE);
  const [txPage, setTxPage] = useState(0);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");

  const [reloadKey, setReloadKey] = useState(0); 

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await fetchWallets({ ...filters, page });
      setList(res);
      setSelectedId((cur) => (res.content.some((w) => w.workerId === cur) ? cur : res.content[0]?.workerId ?? null));
    } catch (e) {
      setListError(e.message);
    } finally {
      setListLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { loadList(); }, [loadList]);


  useEffect(() => {
    if (!selectedId) { setDetail(null); return undefined; }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    fetchWallet(selectedId)
      .then((res) => { if (!cancelled) setDetail(res); })
      .catch((e) => { if (!cancelled) { setDetail(null); setDetailError(e.message); } })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId, reloadKey]);

  // sổ cái giao dịch
  useEffect(() => {
    if (!selectedId) { setTxns(EMPTY_PAGE); return undefined; }
    let cancelled = false;
    setTxLoading(true);
    setTxError("");
    fetchWalletTransactions(selectedId, { page: txPage, size: TX_PAGE_SIZE })
      .then((res) => { if (!cancelled) setTxns(res); })
      .catch((e) => { if (!cancelled) { setTxns(EMPTY_PAGE); setTxError(e.message); } })
      .finally(() => { if (!cancelled) setTxLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId, txPage, reloadKey]);

  const select = (id) => {
    if (id === selectedId) return;
    setDetail(null);
    setTxns(EMPTY_PAGE);
    setTxPage(0);
    setSelectedId(id);
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(0);
    setFilters((f) => ({ ...f, keyword: keywordInput }));
  };

  const toggleNegative = (checked) => {
    setPage(0);
    setFilters((f) => ({ ...f, negativeOnly: checked }));
  };

  const resetFilters = () => {
    setKeywordInput("");
    setPage(0);
    setFilters({ keyword: "", negativeOnly: false });
  };

  const afterChange = (message) => {
    showNotice("success", message);
    setTxPage(0);
    setReloadKey((k) => k + 1);
    loadList();
  };

  const handleTopUp = async (payload) => {
    await topUpWallet(selectedId, payload);
    afterChange(`Đã nạp ${formatVnd(payload.amount)} vào ví của ${detail?.workerName ?? "thợ"}.`);
  };

  const handleAdjust = async (payload) => {
    await adjustWallet(selectedId, payload);
    afterChange(`Đã điều chỉnh số dư ví của ${detail?.workerName ?? "thợ"}.`);
  };

  const hasFilter = filters.keyword || filters.negativeOnly;
  const shownDetail = detail?.workerId === selectedId ? detail : null;

  return (
    <PageShell title="Ví thợ" subtitle="Theo dõi số dư hoa hồng, nạp tiền khi thợ nộp và điều chỉnh khi có sai sót">
      <SplitPanel>
        <ListPane>
          <FilterBar first onSubmit={applyFilters}>
            <SearchBox
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại"
              aria-label="Từ khóa"
            />
            <Button type="submit">Tìm</Button>
            {(hasFilter || keywordInput) && <Button variant="ghost" className="underline" onClick={resetFilters}>Xóa lọc</Button>}
          </FilterBar>

          <label className="mb-3.5 flex cursor-pointer items-center gap-2 text-[12.5px] text-ink">
            <input
              type="checkbox"
              className="h-[15px] w-[15px] accent-brand"
              checked={filters.negativeOnly}
              onChange={(e) => toggleNegative(e.target.checked)}
            />
            Chỉ hiện ví đang âm (thợ còn nợ hoa hồng)
          </label>

          <WalletList wallets={list.content} loading={listLoading} error={listError} selectedId={selectedId} onSelect={select} />

          <Pagination page={page} totalPages={list.totalPages} onChange={(p) => { setPage(p); setSelectedId(null); }} />
        </ListPane>

        <WalletDetail
          key={selectedId ?? "none"}
          wallet={shownDetail}
          loading={detailLoading}
          error={detailError}
          txns={txns}
          txLoading={txLoading}
          txError={txError}
          txPage={txPage}
          onTxPage={setTxPage}
          onTopUp={handleTopUp}
          onAdjust={handleAdjust}
        />
      </SplitPanel>
    </PageShell>
  );
}

function WalletList({ wallets, loading, error, selectedId, onSelect }) {
  if (loading && wallets.length === 0) return <ListCardSkeleton />;
  if (error) return <Empty error>{error}</Empty>;
  if (wallets.length === 0) return <Empty>Không có ví nào phù hợp</Empty>;

  return (
    <ListCards loading={loading}>
      {wallets.map((w) => (
        <ListCard key={w.workerId} active={w.workerId === selectedId} onClick={() => onSelect(w.workerId)}>
          <Avatar name={w.workerName} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <strong className="min-w-0 truncate text-sm text-ink">{w.workerName}</strong>
              <b className={cn("whitespace-nowrap text-[13.5px]", Number(w.balance) < 0 ? "text-red-700" : "text-green-700")}>{formatVnd(w.balance)}</b>
            </div>
            <div className="flex flex-wrap gap-x-12px gap-y-1 text-[11.5px] text-subtle">
              <span className="inline-flex items-center gap-1"><Phone size={12} aria-hidden="true" /> {w.workerPhone || "-"}</span>
              <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" /> {formatRelative(w.updatedAt)}</span>
            </div>
            {!w.canReceiveJobs && (
              <div className="flex items-start gap-1.5 text-xs text-red-700"><AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> Tạm ngừng nhận đơn mới</div>
            )}
          </div>
        </ListCard>
      ))}
    </ListCards>
  );
}

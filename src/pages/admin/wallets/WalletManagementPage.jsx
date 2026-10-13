import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, Clock, Search, AlertTriangle, X } from "lucide-react";
import {
  adjustWallet, fetchWallet, fetchWalletTransactions, fetchWallets, topUpWallet,
} from "../../../api/walletApi";
import { formatRelative, formatVnd } from "../../../utils/format";
import Pagination from "../user-management/Pagination";
import WalletDetail from "./WalletDetail";
import "../user-management/UserManagement.css";
import "../worker-approval/WorkerApprovalPage.css"; 
import "./WalletManagement.css";

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
  const [notice, setNotice] = useState(null); 
  const noticeTimer = useRef(null);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 6000);
  };
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

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

  // chi tiết ví
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
    <section className="wa-page">
      <header className="wa-header">
        <h1>Ví thợ</h1>
        <p>Theo dõi số dư hoa hồng, nạp tiền khi thợ nộp và điều chỉnh khi có sai sót</p>
      </header>

      {notice && (
        <div className={`wa-notice wa-notice-${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} aria-label="Đóng thông báo"><X size={18} aria-hidden="true" /></button>
        </div>
      )}

      <div className="wa-panel">
        <div className="wa-list">
          <form className="wa-filters" onSubmit={applyFilters}>
            <div className="wa-search">
              <Search size={14} aria-hidden="true" />
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại"
                aria-label="Từ khóa"
              />
            </div>
            <button type="submit" className="wa-btn">Tìm</button>
            {(hasFilter || keywordInput) && (
              <button type="button" className="wa-btn wa-btn-ghost" onClick={resetFilters}>Xóa lọc</button>
            )}
          </form>

          <label className="wl-check">
            <input type="checkbox" checked={filters.negativeOnly} onChange={(e) => toggleNegative(e.target.checked)} />
            Chỉ hiện ví đang âm (thợ còn nợ hoa hồng)
          </label>

          <WalletList wallets={list.content} loading={listLoading} error={listError} selectedId={selectedId} onSelect={select} />

          <Pagination page={page} totalPages={list.totalPages} onChange={(p) => { setPage(p); setSelectedId(null); }} />
        </div>

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
      </div>
    </section>
  );
}

function WalletList({ wallets, loading, error, selectedId, onSelect }) {
  if (loading && wallets.length === 0) {
    return (
      <ul className="wa-cards" aria-busy="true">
        {[0, 1, 2, 3].map((i) => <li key={i} className="wa-card wa-skeleton" />)}
      </ul>
    );
  }
  if (error) return <p className="wa-empty wa-error" role="alert">{error}</p>;
  if (wallets.length === 0) return <p className="wa-empty">Không có ví nào phù hợp</p>;

  return (
    <ul className={`wa-cards ${loading ? "is-loading" : ""}`}>
      {wallets.map((w) => {
        const active = w.workerId === selectedId;
        return (
          <li key={w.workerId}>
            <button
              type="button"
              className={`wa-card ${active ? "active" : ""}`}
              onClick={() => onSelect(w.workerId)}
              aria-current={active ? "true" : undefined}
            >
              <span className="wa-avatar wa-avatar-fallback">{w.workerName?.[0]?.toUpperCase() ?? "?"}</span>
              <div className="wa-card-body">
                <div className="wa-card-top">
                  <strong className="wa-card-name">{w.workerName}</strong>
                  <b className={`wl-amount ${Number(w.balance) < 0 ? "wl-neg" : ""}`}>{formatVnd(w.balance)}</b>
                </div>
                <div className="wa-meta">
                  <span><Phone size={12} /> {w.workerPhone || "-"}</span>
                  <span><Clock size={12} /> {formatRelative(w.updatedAt)}</span>
                </div>
                {!w.canReceiveJobs && (
                  <div className="wa-warn"><AlertTriangle size={12} /> Tạm ngừng nhận đơn mới</div>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

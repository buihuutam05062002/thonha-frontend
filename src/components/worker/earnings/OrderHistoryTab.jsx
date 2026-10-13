import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import { Search } from "lucide-react";
import { parseApiError } from "../../../api/apiError";
import { searchWorkerOrders } from "../../../api/earningsApi";
import { OrderCard } from "../dashboard/OrderCard";
import { OrderDetailModal } from "../dashboard/OrderDetailModal";
import { Paginator } from "./Paginator";

const ACCENT = "#F5820D";
const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const FILTERS = [
  { key: "all", label: "Tất cả", statuses: [] },
  { key: "done", label: "Hoàn thành", statuses: ["COMPLETED"] },
  { key: "active", label: "Đang thực hiện", statuses: ["MATCHED", "ON_THE_WAY", "IN_PROGRESS"] },
  { key: "cancelled", label: "Đã hủy", statuses: ["CANCELLED"] },
];

export function OrderHistoryTab({ active }) {
  const [filterKey, setFilterKey] = useState("all");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState(""); 
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const seq = useRef(0); 

  useEffect(() => {
    const id = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [keywordInput]);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    const statuses = FILTERS.find((f) => f.key === filterKey)?.statuses ?? [];
    setLoading(true);
    setError(null);
    try {
      const res = await searchWorkerOrders({ statuses, keyword, page, size: PAGE_SIZE });
      if (mine !== seq.current) return;
      if (res.content.length === 0 && page > 0 && res.totalPages > 0) {
        setPage(res.totalPages - 1); 
        return;
      }
      setData(res);
    } catch (e) {
      if (mine === seq.current) setError(parseApiError(e).message || "Không tải được lịch sử công việc.");
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [filterKey, keyword, page]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  const chooseFilter = (key) => {
    setFilterKey(key);
    setPage(0);
  };

  const clearFilters = () => {
    setFilterKey("all");
    setKeywordInput("");
    setKeyword("");
    setPage(0);
  };

  const list = data?.content ?? [];
  const isFiltering = filterKey !== "all" || keyword !== "";

  return (
    <div>
      <div className="position-relative mb-3">
        <Search size={16} className="position-absolute text-muted" style={{ left: 12, top: 11 }} aria-hidden="true" />
        <input
          type="search"
          className="form-control rounded-pill ps-5"
          placeholder="Tìm theo mã đơn"
          aria-label="Tìm theo mã đơn"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
        />
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Lọc theo trạng thái">
        {FILTERS.map((f) => {
          const on = filterKey === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              className={`btn btn-sm rounded-pill ${on ? "text-white" : "btn-outline-secondary"}`}
              style={on ? { background: ACCENT, borderColor: ACCENT } : undefined}
              onClick={() => chooseFilter(f.key)}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-danger small" role="alert">
          {error}{" "}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={load}>Thử lại</button>
        </div>
      )}

      {!data && loading && <div className="text-center py-5"><Spinner animation="border" style={{ color: ACCENT }} /></div>}

      {data && (
        <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }} aria-busy={loading}>
          {list.length === 0 ? (
            <div className="bg-white rounded-4 shadow-sm text-center text-muted small p-4">
              {isFiltering ? (
                <>
                  Không có đơn nào khớp bộ lọc.{" "}
                  <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={clearFilters}>Xóa bộ lọc</button>
                </>
              ) : (
                "Bạn chưa có đơn nào."
              )}
            </div>
          ) : (
            <>
              <div className="text-muted small mb-2">{data.totalElements} đơn</div>
              <div className="d-flex flex-column gap-2">
                {list.map((o) => <OrderCard key={o.id} order={o} onClick={() => setSelectedId(o.id)} />)}
              </div>
              <Paginator page={page} totalPages={data.totalPages} onChange={setPage} disabled={loading} />
            </>
          )}
        </div>
      )}

      {selectedId != null && (
        <OrderDetailModal orderId={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Info, Pencil } from "lucide-react";
import { notify as showNotice } from "../../../utils/notify";
import { fetchCommissionOverview, saveCommissionPolicy } from "../../../api/commissionApi";
import { getCategories } from "../../../api/categoryApi";
import { formatDateTime, formatPercent } from "../../../utils/format";

function parseRate(text) {
  const t = String(text ?? "").trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) {
    return { error: "Nhập số từ 0 đến 100, tối đa 2 chữ số thập phân" };
  }
  const value = Number(t);
  if (value > 100) return { error: "Tỷ lệ tối đa là 100%" };
  return { value };
}

export default function CommissionPolicies() {
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [ov, cats] = await Promise.all([fetchCommissionOverview(), getCategories().catch(() => [])]);
      setOverview(ov);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (payload, successText) => {
    await saveCommissionPolicy(payload);
    showNotice("success", successText);
    await load();
  };

  const availableCategories = useMemo(() => {
    const used = new Set((overview?.categoryPolicies ?? []).map((p) => p.categoryId));
    return categories.filter((c) => !used.has(c.id));
  }, [categories, overview]);

  if (loading) return <div className="cm-card cm-skeleton" aria-busy="true" />;
  if (error) {
    return (
      <div className="cm-card wa-empty wa-error" role="alert">
        {error} <button type="button" className="wa-btn wa-btn-ghost" onClick={() => { setLoading(true); load(); }}>Thử lại</button>
      </div>
    );
  }

  return (
    <>
      <p className="cm-info">
        <Info size={15} aria-hidden="true" />
        Thay đổi chỉ áp dụng cho các đơn hoàn thành từ lúc lưu. Đơn đã chốt trước đó giữ nguyên tỷ lệ cũ.
      </p>

      <DefaultRateCard overview={overview} onSave={save} />

      <div className="cm-card">
        <h2 className="cm-title">Tỷ lệ riêng theo danh mục</h2>
        <p className="cm-sub">Danh mục có tỷ lệ riêng sẽ dùng tỷ lệ đó thay cho tỷ lệ mặc định. Tắt để quay về tỷ lệ mặc định.</p>

        <CategoryPolicyTable policies={overview.categoryPolicies} onSave={save} />
        <AddCategoryPolicy categories={availableCategories} onSave={save} />
      </div>
    </>
  );
}

function DefaultRateCard({ overview, onSave }) {
  const [text, setText] = useState(String(overview.defaultRatePercent));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setText(String(overview.defaultRatePercent)); }, [overview.defaultRatePercent]);

  const parsed = parseRate(text);
  const dirty = overview.defaultFromConfig || (parsed.value !== undefined && parsed.value !== Number(overview.defaultRatePercent));

  const submit = async (e) => {
    e.preventDefault();
    if (parsed.error) { setError(parsed.error); return; }
    setBusy(true);
    setError("");
    try {
      await onSave({ categoryId: null, ratePercent: parsed.value }, `Đã lưu tỷ lệ mặc định ${formatPercent(parsed.value)}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="cm-card cm-default" onSubmit={submit} noValidate>
      <div>
        <h2 className="cm-title">Tỷ lệ mặc định toàn hệ thống</h2>
        <p className="cm-sub">Áp dụng cho mọi đơn thuộc danh mục chưa có tỷ lệ riêng.</p>
        {overview.defaultFromConfig && (
          <p className="cm-note">
            Chưa lưu trong hệ thống, đang dùng giá trị cấu hình ({formatPercent(overview.defaultRatePercent)}). Bấm 'Lưu' để chính thức áp dụng.
          </p>
        )}
      </div>

      <div className="cm-rate-edit">
        <div className="cm-rate-input">
          <input
            value={text}
            inputMode="decimal"
            aria-label="Tỷ lệ hoa hồng mặc định (%)"
            onChange={(e) => { setText(e.target.value); setError(""); }}
          />
          <span>%</span>
        </div>
        <button type="submit" className="wa-btn cm-save" disabled={busy || !dirty}>{busy ? "Đang lưu..." : "Lưu"}</button>
      </div>
      {error && <p className="cm-error" role="alert">{error}</p>}
    </form>
  );
}

function CategoryPolicyTable({ policies, onSave }) {
  const [editingId, setEditingId] = useState(null);
  const [text, setText] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const startEdit = (p) => { setEditingId(p.id); setText(String(p.ratePercent)); setError(""); };
  const cancel = () => { setEditingId(null); setError(""); };

  const run = async (p, payload, successText) => {
    setBusyId(p.id);
    setError("");
    try {
      await onSave({ categoryId: p.categoryId, ...payload }, successText);
      setEditingId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const saveRate = (p) => {
    const parsed = parseRate(text);
    if (parsed.error) { setError(parsed.error); return; }
    return run(p, { ratePercent: parsed.value, active: p.active }, `Đã lưu tỷ lệ ${formatPercent(parsed.value)} cho '${p.categoryName}'.`);
  };

  const toggleActive = (p) =>
    run(
      p,
      { ratePercent: Number(p.ratePercent), active: !p.active },
      p.active ? `Đã tắt tỷ lệ riêng của '${p.categoryName}', quay về tỷ lệ mặc định.` : `Đã bật lại tỷ lệ riêng của '${p.categoryName}'.`,
    );

  if (policies.length === 0) return <p className="wa-empty">Chưa có danh mục nào có tỷ lệ riêng</p>;

  return (
    <>
      {error && <p className="cm-error" role="alert">{error}</p>}
      <div className="cm-table-wrap">
        <table className="cm-table">
          <thead>
            <tr>
              <th>Danh mục</th>
              <th className="num">Tỷ lệ</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => {
              const editing = editingId === p.id;
              const busy = busyId === p.id;
              return (
                <tr key={p.id} className={p.active ? "" : "cm-row-off"}>
                  <td><b>{p.categoryName}</b></td>
                  <td className="num">
                    {editing ? (
                      <span className="cm-rate-input cm-rate-inline">
                        <input
                          autoFocus value={text} inputMode="decimal" aria-label={`Tỷ lệ cho ${p.categoryName}`}
                          onChange={(e) => { setText(e.target.value); setError(""); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveRate(p); } if (e.key === "Escape") cancel(); }}
                        />
                        <span>%</span>
                      </span>
                    ) : formatPercent(p.ratePercent)}
                  </td>
                  <td>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.active}
                      aria-label={`${p.active ? "Tắt" : "Bật"} tỷ lệ riêng của ${p.categoryName}`}
                      className={`cm-switch ${p.active ? "on" : ""}`}
                      disabled={busy || editing}
                      onClick={() => toggleActive(p)}
                    >
                      <span />
                    </button>
                    <span className="cm-switch-label">{p.active ? "Đang áp dụng" : "Đã tắt"}</span>
                  </td>
                  <td className="nowrap cm-muted">{formatDateTime(p.updatedAt)}</td>
                  <td className="nowrap">
                    {editing ? (
                      <>
                        <button type="button" className="wa-btn" disabled={busy} onClick={() => saveRate(p)}>Lưu</button>{" "}
                        <button type="button" className="wa-btn wa-btn-ghost" disabled={busy} onClick={cancel}>Hủy</button>
                      </>
                    ) : (
                      <button type="button" className="cm-icon-btn" disabled={busy} onClick={() => startEdit(p)} aria-label={`Sửa tỷ lệ ${p.categoryName}`}>
                        <Pencil size={14} /> Sửa
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AddCategoryPolicy({ categories, onSave }) {
  const [categoryId, setCategoryId] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!categoryId) { setError("Vui lòng chọn danh mục"); return; }
    const parsed = parseRate(text);
    if (parsed.error) { setError(parsed.error); return; }
    const cat = categories.find((c) => String(c.id) === categoryId);
    setBusy(true);
    setError("");
    try {
      await onSave({ categoryId: Number(categoryId), ratePercent: parsed.value }, `Đã thêm tỷ lệ ${formatPercent(parsed.value)} cho '${cat?.name ?? "danh mục"}'.`);
      setCategoryId("");
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="cm-add" onSubmit={submit} noValidate>
      <h3>Thêm tỷ lệ riêng cho danh mục</h3>
      {categories.length === 0 ? (
        <p className="cm-sub">Tất cả danh mục đã có tỷ lệ riêng.</p>
      ) : (
        <div className="cm-add-row">
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setError(""); }} aria-label="Danh mục">
            <option value="">Chọn danh mục...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span className="cm-rate-input">
            <input value={text} inputMode="decimal" placeholder="Ví dụ: 12,5" aria-label="Tỷ lệ hoa hồng (%)" onChange={(e) => { setText(e.target.value); setError(""); }} />
            <span>%</span>
          </span>
          <button type="submit" className="wa-btn cm-save" disabled={busy}>{busy ? "Đang thêm..." : "Thêm"}</button>
        </div>
      )}
      {error && <p className="cm-error" role="alert">{error}</p>}
    </form>
  );
}
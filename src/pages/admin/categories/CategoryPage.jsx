import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { createCategory, getAdminCategories, updateCategory } from "../../../api/categoryApi";
import {
  Button, Card, ErrorText, Field, Input, Notice, PageShell, Pagination, Select, Skeleton, Switch, Table, Td, Textarea, Th, cn,
} from "../../../components/admin/ui";

const PAGE_SIZE = 10;
const ICON_OPTIONS = [
  { value: "zap", label: "Điện (zap)" },
  { value: "droplet", label: "Nước (droplet)" },
  { value: "wind", label: "Điều hòa (wind)" },
  { value: "refrigerator", label: "Tủ lạnh (refrigerator)" },
  { value: "washing-machine", label: "Máy giặt (washing-machine)" },
  { value: "wrench", label: "Khác (wrench)" },
];
const EMPTY = { name: "", description: "", icon: "wrench" };

export default function CategoryPage() {
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(0);
  const timer = useRef(null);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 6000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await getAdminCategories({ page, size: PAGE_SIZE });
      setItems(res.content ?? []);
      setTotalPages(res.totalPages ?? 0);
      setTotalElements(res.totalElements ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...EMPTY }); setFormError(""); };
  const openEdit = (c) => {
    setForm({ id: c.id, name: c.name, description: c.description ?? "", icon: c.icon || "wrench" });
    setFormError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { setFormError("Tên danh mục không được để trống"); return; }
    const payload = { name, description: form.description.trim(), icon: form.icon };
    setBusy(true);
    setFormError("");
    try {
      if (form.id) {
        await updateCategory(form.id, payload);
        showNotice("success", `Đã cập nhật danh mục '${name}'.`);
      } else {
        await createCategory(payload);
        showNotice("success", `Đã thêm danh mục '${name}'.`);
      }
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (c) => {
    const next = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusyId(c.id);
    try {
      await updateCategory(c.id, { status: next });
      showNotice("success", next === "ACTIVE" ? `Đã bật lại '${c.name}'.` : `Đã tắt '${c.name}'. Khách hàng sẽ không còn thấy danh mục này.`);
      await load();
    } catch (err) {
      showNotice("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell title="Danh mục" subtitle="Quản lý các loại dịch vụ sửa chữa mà khách hàng có thể đặt">
      {notice && <Notice type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      {form && (
        <Card title={form.id ? "Sửa danh mục" : "Thêm danh mục"}>
          <form onSubmit={submit} noValidate>
            <div className="grid grid-cols-2 gap-3.5 max-[640px]:grid-cols-1">
              <Field label="Tên danh mục">
                <Input autoFocus value={form.name} maxLength={100} onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormError(""); }} />
              </Field>
              <Field label="Biểu tượng">
                <Select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                  {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  {!ICON_OPTIONS.some((o) => o.value === form.icon) && <option value={form.icon}>{form.icon}</option>}
                </Select>
              </Field>
              <Field wide label="Mô tả">
                <Textarea rows={2} value={form.description} maxLength={500} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
            </div>
            <ErrorText>{formError}</ErrorText>
            <div className="mt-3.5 flex items-center gap-2.5">
              <Button type="submit" disabled={busy}>{busy ? "Đang lưu..." : "Lưu"}</Button>
              <Button variant="ghost" disabled={busy} onClick={() => setForm(null)}>Hủy</Button>
            </div>
          </form>
        </Card>
      )}

      <Card
        title="Danh sách danh mục"
        subtitle={`${totalElements} danh mục. Danh mục đã tắt sẽ không hiện cho khách hàng.`}
        action={!form && <Button onClick={openAdd}><Plus size={14} aria-hidden="true" /> Thêm danh mục</Button>}
      >
        {loading && <Skeleton />}
        {!loading && error && (
          <p role="alert" className="m-0 py-10 text-center text-sm text-red-600">
            {error}{" "}
            <Button variant="ghost" onClick={() => { setLoading(true); load(); }}>Thử lại</Button>
          </p>
        )}
        {!loading && !error && items.length === 0 && <p className="m-0 py-10 text-center text-sm text-subtle">Chưa có danh mục nào</p>}
        {!loading && !error && items.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Danh mục</Th>
                <Th>Mô tả</Th>
                <Th num>Số yêu cầu</Th>
                <Th>Trạng thái</Th>
                <Th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const on = c.status === "ACTIVE";
                return (
                  <tr key={c.id} className={cn(!on && "opacity-60")}>
                    <Td>
                      <b>{c.name}</b>
                      {c.icon && <small className="block text-[11px] font-normal text-subtle">{c.icon}</small>}
                    </Td>
                    <Td className="max-w-[360px] text-slate-600">{c.description || <span className="text-subtle">-</span>}</Td>
                    <Td num>{Number(c.requestCount).toLocaleString("vi-VN")}</Td>
                    <Td nowrap>
                      <Switch checked={on} label={`${on ? "Tắt" : "Bật"} danh mục ${c.name}`} disabled={busyId === c.id} onClick={() => toggle(c)} />
                      <span className="ml-2 text-xs text-slate-600">{on ? "Hoạt động" : "Đã tắt"}</span>
                    </Td>
                    <Td nowrap>
                      <Button variant="ghost" className="h-7 px-2.5" onClick={() => openEdit(c)} aria-label={`Sửa danh mục ${c.name}`}>
                        <Pencil size={14} /> Sửa
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {!loading && !error && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      </Card>
    </PageShell>
  );
}

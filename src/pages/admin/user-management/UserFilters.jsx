import { ROLES, USER_STATUSES } from "../../../api/userApi";
import { Button, Card, FilterBar, PillSelect, SearchBox, Tabs } from "../../../components/admin/ui";

const ROLE_TABS = [{ value: "", key: "all", label: "Tất cả" }, ...ROLES];

export default function UserFilters({ filters, onChange, onSearch }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  const pickRole = (role) => {
    const next = { ...filters, role };
    onChange(next);
    onSearch(next);
  };

  return (
    <Card>
      <Tabs items={ROLE_TABS} value={filters.role} onChange={pickRole} label="Vai trò" />

      <FilterBar
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(filters);
        }}
      >
        <SearchBox
          placeholder="Tìm theo tên, email, số điện thoại"
          aria-label="Từ khóa"
          value={filters.keyword}
          onChange={(e) => set({ keyword: e.target.value })}
        />
        <PillSelect value={filters.role} onChange={(e) => set({ role: e.target.value })} aria-label="Vai trò">
          <option value="">Vai trò: Tất cả</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </PillSelect>
        <PillSelect value={filters.userStatus} onChange={(e) => set({ userStatus: e.target.value })} aria-label="Trạng thái">
          <option value="">Trạng thái: Tất cả</option>
          {USER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </PillSelect>
        <Button type="submit">Tìm kiếm</Button>
      </FilterBar>
    </Card>
  );
}

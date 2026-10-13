import { ROLES, USER_STATUSES } from "../../../api/userApi";

export default function UserFilters({ filters, onChange, onSearch }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="um-filters">
      <div className="um-tabs" role="tablist">
        {[{ value: "", label: "Tất cả" }, ...ROLES].map((r) => (
          <button
            key={r.value || "all"}
            role="tab"
            aria-selected={filters.role === r.value}
            className={filters.role === r.value ? "active" : ""}
            onClick={() => {
              const next = { ...filters, role: r.value };
              onChange(next);
              onSearch(next);
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <form
        className="um-filter-row"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(filters);
        }}
      >
        <input
          type="search"
          className="um-input"
          placeholder="Tìm theo tên, email, số điện thoại"
          value={filters.keyword}
          onChange={(e) => set({ keyword: e.target.value })}
        />
        <select
          className="um-select"
          value={filters.role}
          onChange={(e) => set({ role: e.target.value })}
          aria-label="Vai trò"
        >
          <option value="">Vai trò: Tất cả</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          className="um-select"
          value={filters.userStatus}
          onChange={(e) => set({ userStatus: e.target.value })}
          aria-label="Trạng thái"
        >
          <option value="">Trạng thái: Tất cả</option>
          {USER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button type="submit" className="um-btn">Tìm kiếm</button>
      </form>
    </div>
  );
}

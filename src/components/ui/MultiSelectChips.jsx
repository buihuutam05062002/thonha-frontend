
export function MultiSelectChips({
  label,
  options = [],
  selectedIds = [],
  onToggle,
  loading,
  error,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>

      {loading ? (
        <p className="text-sm text-gray-400 py-2">
          Đang tải danh sách chuyên môn...
        </p>
      ) : options.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">
          Chưa có danh mục dịch vụ nào để chọn.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const active = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle(opt.id)}
                aria-pressed={active}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150 ${
                  active
                    ? "text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-orange-300"
                }`}
                style={
                  active
                    ? { background: "#F5820D", borderColor: "#F5820D" }
                    : undefined
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

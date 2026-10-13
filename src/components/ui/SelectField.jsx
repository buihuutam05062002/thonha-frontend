import { ChevronDown } from "lucide-react";

export function SelectField({
  label,
  name,
  options,
  value,
  error,
  onChange,
  onBlur,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-xs font-medium text-gray-500 uppercase tracking-wide"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          className={`w-full appearance-none bg-white border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-150 pr-10 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-gray-200 focus:border-orange-400 focus:ring-orange-100"
          }`}
          style={{ color: value === "" ? "#c4c4c4" : "#111111" }}
        >
          <option value="" disabled hidden>
            Chọn
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" />
        </span>
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}


export function InputField({
    label,
    name,
    placeholder,
    type="text",
    value,
    error,
    onChange,
    onBlur,
}){
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={name}
            className="text-xs font-medium text-gray-500 uppercase tracking-wide"
          >
            {label}
          </label>
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            aria-invalid={!!error}
            className={`w-full bg-white border rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-all duration-150 ${
              error
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-orange-400 focus:ring-orange-100"
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
      </>
    );
}
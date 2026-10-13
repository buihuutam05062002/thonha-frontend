import { useEffect, useMemo, useRef, useState } from "react";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024;

export function DocumentUploadField({
  label,
  hint,
  multiple = false,
  maxFiles = 5,
  files,
  onChange,
  error,
}) {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState(null);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    [files],
  );

  useEffect(
    () => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)),
    [previews],
  );

  const handlePick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const valid = [];
    let msg = null;

    picked.forEach((f) => {
      if (!ACCEPT.includes(f.type))
        msg = `"${f.name}" không đúng định dạng (JPG, PNG, WEBP, PDF)`;
      else if (f.size > MAX_SIZE) msg = `"${f.name}" vượt quá 5MB`;
      else valid.push(f);
    });

    setLocalError(msg);
    if (valid.length === 0) return;
    onChange(multiple ? [...files, ...valid].slice(0, maxFiles) : [valid[0]]);
  };

  const remove = (idx) => onChange(files.filter((_, i) => i !== idx));

  const canAdd = multiple ? files.length < maxFiles : files.length === 0;
  const shownError = localError || error;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        multiple={multiple}
        onChange={handlePick}
        className="hidden"
      />

      {previews.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {previews.map((p, i) => (
            <li
              key={`${p.file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 px-3 py-2"
            >
              {p.url ? (
                <img
                  src={p.url}
                  alt=""
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  PDF
                </div>
              )}
              <span className="flex-1 text-sm text-gray-700 truncate">
                {p.file.name}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs font-semibold text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 w-full rounded-xl border-2 border-dashed border-gray-300 bg-white py-5 text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
        >
          + Chọn {multiple ? "tệp" : "ảnh"}
        </button>
      )}

      {shownError && <p className="text-xs text-red-500 mt-1">{shownError}</p>}
    </div>
  );
}

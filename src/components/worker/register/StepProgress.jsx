import { Check } from "lucide-react";

const STEPS = ["Thông tin cơ bản", "Hồ sơ giấy tờ"];

export function StepProgress({ current }) {
  return (
    <div className="flex items-start justify-center mb-10">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center w-28">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                style={{
                  background: done || active ? "#F5820D" : "#E5E5E5",
                  color: done || active ? "#fff" : "#9CA3AF",
                }}
              >
                {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : n}
              </div>
              <span
                className={`mt-2 text-xs text-center ${active ? "font-bold text-gray-900" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-16 h-0.5 mt-4 transition-colors"
                style={{ background: done ? "#F5820D" : "#E5E5E5" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

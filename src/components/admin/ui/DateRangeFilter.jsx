import { useState } from "react";
import Button from "./Button";
import Card from "./Card";
import { Field, Input } from "./Field";
import { ErrorText } from "./Notice";
import Tabs from "./Tabs";

const daysBetween = (from, to) => Math.round((new Date(to) - new Date(from)) / 86400000) + 1;

/**
 * Chọn khoảng ngày: các nút nhanh + ô "Từ ngày / Đến ngày".
 * presets: [{ key, label, range: () => ({ from, to }) }]; onApply({ from, to }) được gọi khi chọn nút nhanh hoặc bấm "Áp dụng".
 * requireRange: bắt buộc nhập đủ hai ngày. maxDays: số ngày tối đa của khoảng tuỳ chọn.
 */
export default function DateRangeFilter({ presets, initialKey, requireRange = false, maxDays, onApply }) {
  const [presetKey, setPresetKey] = useState(initialKey);
  const [input, setInput] = useState(() => presets.find((p) => p.key === initialKey).range());
  const [error, setError] = useState("");

  const applyPreset = (key) => {
    const range = presets.find((p) => p.key === key).range();
    setPresetKey(key);
    setInput(range);
    setError("");
    onApply(range);
  };

  const applyCustom = (e) => {
    e.preventDefault();
    if (requireRange && (!input.from || !input.to)) return setError("Vui lòng chọn đủ 'Từ ngày' và 'Đến ngày'");
    if (input.from && input.to && input.from > input.to) return setError("'Từ ngày' không được sau 'Đến ngày'");
    if (maxDays && daysBetween(input.from, input.to) > maxDays) return setError(`Khoảng ngày tối đa là ${maxDays} ngày`);
    setError("");
    setPresetKey("custom");
    onApply({ from: input.from, to: input.to });
  };

  return (
    <Card>
      <div className="mb-12px">
        <Tabs toggle label="Khoảng ngày nhanh" items={presets.map((p) => ({ value: p.key, label: p.label }))} value={presetKey} onChange={applyPreset} />
      </div>
      <form className="flex flex-wrap items-end gap-12px" onSubmit={applyCustom} noValidate>
        <Field label="Từ ngày">
          <Input type="date" value={input.from} max={input.to || undefined} onChange={(e) => setInput({ ...input, from: e.target.value })} />
        </Field>
        <Field label="Đến ngày">
          <Input type="date" value={input.to} min={input.from || undefined} onChange={(e) => setInput({ ...input, to: e.target.value })} />
        </Field>
        <Button type="submit" className="h-[38px]">Áp dụng</Button>
      </form>
      <ErrorText>{error}</ErrorText>
    </Card>
  );
}

import { formatMoneyInput, parseMoneyInput } from "../../utils/format";

export default function MoneyInput({ value, onChange, ...rest }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatMoneyInput(value)}
      onChange={(e) => onChange(parseMoneyInput(e.target.value))}
      {...rest}
    />
  );
}

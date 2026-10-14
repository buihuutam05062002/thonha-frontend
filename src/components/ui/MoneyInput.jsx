import { formatMoneyInput, parseMoneyInput } from "../../utils/format";

/**
 * Ô nhập số tiền VND: tự chèn dấu chấm ngăn cách hàng nghìn, chỉ nhận chữ số.
 * `value` là số nguyên (0 = để trống), `onChange` nhận số nguyên.
 */
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

import { Form } from "react-bootstrap";

export function ToggleSwitch({ on, onToggle, disabled = false }) {
  return (
    <Form.Check
      type="switch"
      id="custom-switch"
      checked={on}
      onChange={onToggle}
      disabled={disabled}
      className="fs-4 custom-toggle-switch"
      style={{ cursor: disabled ? "not-allowed" : "pointer" }}
    />
  );
}

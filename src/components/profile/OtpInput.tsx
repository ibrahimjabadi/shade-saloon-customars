import { useRef } from "react";

/** Segmented verification-code input (spec: 4–6 boxes, Manrope 22px/700).
 * Controlled — `value` is the plain digit string, same shape the existing
 * `confirmVerification(channel, code)` action already expects, so this is a
 * drop-in visual replacement for the plain text input it used to be. */
export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  function setDigit(i: number, raw: string) {
    const chars = raw.replace(/\D/g, "").split("");
    if (!chars.length) {
      onChange(value.slice(0, i) + value.slice(i + 1));
      return;
    }
    const next = value.slice(0, i).padEnd(i, " ") + chars.join("") + value.slice(i + chars.length);
    onChange(next.replace(/ /g, "").slice(0, length));
    const target = Math.min(i + chars.length, length - 1);
    cellRefs.current[target]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      cellRefs.current[i - 1]?.focus();
    }
  }

  return (
    <div className="otp-input" dir="ltr">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            cellRefs.current[i] = el;
          }}
          className="otp-cell"
          type="text"
          inputMode="numeric"
          maxLength={length}
          value={d}
          disabled={disabled}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
        />
      ))}
    </div>
  );
}

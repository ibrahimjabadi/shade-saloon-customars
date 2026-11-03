// Arabic phone keyboards type Arabic-Indic digits (٠١٢…٩, or Persian ۰۱۲…۹)
// and the Arabic decimal/thousands marks; everything here (Number(), the
// server, phone and amount checks) expects 0-9 and ".". Normalize them in
// every text field as they're typed, once for the whole app, before React's
// onChange sees the value. Password fields are left alone (an existing
// password may contain those digits).

const MAP: Record<string, string> = { "٫": ".", "٬": "" };
for (let i = 0; i < 10; i++) {
  MAP[String.fromCharCode(0x0660 + i)] = String(i); // Arabic-Indic
  MAP[String.fromCharCode(0x06f0 + i)] = String(i); // Extended (Persian/Urdu)
}
const ANY = /[٠-٩۰-۹٫٬]/;
const ALL = /[٠-٩۰-۹٫٬]/g;

/** "٢٠٫٥" -> "20.5" (other characters untouched). */
export function westernDigits(s: string) {
  return ANY.test(s) ? s.replace(ALL, (c) => MAP[c] ?? c) : s;
}

const setInput = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
const SKIP = new Set(["password", "checkbox", "radio", "file", "range", "color", "hidden"]);

export function installDigitNormalizer() {
  // capture phase on window runs before React's listener on the root;
  // writing through the prototype setter keeps React's change tracking
  // working, so onChange receives the normalized value
  window.addEventListener(
    "input",
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement) || SKIP.has(el.type) || !ANY.test(el.value)) return;
      const pos = el.selectionStart;
      setInput.call(el, westernDigits(el.value));
      if (pos !== null) {
        try {
          el.setSelectionRange(pos, pos);
        } catch {
          /* some input types have no selection */
        }
      }
    },
    true,
  );
}

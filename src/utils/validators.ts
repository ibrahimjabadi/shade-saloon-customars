/* Lenient client-side checks — the backend is still the source of truth and
   re-validates everything; this is just to catch obvious typos before a
   round-trip, not to replace server-side validation. */

export function validatePhone(v: string): boolean {
  const digits = String(v || "").replace(/[\s\-()]/g, "");
  return /^(\+?962|0)?7[789]\d{7}$/.test(digits);
}

export function validateEmail(v: string): boolean {
  if (!v) return true; // email is optional in this form
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

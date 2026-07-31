/* Lenient client-side checks — the backend is still the source of truth and
   re-validates everything; this is just to catch obvious typos before a
   round-trip, not to replace server-side validation. */

// Generic, country-agnostic check on just the local number portion (the
// dial code is picked separately via the country select) — enough digits
// to be a plausible phone number, not tied to Jordan's mobile format.
export function validatePhone(localNumber: string): boolean {
  const digits = String(localNumber || "").replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 12;
}

export function validateEmail(v: string): boolean {
  if (!v) return true; // email is optional in this form
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

// Dates, times and money in the salon's local time. Dates are always
// built from LOCAL parts -- never toISOString(), which is UTC and made the
// old app think "today" was yesterday between midnight and 3am in Amman.
import type { Lang } from "./i18n";

export function localDate(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDate(d);
}
export function nextDays(n: number, from = localDate()) {
  return Array.from({ length: n }, (_, i) => addDays(from, i));
}
const loc = (lang: Lang) => (lang === "ar" ? "ar-JO" : "en-GB");

export function money(v: number | undefined | null, currency: string | undefined, lang: Lang) {
  const n = Number(v || 0);
  const s = n.toLocaleString("en", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const c = !currency || currency === "JD" ? (lang === "ar" ? "د.أ" : "JD") : currency;
  return `${s} ${c}`;
}
export function timeLabel(iso: string | Date, lang: Lang) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, "0");
  const ampm = lang === "ar" ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${m} ${ampm}`;
}
export function dayLabel(date: string | Date, lang: Lang, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) {
  const d = typeof date === "string" ? new Date(date.length === 10 ? `${date}T12:00:00` : date) : date;
  return d.toLocaleDateString(loc(lang), { ...opts, calendar: "gregory" });
}
export function shortDay(date: string, lang: Lang) {
  return dayLabel(date, lang, { weekday: "short" });
}
export function dayNum(date: string) {
  return Number(date.slice(8));
}
export function monthLabel(date: string, lang: Lang) {
  return dayLabel(date, lang, { month: "long", year: "numeric" });
}
/** "Today" / "Tomorrow" / weekday + date, then the time. */
export function whenLabel(iso: string, lang: Lang) {
  const d = localDate(new Date(iso));
  const today = localDate();
  const rel = d === today ? (lang === "ar" ? "اليوم" : "Today") : d === addDays(today, 1) ? (lang === "ar" ? "غدًا" : "Tomorrow") : dayLabel(d, lang);
  return `${rel} · ${timeLabel(iso, lang)}`;
}
export function initial(name?: string) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}
/** A short, readable booking reference instead of the internal id. */
export function bookingRef(id: string) {
  return "#" + id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
}

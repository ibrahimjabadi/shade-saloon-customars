// The salon's catalog for one branch, and whether it's open now.
import type { Barber, Branch, DayHours, Service, Settings } from "./types";
import type { Lang } from "./i18n";

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Bookable barbers at a branch (not admin/reception staff records). */
export function branchBarbers(barbers: Barber[], branchId: string) {
  return barbers.filter((b) => b.branchId === branchId && !(b as { staffOnly?: boolean }).staffOnly);
}
/** A barber with no service list offers every service. */
export function offers(b: Barber, serviceId: string) {
  return !b.serviceIds?.length || b.serviceIds.includes(serviceId);
}
/** Services someone at this branch actually offers. */
export function branchServices(services: Service[], barbers: Barber[], branchId: string) {
  const staff = branchBarbers(barbers, branchId);
  return services.filter((s) => staff.some((b) => offers(b, s.id)));
}
export function serviceName(s: { name: string; nameAr?: string }, lang: Lang) {
  return lang === "ar" ? s.nameAr || s.name : s.name || s.nameAr || "";
}

const hm = (s?: string) =>
  s && /^\d{1,2}:\d{2}$/.test(s) ? Number(s.split(":")[0]) * 60 + Number(s.split(":")[1]) : null;

/** The branch's hours per weekday; branches without their own hours use
 * the salon's opening/closing time every day. */
export function weekHours(branch: Branch, settings: Settings): Record<string, DayHours> {
  if (branch.businessHours && Object.keys(branch.businessHours).length)
    return branch.businessHours as Record<string, DayHours>;
  const s = settings as { businessOpen?: string; businessClose?: string };
  const day = { open: s.businessOpen || "09:00", close: s.businessClose || "22:00" };
  return Object.fromEntries(DAY_KEYS.map((k) => [k, day]));
}

/** Open now? (handles days that close after midnight). */
export function openNow(
  hours: Record<string, DayHours>,
  now = new Date(),
): { open: boolean; until?: string; next?: string } {
  const wd = now.getDay(),
    min = now.getHours() * 60 + now.getMinutes();
  const today = hours[DAY_KEYS[wd]],
    yest = hours[DAY_KEYS[(wd + 6) % 7]];
  if (yest && !yest.closed) {
    const o = hm(yest.open),
      c = hm(yest.close);
    if (o != null && c != null && c <= o && min < c) return { open: true, until: yest.close };
  }
  if (today && !today.closed) {
    const o = hm(today.open),
      c = hm(today.close);
    if (o != null && c != null) {
      const overnight = c <= o;
      if (min >= o && (overnight || min < c)) return { open: true, until: today.close };
      if (min < o) return { open: false, next: today.open };
    }
  }
  for (let i = 1; i <= 7; i++) {
    const d = hours[DAY_KEYS[(wd + i) % 7]];
    if (d && !d.closed && d.open) return { open: false, next: d.open };
  }
  return { open: false };
}

export function clock12(hhmm: string | undefined, lang: Lang) {
  const m = hm(hhmm);
  if (m == null) return "";
  const h = Math.floor(m / 60) % 24,
    mm = String(m % 60).padStart(2, "0");
  return `${((h + 11) % 12) + 1}:${mm} ${lang === "ar" ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM"}`;
}

export const AMENITIES: Record<string, [string, string, string]> = {
  parking: ["car", "موقف سيارات", "Parking"],
  wheelchair: ["access", "دخول كراسي متحركة", "Wheelchair accessible"],
  wifi: ["wifi", "واي فاي مجاني", "Free WiFi"],
  card: ["card", "الدفع بالبطاقة", "Card payment"],
  kids: ["baby", "مناسب للأطفال", "Kid friendly"],
  transport: ["bus", "قريب من المواصلات", "Near public transport"],
};

/** Google Calendar link for a booking. */
export function calendarLink(start: string, end: string | undefined, title: string, where: string) {
  const f = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${f(start)}/${f(end || start)}&location=${encodeURIComponent(where)}`;
}

/** What a booking is, for the customer. The server sends the salon's own
 * status (booked, confirmed, arrived, started, completed, cancelled,
 * no_show); anything still active is "upcoming" until its time has
 * passed, then just "past". */
export function bookingState(b: {
  status?: string;
  start: string;
  end?: string;
}): "upcoming" | "completed" | "cancelled" | "no_show" | "past" {
  const s = b.status || "";
  if (s === "completed" || s === "cancelled" || s === "no_show") return s;
  return new Date(b.end || b.start).getTime() > Date.now() ? "upcoming" : "past";
}

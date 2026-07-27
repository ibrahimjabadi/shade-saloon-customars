import { DAY_KEYS, type DayKey } from "../i18n/translations";
import type { BusinessHours } from "../api/types";

export function parseHM(s?: string): number | null {
  if (!s || typeof s !== "string" || !/^\d{1,2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export interface ZonedNow {
  weekday: number;
  minutes: number;
}

export function zonedNow(timezone?: string): ZonedNow {
  if (timezone) {
    try {
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const parts = fmt.formatToParts(new Date());
      const map: Record<string, string> = {};
      parts.forEach((p) => (map[p.type] = p.value));
      const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const weekday = weekdayMap[map.weekday];
      let hour = Number(map.hour);
      if (hour === 24) hour = 0;
      if (weekday != null && !Number.isNaN(hour) && !Number.isNaN(Number(map.minute))) {
        return { weekday, minutes: hour * 60 + Number(map.minute) };
      }
    } catch {
      // invalid timezone string — fall through to browser time below
    }
  }
  const d = new Date();
  return { weekday: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
}

export interface OpenStatus {
  open: boolean;
  closesAt?: string;
  opensAt?: string;
  next?: { day: DayKey; time: string } | null;
}

export function findNextOpen(hours: BusinessHours, fromWeekday: number): { day: DayKey; time: string } | null {
  for (let i = 1; i <= 7; i++) {
    const idx = (fromWeekday + i) % 7;
    const d = hours[DAY_KEYS[idx]];
    if (d && !d.closed && parseHM(d.open) != null) return { day: DAY_KEYS[idx], time: d.open! };
  }
  return null;
}

export function computeOpenStatus(hours: BusinessHours | undefined | null, timezone?: string): OpenStatus | null {
  if (!hours || typeof hours !== "object") return null;
  const zn = zonedNow(timezone);
  const nowMin = zn.minutes;
  const key = DAY_KEYS[zn.weekday];
  const today = hours[key];
  const yest = hours[DAY_KEYS[(zn.weekday + 6) % 7]];

  // A branch open past midnight (e.g. closes 02:00) has "today"'s hours
  // spilling from yesterday's schedule, so that must be checked first.
  if (yest && !yest.closed) {
    const yo = parseHM(yest.open);
    const yc = parseHM(yest.close);
    if (yo != null && yc != null && yc <= yo && nowMin < yc) return { open: true, closesAt: yest.close! };
  }

  if (!today || today.closed) return { open: false, next: findNextOpen(hours, zn.weekday) };
  const o = parseHM(today.open);
  const c = parseHM(today.close);
  if (o == null || c == null) return { open: false, next: findNextOpen(hours, zn.weekday) };

  const isOpen = c > o ? nowMin >= o && nowMin < c : nowMin >= o;
  if (isOpen) return { open: true, closesAt: today.close! };
  if (nowMin < o) return { open: false, opensAt: today.open! };
  return { open: false, next: findNextOpen(hours, zn.weekday) };
}

export function nextDays(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

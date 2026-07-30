import type { Booking } from "../api/types";

/** Escapes text per RFC 5545 §3.3.11 — backslash, semicolon, comma, and
 * newline all need escaping inside a TEXT value (SUMMARY/DESCRIPTION/etc). */
function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsUtc(dateIso: string): string {
  return new Date(dateIso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Builds a standard .ics file with a VALARM reminder baked in. This is the
 * whole "remind me before my appointment" feature: rather than needing Web
 * Push (VAPID keys, a subscription store, and a backend cron job to fire at
 * the right time — a real backend project), the reminder lives inside the
 * calendar event itself. Apple Calendar, Google Calendar, and Outlook all
 * honor VALARM natively, so the reminder fires from the person's own
 * calendar app even if they never open this app again. Trade-off: it only
 * works for whoever actually taps "add to calendar" — there's no reminder
 * for someone who skips that step, which a real push-based system wouldn't
 * have. reminderMinutesBefore defaults to 60 (see ICS_REMINDER_MINUTES). */
export const ICS_REMINDER_MINUTES = 60;

export function buildIcsFile(booking: Booking, reminderMinutesBefore = ICS_REMINDER_MINUTES): string {
  const branchName = booking.branch?.name || "SHADI SALOON";
  const barberName = booking.barber?.name;
  const svcNames = (booking.services || []).map((s) => s.nameAr || s.name).join("، ");
  const summary = `${branchName} — ${svcNames || "حجز"}`;
  const descriptionLines = [
    svcNames ? `الخدمات: ${svcNames}` : "",
    barberName ? `الحلاق: ${barberName}` : "",
    `مرجع الحجز: ${booking.id}`,
  ].filter(Boolean);

  const dtStart = toIcsUtc(booking.start);
  const dtEnd = toIcsUtc(booking.end || booking.start);
  const dtStamp = toIcsUtc(new Date().toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SHADI SALOON//Customer App//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@shadisaloon.app`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(branchName)}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines.join("\n"))}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:تذكير بموعدك",
    `TRIGGER:-PT${reminderMinutesBefore}M`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadIcsFile(booking: Booking) {
  const content = buildIcsFile(booking);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shadi-saloon-${booking.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

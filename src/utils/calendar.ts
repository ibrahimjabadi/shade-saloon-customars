import type { Booking } from "../api/types";

export function buildCalendarLink(booking: Booking, branchName: string | undefined, branchAddress: string | undefined): string {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const text = encodeURIComponent(`${branchName || ""}`);
  const loc = encodeURIComponent(branchAddress || branchName || "");
  const dates = `${fmt(booking.start)}/${fmt(booking.end || booking.start)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("SHADI SALOON")}&dates=${dates}&details=${text}&location=${loc}`;
}

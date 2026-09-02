import type { Booking } from "../../api/types";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { formatMoney } from "../../utils/money";
import { buildCalendarLink } from "../../utils/calendar";
import { downloadIcsFile } from "../../utils/ics";
import { resolveMediaUrl } from "../../utils/media";
import { formatSlotTime } from "../../utils/businessHours";
import { GoogleReviewPrompt } from "./GoogleReviewPrompt";

/** `onDone` defaults to the in-branch wizard's own close behavior (this
 * component's original use). The home-visit wizard passes its own — it
 * keeps its success state in local component state, not the global
 * `booking` store, so it needs to reset that local state instead; without
 * this override, tapping "تم" there would leave the home-visit tab stuck on
 * the success screen forever (closeBooking()/setTab() alone don't touch it). */
export function SuccessScreen({ booking, onDone }: { booking: Booking; onDone?: () => void }) {
  const { tr, lang } = useTranslation();
  const closeBooking = useAppStore((s) => s.closeBooking);
  const setTab = useAppStore((s) => s.setTab);
  const currency = useAppStore((s) => s.settings?.currency);
  const logoUrl = useAppStore((s) => s.settings?.logoUrl);
  const fullBranch = useAppStore((s) => s.branches.find((b) => b.id === booking.branchId));

  const branch = booking.branch || {};
  const barber = booking.barber || {};
  const svcNames = (booking.services || []).map((s) => s.nameAr || s.name).join("، ");
  const calUrl = buildCalendarLink(booking, branch.name, undefined);
  const handleDone =
    onDone ||
    (() => {
      closeBooking();
      setTab("bookings");
    });

  return (
    <div className="success-card">
      <div className="success-hero">
        {logoUrl && <img className="success-hero-logo" src={resolveMediaUrl(logoUrl)} alt="" />}
        <div className="success-hero-check">✓</div>
        <h2>{tr("success")}</h2>
      </div>
      <p className="muted">{tr("seeYouSoon")}</p>
      <div className="success-details">
        <div className="success-row">
          <span>{tr("bookingRef")}</span>
          <strong>{booking.id}</strong>
        </div>
        <div className="success-row">
          <span>{tr("changeBranch")}</span>
          <strong>{branch.name || "-"}</strong>
        </div>
        <div className="success-row">
          <span>{tr("services")}</span>
          <strong>{svcNames || "-"}</strong>
        </div>
        <div className="success-row barber-row">
          <span>{tr("barber")}</span>
          <span className="success-barber">
            {barber.photoUrl && (
              <span className="success-barber-avatar" style={{ backgroundImage: `url('${resolveMediaUrl(barber.photoUrl)}')` }} />
            )}
            <strong>{barber.name || "-"}</strong>
          </span>
        </div>
        <div className="success-row">
          <span>{tr("time")}</span>
          <strong>
            {formatSlotTime(booking.start, lang)} → {booking.end ? formatSlotTime(booking.end, lang) : booking.endLabel}
          </strong>
        </div>
        <div className="success-row">
          <span>{tr("total")}</span>
          <strong>{formatMoney(booking.total, currency, lang)}</strong>
        </div>
      </div>
      {fullBranch?.googleMapsUrl && <GoogleReviewPrompt googleMapsUrl={fullBranch.googleMapsUrl} />}
      <a className="btn secondary" href={calUrl} target="_blank" rel="noopener">
        📅 {tr("addToCalendar")}
      </a>
      <button className="btn secondary" onClick={() => downloadIcsFile(booking)}>
        📥 {tr("downloadIcs")}
      </button>
      <button className="btn gold" onClick={handleDone}>
        {tr("done")}
      </button>
    </div>
  );
}

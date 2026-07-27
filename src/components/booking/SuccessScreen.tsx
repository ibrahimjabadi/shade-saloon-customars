import type { Booking } from "../../api/types";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { formatMoney } from "../../utils/money";
import { buildCalendarLink } from "../../utils/calendar";

export function SuccessScreen({ booking }: { booking: Booking }) {
  const { tr, lang } = useTranslation();
  const closeBooking = useAppStore((s) => s.closeBooking);
  const setTab = useAppStore((s) => s.setTab);
  const currency = useAppStore((s) => s.settings?.currency);

  const branch = booking.branch || {};
  const barber = booking.barber || {};
  const svcNames = (booking.services || []).map((s) => s.nameAr || s.name).join("، ");
  const calUrl = buildCalendarLink(booking, branch.name, undefined);

  return (
    <div className="success-card">
      <div className="success-check">✓</div>
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
              <span className="success-barber-avatar" style={{ backgroundImage: `url('${barber.photoUrl}')` }} />
            )}
            <strong>{barber.name || "-"}</strong>
          </span>
        </div>
        <div className="success-row">
          <span>{tr("time")}</span>
          <strong>
            {booking.startLabel} → {booking.endLabel}
          </strong>
        </div>
        <div className="success-row">
          <span>{tr("total")}</span>
          <strong>{formatMoney(booking.total, currency, lang)}</strong>
        </div>
      </div>
      <a className="btn secondary" href={calUrl} target="_blank" rel="noopener">
        📅 {tr("addToCalendar")}
      </a>
      <button
        className="btn gold"
        onClick={() => {
          closeBooking();
          setTab("bookings");
        }}
      >
        {tr("done")}
      </button>
    </div>
  );
}

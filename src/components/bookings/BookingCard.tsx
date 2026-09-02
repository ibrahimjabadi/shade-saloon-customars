import { useState } from "react";
import type { Booking } from "../../api/types";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { formatMoney } from "../../utils/money";
import { displayError } from "../../utils/errorDisplay";
import { formatBookingDateTime } from "../../utils/businessHours";
import type { TranslationKey } from "../../i18n/translations";

export function BookingCard({ booking, now }: { booking: Booking; now: number }) {
  const { tr, lang } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const currency = settings?.currency;
  const cancelBooking = useAppStore((s) => s.cancelBooking);
  const openReschedule = useAppStore((s) => s.openReschedule);
  const openReview = useAppStore((s) => s.openReview);
  const [cancelling, setCancelling] = useState(false);

  const startMs = new Date(booking.start).getTime();
  const status = booking.status || (startMs < now ? "completed" : "upcoming");
  const showReview = status === "completed";
  const svcNames = (booking.services || []).map((s) => s.nameAr || s.name).join("، ");
  const dateLabel = formatBookingDateTime(booking.start, lang);

  // Only an active, still-future booking can be touched at all — mirrors the
  // exact same status check the backend enforces server-side, so the
  // buttons don't promise something the API will then reject.
  const editable = !["cancelled", "completed", "no_show"].includes(booking.status || "") && startMs > now;
  const canCancel = editable && settings?.allowCustomerCancel !== false;
  const canReschedule = editable && settings?.allowCustomerReschedule !== false;

  async function handleCancel() {
    if (cancelling) return;
    if (!window.confirm(`${tr("cancelConfirmTitle")}\n${tr("cancelConfirmBody")}`)) return;
    setCancelling(true);
    try {
      await cancelBooking(booking.id);
    } catch {
      // error surfaced via myBookingsActionError in the list view
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="booking-card">
      <div className="bk-top">
        <strong>{booking.branch?.name || ""}</strong>
        <span className={`bk-status ${status}`}>{tr(status as TranslationKey) || status}</span>
      </div>
      <div className="muted" style={{ marginTop: 6 }}>
        {svcNames || "-"}
      </div>
      <div className="muted" style={{ marginTop: 4 }}>
        {dateLabel}
        {booking.barber?.name ? " · " + booking.barber.name : ""}
      </div>
      <div style={{ marginTop: 8, fontWeight: 800 }}>{formatMoney(booking.total, currency, lang)}</div>
      {(canCancel || canReschedule) && (
        <div className="bk-actions">
          {canReschedule && (
            <button className="btn secondary" style={{ width: "auto" }} onClick={() => openReschedule(booking.id)}>
              {tr("rescheduleBooking")}
            </button>
          )}
          {canCancel && (
            <button className="btn danger" style={{ width: "auto" }} disabled={cancelling} onClick={handleCancel}>
              {cancelling ? tr("loading") : tr("cancelBooking")}
            </button>
          )}
        </div>
      )}
      {showReview && (
        <div className="bk-actions">
          {booking.rated ? (
            <span className="muted">{tr("alreadyRated")}</span>
          ) : (
            <button className="btn secondary" style={{ width: "auto" }} onClick={() => openReview(booking.id)}>
              {tr("reviewTitle")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function BookingActionErrorBanner() {
  const raw = useAppStore((s) => s.myBookingsActionError);
  const { tr } = useTranslation();
  if (!raw) return null;
  return (
    <div className="item" style={{ marginBottom: 12, borderColor: "rgba(220,38,38,.35)" }}>
      {displayError(raw, tr)}
    </div>
  );
}

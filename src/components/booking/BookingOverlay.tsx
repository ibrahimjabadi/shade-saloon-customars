import { useEffect, useRef } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { useRequestCloseBooking } from "../../hooks/useBookingOverlayClose";
import { resolveSelectedServices, totalDuration, totalPrice } from "../../utils/booking";
import { formatMoney } from "../../utils/money";
import { ServicesStep } from "./steps/ServicesStep";
import { BarberStep } from "./steps/BarberStep";
import { TimeStep } from "./steps/TimeStep";
import { AccountStep } from "./steps/AccountStep";
import { ConfirmStep } from "./steps/ConfirmStep";
import { SuccessScreen } from "./SuccessScreen";
import { YearCalendarModal } from "./YearCalendarModal";

export function BookingOverlay() {
  const { tr, lang } = useTranslation();
  const booking = useAppStore((s) => s.booking);
  const account = useAppStore((s) => s.account);
  const services = useAppStore((s) => s.services);
  const currency = useAppStore((s) => s.settings?.currency);
  const yearCalendarOpen = useAppStore((s) => s.yearCalendarOpen);
  const bookingNext = useAppStore((s) => s.bookingNext);
  const bookingPrev = useAppStore((s) => s.bookingPrev);
  const confirmBooking = useAppStore((s) => s.confirmBooking);
  const closeBooking = useAppStore((s) => s.closeBooking);
  const requestClose = useRequestCloseBooking();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  if (!booking) return null;

  if (booking.success) {
    return (
      <div className="booking-overlay" role="dialog" aria-modal="true" aria-label={tr("success")}>
        <div className="booking-head">
          <h2>{tr("success")}</h2>
          <button ref={closeBtnRef} className="booking-close" aria-label={lang === "ar" ? "إغلاق" : "Close"} onClick={closeBooking}>
            ×
          </button>
        </div>
        <div className="booking-body">
          <SuccessScreen booking={booking.success} />
        </div>
      </div>
    );
  }

  const titles: Record<number, string> = {
    0: tr("services"),
    1: tr("barber"),
    2: tr("time"),
    3: tr("account"),
    4: tr("details"),
  };
  const stepsList = account ? [0, 1, 2, 4] : [0, 1, 2, 3, 4];
  const pos = stepsList.indexOf(booking.step);
  const selected = resolveSelectedServices(services, booking.selectedServices);

  return (
    <div className="booking-overlay" role="dialog" aria-modal="true" aria-label={titles[booking.step]}>
      <div className="booking-head">
        <h2>{titles[booking.step]}</h2>
        <button ref={closeBtnRef} className="booking-close" aria-label={lang === "ar" ? "إغلاق" : "Close"} onClick={requestClose}>
          ×
        </button>
      </div>
      <div className="booking-progress">
        {stepsList.map((_, i) => (
          <div key={i} className={`booking-progress-dot ${i < pos ? "done" : ""} ${i === pos ? "active" : ""}`} />
        ))}
      </div>
      <div className="booking-body">
        {booking.step === 0 && <ServicesStep />}
        {booking.step === 1 && <BarberStep />}
        {booking.step === 2 && <TimeStep />}
        {booking.step === 3 && <AccountStep />}
        {booking.step === 4 && <ConfirmStep />}
      </div>
      <div className="booking-footer">
        <div>
          <div className="summary-line">
            {selected.length} {tr("services")} · {totalDuration(selected)} {tr("min")}
          </div>
          <div className="total-line">{formatMoney(totalPrice(selected), currency, lang)}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {booking.step > 0 && (
            <button className="btn secondary" style={{ width: "auto" }} onClick={bookingPrev}>
              {tr("back")}
            </button>
          )}
          {booking.step < 4 ? (
            <button className="btn gold" style={{ width: "auto" }} onClick={bookingNext}>
              {tr("next")}
            </button>
          ) : (
            <button
              className="btn gold"
              style={{ width: "auto" }}
              disabled={booking.submitting}
              onClick={() => void confirmBooking()}
            >
              {booking.submitting ? tr("loading") : tr("confirmBooking")}
            </button>
          )}
        </div>
      </div>
      {yearCalendarOpen && <YearCalendarModal />}
    </div>
  );
}

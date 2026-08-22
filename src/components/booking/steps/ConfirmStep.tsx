import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";
import { resolveSelectedServices, totalPrice, serviceName } from "../../../utils/booking";
import { formatMoney } from "../../../utils/money";
import { displayError } from "../../../utils/errorDisplay";

export function ConfirmStep() {
  const { tr, lang } = useTranslation();
  const booking = useAppStore((s) => s.booking);
  const branch = useAppStore((s) => s.branches.find((b) => b.id === s.branchId));
  const barber = useAppStore((s) => s.barbers.find((b) => b.id === s.booking?.barberId));
  const services = useAppStore((s) => s.services);
  const currency = useAppStore((s) => s.settings?.currency);

  if (!booking) return null;
  const selected = resolveSelectedServices(services, booking.selectedServices);

  return (
    <div className="booking-summary">
      <div className="booking-summary-row">
        <span className="booking-summary-label">{tr("changeBranch")}</span>
        <span className="booking-summary-value">{branch?.name || "-"}</span>
      </div>
      <div className="booking-summary-row">
        <span className="booking-summary-label">{tr("services")}</span>
        <span className="booking-summary-value">{selected.map((s) => serviceName(s, lang)).join(", ") || "-"}</span>
      </div>
      <div className="booking-summary-row">
        <span className="booking-summary-label">{tr("barber")}</span>
        <span className="booking-summary-value">{barber?.name || "-"}</span>
      </div>
      <div className="booking-summary-row">
        <span className="booking-summary-label">{tr("time")}</span>
        <span className="booking-summary-value">{booking.slot ? booking.slot.label : "-"}</span>
      </div>
      <div className="booking-summary-row booking-summary-total">
        <span className="booking-summary-label">{tr("total")}</span>
        <span className="booking-summary-value">{formatMoney(totalPrice(selected), currency, lang)}</span>
      </div>
      {booking.error && (
        <div className="muted" style={{ marginTop: 10 }}>
          {displayError(booking.error, tr)}
        </div>
      )}
    </div>
  );
}

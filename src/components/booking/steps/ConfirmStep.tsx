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
    <div className="card">
      <div style={{ marginBottom: 8 }}>
        <strong>{branch?.name || "-"}</strong>
      </div>
      <div className="muted">{selected.map((s) => serviceName(s, lang)).join(", ") || "-"}</div>
      <div className="muted" style={{ marginTop: 6 }}>
        {tr("barber")}: <strong>{barber?.name || "-"}</strong>
      </div>
      <div className="muted" style={{ marginTop: 6 }}>
        {tr("time")}: <strong>{booking.slot ? booking.slot.label : "-"}</strong>
      </div>
      <h2 style={{ marginTop: 10 }}>{formatMoney(totalPrice(selected), currency, lang)}</h2>
      {booking.error && (
        <div className="muted" style={{ marginTop: 10 }}>
          {displayError(booking.error, tr)}
        </div>
      )}
    </div>
  );
}

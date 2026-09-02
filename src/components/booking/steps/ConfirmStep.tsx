import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";
import { resolveSelectedServices, totalPrice, serviceName } from "../../../utils/booking";
import { formatMoney } from "../../../utils/money";
import { displayError } from "../../../utils/errorDisplay";
import { formatSlotTime } from "../../../utils/businessHours";
import { resolveMediaUrl } from "../../../utils/media";
import { IconCalendar } from "../../shell/icons";

/** Deliberately no star rating/review count here — same real-fields-only
 * stance as BranchesView.tsx: this app has no aggregate branch rating
 * anywhere in the backend, so showing one would just be fabricated. Real
 * fields only: cover photo (when the branch has one), name, address. */
export function ConfirmStep() {
  const { tr, lang } = useTranslation();
  const booking = useAppStore((s) => s.booking);
  const branch = useAppStore((s) => s.branches.find((b) => b.id === s.branchId));
  const barber = useAppStore((s) => s.barbers.find((b) => b.id === s.booking?.barberId));
  const services = useAppStore((s) => s.services);
  const currency = useAppStore((s) => s.settings?.currency);
  const allowCustomerCancel = useAppStore((s) => s.settings?.allowCustomerCancel !== false);

  if (!booking) return null;
  const selected = resolveSelectedServices(services, booking.selectedServices);
  const slot = booking.slot;

  return (
    <div className="grid">
      <div className="card confirm-salon-card">
        {branch?.coverPhotoUrl && (
          <div className="confirm-salon-photo" style={{ backgroundImage: `url('${resolveMediaUrl(branch.coverPhotoUrl)}')` }} />
        )}
        <div className="branch-list-head">
          <h3>{branch?.name || "-"}</h3>
        </div>
        {(branch?.address || branch?.city) && (
          <div className="muted branch-list-area">{[branch?.address, branch?.city].filter(Boolean).join(" — ")}</div>
        )}
      </div>

      {slot && (
        <div className="confirm-appointment-row">
          <IconCalendar />
          <div>
            <strong>{new Date(`${booking.date}T12:00:00`).toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" })}</strong>
            <div className="meta">
              {formatSlotTime(slot.start, lang)}–{formatSlotTime(slot.end, lang)}
            </div>
          </div>
        </div>
      )}

      <div className="booking-summary">
        {selected.map((s) => (
          <div className="booking-summary-row" key={s.id}>
            <span>
              <span className="booking-summary-label" style={{ color: "var(--text)" }}>
                {serviceName(s, lang)}
              </span>
              <div className="meta">
                {s.duration} {tr("min")}
                {barber?.name ? ` · ${barber.name}` : ""}
              </div>
            </span>
            <span className="booking-summary-value">{formatMoney(s.price, currency, lang)}</span>
          </div>
        ))}
        <div className="booking-summary-row booking-summary-total">
          <span className="booking-summary-label">{tr("total")}</span>
          <span className="booking-summary-value">{formatMoney(totalPrice(selected), currency, lang)}</span>
        </div>
      </div>

      <div>
        <div className="section-label">{tr("cancellationPolicyTitle")}</div>
        <div className="consent-policy">{tr(allowCustomerCancel ? "cancellationPolicyFree" : "cancellationPolicyRestricted")}</div>
      </div>

      {booking.error && <div className="muted">{displayError(booking.error, tr)}</div>}
    </div>
  );
}

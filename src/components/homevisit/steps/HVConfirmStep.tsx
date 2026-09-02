import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";
import { resolveSelectedServices, serviceName, totalPrice } from "../../../utils/booking";
import { formatMoney } from "../../../utils/money";
import { PROVISIONAL_TRAVEL_FEE } from "../constants";
import { formatSlotTime } from "../../../utils/businessHours";
import type { HomeVisitWizard } from "../useHomeVisitWizard";

export function HVConfirmStep({ wizard }: { wizard: HomeVisitWizard }) {
  const { tr, lang } = useTranslation();
  const services = useAppStore((s) => s.services);
  const barber = useAppStore((s) => s.barbers.find((b) => b.id === wizard.state.barberId));
  const currency = useAppStore((s) => s.settings?.currency);
  const { state } = wizard;

  const selected = resolveSelectedServices(services, state.selectedServices);
  const servicesTotal = totalPrice(selected);
  const estimatedTotal = servicesTotal + PROVISIONAL_TRAVEL_FEE;

  return (
    <div className="card">
      <div style={{ marginBottom: 8 }}>
        <strong>{tr("address")}</strong>
        <div className="muted">{state.location?.address || `${state.location?.lat}, ${state.location?.lng}`}</div>
      </div>
      <div className="muted">{selected.map((s) => serviceName(s, lang)).join(", ") || "-"}</div>
      <div className="muted" style={{ marginTop: 6 }}>
        {tr("barber")}: <strong>{barber?.name || "-"}</strong>
      </div>
      <div className="muted" style={{ marginTop: 6 }}>
        {tr("time")}: <strong>{state.slot ? formatSlotTime(state.slot.start, lang) : "-"}</strong>
      </div>
      <div className="muted" style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <span>{tr("services")}</span>
        <span>{formatMoney(servicesTotal, currency, lang)}</span>
      </div>
      <div className="muted" style={{ marginTop: 4, display: "flex", justifyContent: "space-between" }}>
        <span>{tr("travelFeeLabel")}</span>
        <span>{formatMoney(PROVISIONAL_TRAVEL_FEE, currency, lang)}</span>
      </div>
      <h2 style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <span>{tr("total")}</span>
        <span>{formatMoney(estimatedTotal, currency, lang)}</span>
      </h2>
      <p className="muted" style={{ fontSize: 12.5 }}>{tr("travelFeeNote")}</p>
      {state.error && (
        <p className="muted" style={{ color: "var(--danger)", marginTop: 8 }}>
          {state.error}
        </p>
      )}
    </div>
  );
}

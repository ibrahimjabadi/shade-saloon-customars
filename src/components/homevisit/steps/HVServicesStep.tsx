import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";
import { serviceName } from "../../../utils/booking";
import { formatMoney } from "../../../utils/money";
import type { HomeVisitWizard } from "../useHomeVisitWizard";

export function HVServicesStep({ wizard }: { wizard: HomeVisitWizard }) {
  const { tr, lang } = useTranslation();
  const services = useAppStore((s) => s.services);
  const currency = useAppStore((s) => s.settings?.currency);

  if (!services.length) return <p className="muted">{tr("noServices")}</p>;

  return (
    <div className="grid">
      {services.map((s) => {
        const selected = wizard.state.selectedServices.includes(s.id);
        return (
          <div className="service-row" key={s.id}>
            <div style={{ cursor: "pointer" }} onClick={() => wizard.toggleService(s.id)}>
              <strong>{serviceName(s, lang)}</strong>
              <div className="meta">
                {s.duration} {tr("min")} · {formatMoney(s.price, currency, lang)}
              </div>
            </div>
            <button className={`service-book-btn ${selected ? "added" : ""}`} onClick={() => wizard.toggleService(s.id)}>
              {selected ? `✓ ${tr("added")}` : tr("book")}
            </button>
          </div>
        );
      })}
    </div>
  );
}

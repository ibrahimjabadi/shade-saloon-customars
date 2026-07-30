import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";
import { resolveMediaUrl } from "../../../utils/media";
import type { HomeVisitWizard } from "../useHomeVisitWizard";

export function HVBarberStep({ wizard }: { wizard: HomeVisitWizard }) {
  const { tr } = useTranslation();
  const branchId = useAppStore((s) => s.branchId);
  const barbers = useAppStore((s) => s.barbers.filter((b) => b.branchId === branchId));

  return (
    <>
      <p className="muted" style={{ marginBottom: 10 }}>{tr("homeVisitBarberNote")}</p>
      <div className="grid">
        {barbers.map((b) => (
          <div
            key={b.id}
            className={`item barber-card ${wizard.state.barberId === b.id ? "selected" : ""}`}
            onClick={() => wizard.setBarber(b.id)}
          >
            <div className="barber-avatar" style={b.photoUrl ? { backgroundImage: `url('${resolveMediaUrl(b.photoUrl)}')` } : undefined}>
              {b.photoUrl ? "" : (b.name || "?").trim()[0] || "?"}
            </div>
            <div>
              <strong>{b.name}</strong>
              <div className="meta">{b.title || ""}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

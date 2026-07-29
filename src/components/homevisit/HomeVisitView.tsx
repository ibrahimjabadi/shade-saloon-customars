import { useTranslation } from "../../hooks/useTranslation";
import { IconHomeVisit } from "../shell/icons";

/** Placeholder tab — entry point reserved for the upcoming "book a barber to
 * come to your home" flow. Intentionally minimal: the booking rules for this
 * (service area, travel fee, barber availability for home visits, etc.)
 * haven't been specified yet. Once they are, this becomes its own wizard
 * (likely reusing the same booking-overlay/step pattern as BookingOverlay). */
export function HomeVisitView() {
  const { tr } = useTranslation();
  return (
    <div className="card empty-state">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "var(--accent)" }}>
        <span style={{ width: 40, height: 40 }}>
          <IconHomeVisit />
        </span>
      </div>
      <h2 style={{ marginBottom: 6, color: "var(--text)" }}>{tr("homeVisitTitle")}</h2>
      <p style={{ fontWeight: 700, color: "var(--accent)", margin: "0 0 6px" }}>{tr("homeVisitComingSoon")}</p>
      <p className="muted">{tr("homeVisitComingSoonHint")}</p>
    </div>
  );
}

import { useTranslation } from "../../hooks/useTranslation";
import { IconHomeVisit } from "../shell/icons";
import { HomeVisitWizard } from "./HomeVisitWizard";

/** Entry point for "book a barber to come to your home". Fully working
 * end-to-end today by bridging through the existing booking-creation
 * endpoint (address + estimated travel fee ride in the `notes` field) —
 * see useHomeVisitWizard's `submit()` for exactly what that trade-off means
 * and why. Once the dedicated home-visit endpoints from the API contract
 * exist, this becomes a real dedicated flow (barber filtering, real
 * availability with a travel buffer, real pricing) instead of a bridge. */
export function HomeVisitView() {
  const { tr } = useTranslation();
  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ width: 26, height: 26, color: "var(--accent)" }}>
            <IconHomeVisit />
          </span>
          <h2 style={{ margin: 0 }}>{tr("homeVisitTitle")}</h2>
        </div>
      </div>
      <HomeVisitWizard />
    </>
  );
}

import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { IconHomeVisit } from "../shell/icons";
import { AddressPicker, type PickedLocation } from "./AddressPicker";

/** Entry point for "book a barber to come to your home". The address picker
 * below is fully functional today (pure client-side: geolocation + a free
 * OSM map, no backend dependency). The rest of the flow — which barbers
 * offer home visits, availability with a travel buffer, the travel fee, and
 * actually submitting the booking — needs new backend endpoints that don't
 * exist yet (see the API contract handed off separately), so it stays a
 * "coming soon" note until those exist. Once they do, this becomes its own
 * multi-step wizard reusing the same pattern as BookingOverlay, with the
 * picked location as its first step's value. */
export function HomeVisitView() {
  const { tr, lang } = useTranslation();
  const [location, setLocation] = useState<PickedLocation | null>(null);

  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ width: 26, height: 26, color: "var(--accent)" }}>
            <IconHomeVisit />
          </span>
          <h2 style={{ margin: 0 }}>{tr("homeVisitTitle")}</h2>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {lang === "ar"
            ? "حدد موقعك أول شي — رح نستخدمه لاحقًا لعرض الحلاقين المتاحين للزيارة المنزلية بمنطقتك."
            : "Start by setting your location — we'll use it to show which barbers can visit your area."}
        </p>
      </div>

      <AddressPicker value={location} onChange={setLocation} />

      <div className="empty-state" style={{ marginTop: 20 }}>
        <p style={{ fontWeight: 700, color: "var(--accent)", margin: "0 0 6px" }}>{tr("homeVisitComingSoon")}</p>
        <p className="muted">{tr("homeVisitComingSoonHint")}</p>
      </div>
    </>
  );
}

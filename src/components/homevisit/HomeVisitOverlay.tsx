import { useEffect, useRef } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { HomeVisitWizard } from "./HomeVisitWizard";

/** Full-screen sheet wrapping HomeVisitWizard (unchanged, still fully
 * self-contained with its own steps/progress/buttons) — this is just the
 * overlay chrome, mirroring BookingOverlay's header/body shell so it reads
 * the same way. Reached from a CTA on Home instead of its own bottom tab;
 * see the `homeVisitOpen` flag in appStore.ts and its Escape/Tab precedence
 * entry in useGlobalOverlayEffects.ts. */
export function HomeVisitOverlay() {
  const { tr, lang } = useTranslation();
  const closeHomeVisit = useAppStore((s) => s.closeHomeVisit);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="booking-overlay" role="dialog" aria-modal="true" aria-label={tr("homeVisitTitle")}>
      <div className="booking-head">
        <h2>{tr("homeVisitTitle")}</h2>
        <button
          ref={closeBtnRef}
          className="booking-close"
          aria-label={lang === "ar" ? "إغلاق" : "Close"}
          onClick={closeHomeVisit}
        >
          ×
        </button>
      </div>
      <div className="booking-body">
        <HomeVisitWizard />
      </div>
    </div>
  );
}

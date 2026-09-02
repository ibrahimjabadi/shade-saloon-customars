import { useEffect, useRef } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { nextDays } from "../../utils/businessHours";
import { useAvailability } from "../../hooks/useAvailability";
import { SkeletonSlotGrid } from "../shell/Skeletons";
import { displayError } from "../../utils/errorDisplay";

export function RescheduleOverlay() {
  const { tr, lang } = useTranslation();
  const reschedule = useAppStore((s) => s.reschedule);
  const closeReschedule = useAppStore((s) => s.closeReschedule);
  const setRescheduleDate = useAppStore((s) => s.setRescheduleDate);
  const setRescheduleSlot = useAppStore((s) => s.setRescheduleSlot);
  const confirmReschedule = useAppStore((s) => s.confirmReschedule);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus once, the first time this overlay mounts — not on every state
  // change while it's open. Because this only runs on mount (empty deps),
  // picking a quick-day or a slot afterward re-renders the component without
  // re-running this effect, so focus is never yanked back here.
  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  const availability = useAvailability(
    reschedule
      ? {
          businessDate: reschedule.date,
          barberId: reschedule.barberId,
          serviceIds: reschedule.serviceIds,
          branchId: reschedule.branchId,
        }
      : null
  );

  if (!reschedule) return null;

  return (
    <div className="booking-overlay" role="dialog" aria-modal="true" aria-label={tr("rescheduleTitle")}>
      <div className="booking-head">
        <h2>{tr("rescheduleTitle")}</h2>
        <button
          ref={closeBtnRef}
          className="booking-close"
          aria-label={lang === "ar" ? "إغلاق" : "Close"}
          onClick={closeReschedule}
        >
          ×
        </button>
      </div>
      <div className="booking-body">
        <div className="quick-days quick-days-scroll">
          {nextDays(14).map((d) => (
            <button
              key={d}
              className={`quick-day ${reschedule.date === d ? "selected" : ""}`}
              onClick={() => setRescheduleDate(d)}
            >
              <span className="quick-day-dow">{new Date(d).toLocaleDateString(lang, { weekday: "short" })}</span>
              <span className="quick-day-num">{new Date(d).toLocaleDateString(lang, { day: "numeric" })}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          {availability.status === "loading" && <SkeletonSlotGrid count={9} />}
          {availability.status === "ready" && availability.slots.length === 0 && (
            <div className="item">
              {tr("noSlots")}
              <br />
              <span className="meta">{tr("noSlotsHint")}</span>
            </div>
          )}
          {availability.status === "ready" && availability.slots.length > 0 && (
            <div className="slot-grid">
              {availability.slots.map((s, i) => (
                <button
                  key={i}
                  className={`slot ${reschedule.slot?.start === s.start ? "selected" : ""}`}
                  onClick={() => setRescheduleSlot(s)}
                >
                  {s.label}
                  <small>{s.endLabel}</small>
                </button>
              ))}
            </div>
          )}
          {availability.status === "error" && <div className="item">{displayError(availability.error, tr)}</div>}
          {reschedule.error && (
            <div className="muted" style={{ marginTop: 10 }}>
              {displayError(reschedule.error, tr)}
            </div>
          )}
        </div>
      </div>
      <div className="booking-footer">
        <div />
        <button
          className="btn gold"
          style={{ width: "auto" }}
          disabled={!reschedule.slot || reschedule.submitting}
          onClick={() => void confirmReschedule()}
        >
          {reschedule.submitting ? tr("loading") : tr("rescheduleConfirm")}
        </button>
      </div>
    </div>
  );
}

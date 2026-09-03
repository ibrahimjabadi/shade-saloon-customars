import { useEffect, useState } from "react";
import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";
import { nextDays, formatSlotTime } from "../../../utils/businessHours";
import { useAvailability } from "../../../hooks/useAvailability";
import { SkeletonSlotGrid } from "../../shell/Skeletons";
import { displayError } from "../../../utils/errorDisplay";
import type { HomeVisitWizard } from "../useHomeVisitWizard";

export function HVTimeStep({ wizard }: { wizard: HomeVisitWizard }) {
  const { tr, lang } = useTranslation();
  const branchId = useAppStore((s) => s.branchId);
  const { state, setDate, setSlot } = wizard;
  const [staleSlotNotice, setStaleSlotNotice] = useState(false);

  const availability = useAvailability({
    businessDate: state.date,
    barberId: state.barberId,
    serviceIds: state.selectedServices,
    branchId,
  });

  // See TimeStep's identical effect: useAvailability polls in the
  // background, so a slot can vanish from the list while this screen is
  // open, not just after a failed submit.
  useEffect(() => {
    if (availability.status !== "ready" || !state.slot) return;
    const stillThere = availability.slots.some((s) => s.start === state.slot!.start);
    if (!stillThere) {
      setSlot(null);
      setStaleSlotNotice(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability.slots]);

  return (
    <>
      <p className="muted" style={{ marginBottom: 10 }}>
        {lang === "ar"
          ? "الأوقات المعروضة حاليًا بدون هامش تنقّل إضافي — رح تنضبط تلقائيًا لما يتوفر نظام توفر مخصص للزيارات المنزلية."
          : "Times shown don't include an extra travel buffer yet — this will adjust automatically once a dedicated home-visit availability system exists."}
      </p>
      <div className="quick-days quick-days-scroll">
        {nextDays(7).map((d) => (
          <button key={d} className={`quick-day ${state.date === d ? "selected" : ""}`} onClick={() => setDate(d)}>
            <span className="quick-day-dow">{new Date(d).toLocaleDateString(lang, { weekday: "short" })}</span>
            <span className="quick-day-num">{new Date(d).toLocaleDateString(lang, { day: "numeric" })}</span>
          </button>
        ))}
      </div>
      {state.error && <div className="muted" style={{ marginBottom: 10 }}>{displayError(state.error, tr)}</div>}
      {staleSlotNotice && <div className="muted" style={{ marginBottom: 10 }}>{tr("slotNoLongerAvailable")}</div>}
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
              className={`slot ${state.slot?.start === s.start ? "selected" : ""}`}
              onClick={() => {
                setStaleSlotNotice(false);
                setSlot(s);
              }}
            >
              {formatSlotTime(s.start, lang)}
            </button>
          ))}
        </div>
      )}
      {availability.status === "error" && <div className="item">{displayError(availability.error, tr)}</div>}
    </>
  );
}

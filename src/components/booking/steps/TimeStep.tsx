import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";
import { nextDays } from "../../../utils/businessHours";
import { useAvailability, groupSlotsByPeriod } from "../../../hooks/useAvailability";
import { SkeletonSlotGrid } from "../../shell/Skeletons";
import { displayError } from "../../../utils/errorDisplay";

export function TimeStep() {
  const { tr, lang } = useTranslation();
  const branchId = useAppStore((s) => s.branchId);
  const booking = useAppStore((s) => s.booking);
  const setBkDate = useAppStore((s) => s.setBkDate);
  const setBkSlot = useAppStore((s) => s.setBkSlot);
  const openYearCalendar = useAppStore((s) => s.openYearCalendar);

  const availability = useAvailability(
    booking
      ? {
          businessDate: booking.date,
          barberId: booking.barberId,
          serviceIds: booking.selectedServices,
          branchId,
        }
      : null
  );

  if (!booking) return null;

  const periodLabels = { morning: tr("morning"), afternoon: tr("afternoon"), evening: tr("evening") };
  const grouped = groupSlotsByPeriod(availability.slots);

  return (
    <>
      {/* The original had a second "Show times" button here that manually
          re-triggered the fetch. useAvailability already re-fetches whenever
          date/barber/services change (and on first mount), so that button
          had no case left where it did something the hook wasn't already
          doing — removed rather than kept as a no-op. */}
      <div className="mini-date-head">
        <button className="btn secondary" onClick={openYearCalendar}>
          📅 {booking.date}
        </button>
      </div>
      <div className="quick-days">
        {nextDays(7).map((d) => (
          <button key={d} className={`quick-day ${booking.date === d ? "selected" : ""}`} onClick={() => setBkDate(d)}>
            {new Date(d).toLocaleDateString(lang, { weekday: "short", day: "numeric" })}
          </button>
        ))}
      </div>
      {availability.status === "loading" && <SkeletonSlotGrid count={9} />}
      {availability.status === "ready" && availability.slots.length === 0 && (
        <div className="item">
          {tr("noSlots")}
          <br />
          <span className="meta">{tr("noSlotsHint")}</span>
        </div>
      )}
      {availability.status === "ready" &&
        grouped.map((p) => (
          <div key={p.key}>
            <h4 className="muted">{periodLabels[p.key]}</h4>
            <div className="slot-grid">
              {p.slots.map((s, i) => (
                <button
                  key={i}
                  className={`slot ${booking.slot?.start === s.start ? "selected" : ""}`}
                  onClick={() => setBkSlot(s)}
                >
                  {s.label}
                  <small>{s.endLabel}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
      {availability.status === "error" && <div className="item">{displayError(availability.error, tr)}</div>}
    </>
  );
}

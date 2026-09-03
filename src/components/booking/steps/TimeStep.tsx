import { useEffect, useState } from "react";
import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";
import { nextDays, formatSlotTime } from "../../../utils/businessHours";
import { useAvailability } from "../../../hooks/useAvailability";
import { SkeletonSlotGrid } from "../../shell/Skeletons";
import { displayError } from "../../../utils/errorDisplay";
import { IconCalendar } from "../../shell/icons";

export function TimeStep() {
  const { tr, lang } = useTranslation();
  const branchId = useAppStore((s) => s.branchId);
  const booking = useAppStore((s) => s.booking);
  const setBkDate = useAppStore((s) => s.setBkDate);
  const setBkSlot = useAppStore((s) => s.setBkSlot);
  const openYearCalendar = useAppStore((s) => s.openYearCalendar);
  const [staleSlotNotice, setStaleSlotNotice] = useState(false);

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

  // useAvailability polls in the background (see its own comment), so a
  // slot someone else just took can vanish from the list while it's on
  // screen, not just after this customer's own Confirm tap fails. If that
  // slot happened to be the one already selected here, clear it instead of
  // silently leaving a dead selection the customer would only discover at
  // Confirm.
  useEffect(() => {
    if (availability.status !== "ready" || !booking?.slot) return;
    const stillThere = availability.slots.some((s) => s.start === booking.slot!.start);
    if (!stillThere) {
      setBkSlot(null);
      setStaleSlotNotice(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability.slots]);

  if (!booking) return null;

  return (
    <>
      {/* The original had a second "Show times" button here that manually
          re-triggered the fetch. useAvailability already re-fetches whenever
          date/barber/services change (and on first mount), so that button
          had no case left where it did something the hook wasn't already
          doing — removed rather than kept as a no-op. */}
      <div className="mini-date-head">
        <button className="btn secondary date-picker-trigger" onClick={openYearCalendar}>
          <IconCalendar /> {new Date(`${booking.date}T12:00:00`).toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" })}
        </button>
      </div>
      <div className="quick-days quick-days-scroll">
        {nextDays(7).map((d) => (
          <button key={d} className={`quick-day ${booking.date === d ? "selected" : ""}`} onClick={() => setBkDate(d)}>
            <span className="quick-day-dow">{new Date(d).toLocaleDateString(lang, { weekday: "short" })}</span>
            <span className="quick-day-num">{new Date(d).toLocaleDateString(lang, { day: "numeric" })}</span>
          </button>
        ))}
      </div>
      {/* Shown when confirmBooking() sent the user back here after the slot
          they'd picked stopped working (most often: someone else booked it
          first) -- explains why they landed back on Time instead of Confirm,
          on top of the corrected list TimeStep always refetches on mount. */}
      {booking.error && <div className="muted" style={{ marginBottom: 10 }}>{displayError(booking.error, tr)}</div>}
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
              className={`slot ${booking.slot?.start === s.start ? "selected" : ""}`}
              onClick={() => {
                setStaleSlotNotice(false);
                setBkSlot(s);
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

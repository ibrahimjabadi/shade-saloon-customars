import { useEffect } from "react";
import { useAppStore } from "../store/appStore";
import { trapTabKey } from "../utils/focusTrap";
import { useRequestCloseBooking } from "./useBookingOverlayClose";

/** Wires two document-level concerns that only make sense once, at the app
 * shell: online/offline tracking, and the Escape/Tab precedence chain across
 * whichever overlay is currently topmost (year calendar > reschedule >
 * booking wizard — same order as the original vanilla-JS app, see
 * legacy-vanilla-app/app.js). Centralized here for the same reason it was
 * centralized there: if the year calendar and the booking overlay each
 * trapped Tab independently, the booking overlay's trap would yank focus
 * back out of the calendar sitting on top of it. */
export function useGlobalOverlayEffects() {
  const setOffline = useAppStore((s) => s.setOffline);
  const closeReschedule = useAppStore((s) => s.closeReschedule);
  const closeYearCalendar = useAppStore((s) => s.closeYearCalendar);
  const requestCloseBooking = useRequestCloseBooking();

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setOffline]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const { yearCalendarOpen, booking, reschedule } = useAppStore.getState();
      if (e.key === "Tab") {
        if (yearCalendarOpen) {
          trapTabKey(e, ".year-modal");
          return;
        }
        if (booking || reschedule) {
          trapTabKey(e, ".booking-overlay");
          return;
        }
        return;
      }
      if (e.key !== "Escape") return;
      if (yearCalendarOpen) {
        closeYearCalendar();
        return;
      }
      if (reschedule) {
        closeReschedule();
        return;
      }
      if (booking) requestCloseBooking();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeReschedule, closeYearCalendar, requestCloseBooking]);
}

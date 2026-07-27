import { useAppStore, type BookingWizardState } from "../store/appStore";
import { useTranslation } from "./useTranslation";

function hasUnsavedProgress(b: BookingWizardState | null): boolean {
  if (!b || b.success) return false; // nothing to lose once it's actually booked
  return b.selectedServices.length > 0 || !!b.barberId || !!b.slot;
}

/** A native confirm() here is a deliberate, minimal choice — closing
 * mid-booking is a rare, low-frequency interruption, so a plain dialog is
 * fine and avoids building a whole second modal system for one case. */
export function useRequestCloseBooking() {
  const { tr } = useTranslation();
  return () => {
    const b = useAppStore.getState().booking;
    if (hasUnsavedProgress(b) && !window.confirm(`${tr("unsavedTitle")}\n${tr("unsavedBody")}`)) return;
    useAppStore.getState().closeBooking();
  };
}

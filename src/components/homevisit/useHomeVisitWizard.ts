import { useState } from "react";
import type { PickedLocation } from "./AddressPicker";
import type { Booking, Slot } from "../../api/types";
import { api, resolveErrorMessage } from "../../api/client";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { formatMoney } from "../../utils/money";
import { PROVISIONAL_TRAVEL_FEE } from "./constants";

export interface HomeVisitState {
  step: number;
  location: PickedLocation | null;
  selectedServices: string[];
  barberId: string;
  date: string;
  slot: Slot | null;
  submitting: boolean;
  error: string | null;
  success: Booking | null;
}

const STEP_ADDRESS = 0;
const STEP_SERVICES = 1;
const STEP_BARBER = 2;
const STEP_TIME = 3;
const STEP_ACCOUNT = 4;
const STEP_CONFIRM = 5;

function initialState(): HomeVisitState {
  return {
    step: STEP_ADDRESS,
    location: null,
    selectedServices: [],
    barberId: "",
    date: new Date().toISOString().slice(0, 10),
    slot: null,
    submitting: false,
    error: null,
    success: null,
  };
}

/** Local (not global-store) state for the home-visit wizard — deliberately
 * kept separate from the in-branch BookingOverlay/appStore booking state
 * since the two flows differ (address step, no branch-switch concern here)
 * and this whole feature is still provisional pending the real backend
 * endpoints from the home-visit API contract. Once those exist, the
 * submission/pricing bits below are exactly what needs to change. */
export function useHomeVisitWizard() {
  const [state, setState] = useState<HomeVisitState>(initialState);
  const { tr, lang } = useTranslation();
  const account = useAppStore((s) => s.account);
  const branchId = useAppStore((s) => s.branchId);
  const token = useAppStore((s) => s.token);

  function stepsList() {
    return account
      ? [STEP_ADDRESS, STEP_SERVICES, STEP_BARBER, STEP_TIME, STEP_CONFIRM]
      : [STEP_ADDRESS, STEP_SERVICES, STEP_BARBER, STEP_TIME, STEP_ACCOUNT, STEP_CONFIRM];
  }

  function setLocation(location: PickedLocation) {
    setState((s) => ({ ...s, location }));
  }
  function toggleService(id: string) {
    setState((s) => {
      const has = s.selectedServices.includes(id);
      return {
        ...s,
        selectedServices: has ? s.selectedServices.filter((x) => x !== id) : [...s.selectedServices, id],
        slot: null,
      };
    });
  }
  function setBarber(id: string) {
    setState((s) => ({ ...s, barberId: id, slot: null }));
  }
  function setDate(date: string) {
    setState((s) => ({ ...s, date, slot: null }));
  }
  function setSlot(slot: Slot | null) {
    setState((s) => ({ ...s, slot }));
  }
  function jumpToConfirm() {
    setState((s) => ({ ...s, step: STEP_CONFIRM }));
  }

  function canAdvance(): boolean {
    if (state.step === STEP_ADDRESS) return !!state.location;
    if (state.step === STEP_SERVICES) return state.selectedServices.length > 0;
    if (state.step === STEP_BARBER) return !!state.barberId;
    if (state.step === STEP_TIME) return !!state.slot;
    if (state.step === STEP_ACCOUNT) return !!account;
    return true;
  }
  function next() {
    if (!canAdvance()) return;
    const list = stepsList();
    const pos = list.indexOf(state.step);
    if (pos < list.length - 1) setState((s) => ({ ...s, step: list[pos + 1] }));
  }
  function prev() {
    const list = stepsList();
    const pos = list.indexOf(state.step);
    if (pos > 0) setState((s) => ({ ...s, step: list[pos - 1] }));
  }

  /** Bridges this booking through the existing /api/customer/bookings
   * endpoint (same one the in-branch wizard uses) rather than waiting for a
   * dedicated home-visit endpoint: the address and estimated travel fee are
   * written into the `notes` field the endpoint already accepts, so branch
   * staff reading the booking's notes see exactly where to go. This makes
   * the booking real today (same status/cancel/reschedule handling as any
   * other), at the cost of relying on staff actually reading notes and not
   * charging the travel fee through any real payment/total field. */
  async function submit() {
    if (state.submitting || !state.slot || !state.location) return;
    setState((s) => ({ ...s, submitting: true, error: null }));
    const addressLine = state.location.address || `${state.location.lat}, ${state.location.lng}`;
    const notes = [
      tr("homeVisitNotesPrefix"),
      `${tr("addressLabel")}: ${addressLine}`,
      `${tr("coordinatesLabel")}: ${state.location.lat}, ${state.location.lng}`,
      `${tr("travelFeeLabel")}: ${formatMoney(PROVISIONAL_TRAVEL_FEE, undefined, lang)}`,
    ].join("\n");
    try {
      const res = await api<Booking>("/api/customer/bookings", {
        method: "POST",
        token,
        body: JSON.stringify({
          branchId,
          barberId: state.barberId,
          serviceIds: state.selectedServices,
          start: state.slot.start,
          notes,
        }),
      });
      setState((s) => ({ ...s, submitting: false, success: res }));
    } catch (err) {
      setState((s) => ({ ...s, submitting: false, error: resolveErrorMessage(err, tr) }));
    }
  }

  function reset() {
    setState(initialState());
  }

  return {
    state,
    stepsList,
    setLocation,
    toggleService,
    setBarber,
    setDate,
    setSlot,
    jumpToConfirm,
    canAdvance,
    next,
    prev,
    submit,
    reset,
    STEP_ADDRESS,
    STEP_SERVICES,
    STEP_BARBER,
    STEP_TIME,
    STEP_ACCOUNT,
    STEP_CONFIRM,
  };
}

export type HomeVisitWizard = ReturnType<typeof useHomeVisitWizard>;

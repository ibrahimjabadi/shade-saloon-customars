import { useState } from "react";
import type { PickedLocation } from "./AddressPicker";
import type { Booking, Slot } from "../../api/types";
import { api, resolveErrorMessage, ApiError } from "../../api/client";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { formatMoney } from "../../utils/money";

/** GET /api/home-visit/quote: the trip fee for this address, from the
 * distance tiers the salon sets in Settings (the server recomputes it on
 * booking, so this is only for showing the customer). */
export interface HomeVisitQuote {
  ok: boolean;
  fee?: number;
  distanceKm?: number;
  error?: string;
}

export interface HomeVisitState {
  step: number;
  location: PickedLocation | null;
  selectedServices: string[];
  barberId: string;
  date: string;
  slot: Slot | null;
  quote: HomeVisitQuote | null;
  quoteLoading: boolean;
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
    quote: null,
    quoteLoading: false,
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
    setState((s) => ({ ...s, location, quote: null, quoteLoading: true }));
    const qs = new URLSearchParams({ branchId, lat: String(location.lat), lng: String(location.lng) }).toString();
    api<HomeVisitQuote>(`/api/home-visit/quote?${qs}`)
      .then((quote) => setState((s) => (s.location === location ? { ...s, quote, quoteLoading: false } : s)))
      .catch((err) => setState((s) => (s.location === location ? { ...s, quote: { ok: false, error: resolveErrorMessage(err, tr) }, quoteLoading: false } : s)));
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
    setState((s) => ({ ...s, barberId: id, slot: null, error: null }));
  }
  function setDate(date: string) {
    setState((s) => ({ ...s, date, slot: null, error: null }));
  }
  function setSlot(slot: Slot | null) {
    setState((s) => ({ ...s, slot, error: null }));
  }
  function jumpToConfirm() {
    setState((s) => ({ ...s, step: STEP_CONFIRM }));
  }

  function canAdvance(): boolean {
    if (state.step === STEP_ADDRESS) return !!state.location && !!state.quote?.ok;
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

  /** Books through /api/customer/bookings with a `homeVisit` object: the
   * server prices the trip itself, adds it to the booking total, shows the
   * booking as a home visit to staff and keeps the trip time free. The
   * address also goes into notes as a readable fallback. */
  async function submit() {
    if (state.submitting || !state.slot || !state.location) return;
    setState((s) => ({ ...s, submitting: true, error: null }));
    const addressLine = state.location.address || `${state.location.lat}, ${state.location.lng}`;
    const notes = [
      tr("homeVisitNotesPrefix"),
      `${tr("addressLabel")}: ${addressLine}`,
      `${tr("coordinatesLabel")}: ${state.location.lat}, ${state.location.lng}`,
      `${tr("travelFeeLabel")}: ${formatMoney(state.quote?.fee || 0, undefined, lang)}`,
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
          homeVisit: { lat: state.location.lat, lng: state.location.lng, address: addressLine },
        }),
      });
      setState((s) => ({ ...s, submitting: false, success: res }));
    } catch (err) {
      // Same reasoning as the in-branch wizard's confirmBooking(): only a
      // real ApiError rejection (the server evaluated the request and
      // refused it -- someone else took the slot, or it's now outside
      // schedule) means the chosen time itself stopped working, so only
      // that case sends the user back to Time with the slot cleared. A
      // network/timeout failure leaves the selection in place -- the slot
      // is most likely still fine, so retrying is one tap, not a re-pick.
      const isRealRejection = err instanceof ApiError;
      setState((s) => ({
        ...s,
        submitting: false,
        error: resolveErrorMessage(err, tr),
        ...(isRealRejection ? { slot: null, step: STEP_TIME } : {}),
      }));
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

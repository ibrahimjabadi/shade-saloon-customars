import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AvailabilityResponse, Slot } from "../api/types";
import { useAppStore } from "../store/appStore";

export interface AvailabilityParams {
  businessDate: string;
  barberId: string;
  serviceIds: string[];
  branchId: string;
  // Bump this (e.g. a counter) to force a refetch even when nothing else
  // changed -- needed by callers that stay mounted across a failed booking
  // attempt (RescheduleOverlay), unlike TimeStep/HVTimeStep which naturally
  // refetch by unmounting/remounting when the wizard steps away and back.
  refreshKey?: number;
}

type AvailabilityState =
  | { status: "idle"; slots: Slot[] }
  | { status: "loading"; slots: Slot[] }
  | { status: "error"; slots: Slot[]; error: string }
  | { status: "ready"; slots: Slot[] };

// Background refresh interval while a slot list is on screen. A customer
// sitting on the time picker should see a slot vanish as soon as someone
// else takes it, not just discover it the hard way after their own Confirm
// tap fails -- that reactive recovery still exists (see confirmBooking()/
// confirmReschedule()/useHomeVisitWizard's submit()) as the last line of
// defense, this is what keeps the list itself honest the whole time it's
// visible. 20s balances "stays current" against hammering the endpoint
// from every customer with the picker open.
const BACKGROUND_REFRESH_MS = 20000;

/** Same intent as the original loadSlots()/loadRescheduleSlots(): fetch
 * availability for the current date/barber/services combo, and make sure a
 * fast date/barber switch cancels the stale in-flight request instead of
 * letting it race the newest one. Here that's just useEffect's cleanup
 * function aborting the previous request — no manual __slotsAbort
 * bookkeeping needed, React already re-runs this per dependency change. */
export function useAvailability(params: AvailabilityParams | null): AvailabilityState {
  const token = useAppStore((s) => s.token);
  const [state, setState] = useState<AvailabilityState>({ status: "idle", slots: [] });

  useEffect(() => {
    if (!params || !params.barberId || !params.serviceIds.length || !params.businessDate) {
      setState({ status: "idle", slots: [] });
      return;
    }
    let cancelled = false;
    const qs = new URLSearchParams({
      businessDate: params.businessDate,
      barberId: params.barberId,
      serviceIds: params.serviceIds.join(","),
      branchId: params.branchId,
    }).toString();

    // isBackgroundRefresh skips the loading state (and its skeleton) --
    // periodic re-fetches should silently swap in fresh data, not blank
    // the list every 20s while the customer is looking at it.
    function load(isBackgroundRefresh: boolean) {
      const controller = new AbortController();
      if (!isBackgroundRefresh) setState({ status: "loading", slots: [] });
      api<AvailabilityResponse>(`/api/availability?${qs}`, { signal: controller.signal, token })
        .then((d) => {
          if (cancelled) return;
          setState({ status: "ready", slots: d.slots || [] });
        })
        .catch((err) => {
          if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
          // A background refresh failing (e.g. a dropped connection) isn't
          // worth surfacing as an error over a list that's already showing
          // -- just skip this tick and try again on the next one.
          if (isBackgroundRefresh) return;
          setState({ status: "error", slots: [], error: "__key:errGeneric" });
        });
      return controller;
    }

    let controller = load(false);
    const interval = setInterval(() => {
      controller.abort();
      controller = load(true);
    }, BACKGROUND_REFRESH_MS);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.businessDate, params?.barberId, params?.serviceIds.join(","), params?.branchId, params?.refreshKey, token]);

  return state;
}

export interface SlotPeriod {
  key: "morning" | "afternoon" | "evening";
  slots: Slot[];
}

/** A branch that closes after midnight (e.g. 09:00-03:00) generates slots
 * that roll into the next calendar day. Bucketing by raw getHours() alone
 * put those post-midnight slots (hour 0, 1, 2...) back in the "morning"
 * bucket, right after the real 9-11 AM slots and ahead of the afternoon/
 * evening sections that chronologically come first — exactly the
 * "shuffled" order a customer flagged as looking chaotic. Bucketing by
 * hours-elapsed-since-businessDate's local midnight instead means a
 * post-midnight slot lands past 24h, so it correctly sorts into "evening"
 * (the tail end of the same continuous open session) rather than looping
 * back to "morning". businessDate is optional only so a bare hour-of-day
 * grouping still works if a future caller has no date in hand; every
 * current call site has one and should pass it. */
export function groupSlotsByPeriod(slots: Slot[], businessDate?: string): SlotPeriod[] {
  const midnight = businessDate ? new Date(`${businessDate}T00:00:00`) : null;
  const elapsedHours = (s: Slot) => {
    const start = new Date(s.start);
    if (!midnight || Number.isNaN(midnight.getTime())) return start.getHours();
    return (start.getTime() - midnight.getTime()) / 3600000;
  };
  const periods: { key: SlotPeriod["key"]; test: (h: number) => boolean }[] = [
    { key: "morning", test: (h) => h < 12 },
    { key: "afternoon", test: (h) => h >= 12 && h < 17 },
    { key: "evening", test: (h) => h >= 17 },
  ];
  return periods
    .map((p) => ({ key: p.key, slots: slots.filter((s) => p.test(elapsedHours(s))) }))
    .filter((p) => p.slots.length > 0);
}

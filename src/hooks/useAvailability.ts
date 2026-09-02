import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AvailabilityResponse, Slot } from "../api/types";
import { useAppStore } from "../store/appStore";

export interface AvailabilityParams {
  businessDate: string;
  barberId: string;
  serviceIds: string[];
  branchId: string;
}

type AvailabilityState =
  | { status: "idle"; slots: Slot[] }
  | { status: "loading"; slots: Slot[] }
  | { status: "error"; slots: Slot[]; error: string }
  | { status: "ready"; slots: Slot[] };

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
    const controller = new AbortController();
    setState({ status: "loading", slots: [] });
    const qs = new URLSearchParams({
      businessDate: params.businessDate,
      barberId: params.barberId,
      serviceIds: params.serviceIds.join(","),
      branchId: params.branchId,
    });
    api<AvailabilityResponse>(`/api/availability?${qs.toString()}`, { signal: controller.signal, token })
      .then((d) => setState({ status: "ready", slots: d.slots || [] }))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error", slots: [], error: "__key:errGeneric" });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.businessDate, params?.barberId, params?.serviceIds.join(","), params?.branchId, token]);

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

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

export function groupSlotsByPeriod(slots: Slot[]): SlotPeriod[] {
  const periods: { key: SlotPeriod["key"]; test: (h: number) => boolean }[] = [
    { key: "morning", test: (h) => h < 12 },
    { key: "afternoon", test: (h) => h >= 12 && h < 17 },
    { key: "evening", test: (h) => h >= 17 },
  ];
  return periods
    .map((p) => ({ key: p.key, slots: slots.filter((s) => p.test(new Date(s.start).getHours())) }))
    .filter((p) => p.slots.length > 0);
}

import { useEffect, useState } from "react";
import { api } from "./api";
import type { Slot } from "./types";

export type BarberSlot = Slot & { barberId: string };
export type SlotsState = { status: "idle" | "loading" | "ready" | "error"; slots: BarberSlot[]; error?: string };

/** Free times for a day. With several barbers ("any barber") it asks for
 * each and merges, keeping the first barber free at each time. Re-fetches
 * whenever the inputs change, or `refresh` bumps (after a slot was taken). */
export function useSlots(date: string, barberIds: string[], serviceIds: string[], branchId: string, home: boolean, refresh = 0): SlotsState {
  const [st, setSt] = useState<SlotsState>({ status: "idle", slots: [] });
  const key = `${date}|${barberIds.join(",")}|${serviceIds.join(",")}|${branchId}|${home}|${refresh}`;
  useEffect(() => {
    if (!date || !barberIds.length || !serviceIds.length) { setSt({ status: "idle", slots: [] }); return; }
    const ctl = new AbortController();
    setSt((s) => ({ status: "loading", slots: s.slots }));
    Promise.all(barberIds.map((barberId) => {
      const qs = new URLSearchParams({ businessDate: date, barberId, serviceIds: serviceIds.join(","), branchId, ...(home ? { homeVisit: "1" } : {}) });
      return api<{ slots: Slot[] }>(`/api/availability?${qs}`, { signal: ctl.signal }).then((r) => r.slots.map((s) => ({ ...s, barberId })));
    }))
      .then((lists) => {
        const by = new Map<string, BarberSlot>();
        lists.flat().forEach((s) => { if (!by.has(s.start)) by.set(s.start, s); });
        const now = Date.now();
        setSt({ status: "ready", slots: [...by.values()].filter((s) => new Date(s.start).getTime() > now).sort((a, b) => a.start.localeCompare(b.start)) });
      })
      .catch((e) => { if ((e as Error).name !== "AbortError") setSt({ status: "error", slots: [], error: (e as Error).message }); });
    return () => ctl.abort();
    // key covers every input
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return st;
}

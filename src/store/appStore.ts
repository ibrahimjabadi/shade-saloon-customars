import { create } from "zustand";
import { api, ApiError } from "../api/client";
import { authStorage } from "../api/authStorage";
import type {
  Barber,
  Booking,
  BootstrapResponse,
  Branch,
  CustomerAccount,
  RegisterPayload,
  RegisterResponse,
  Service,
  Settings,
  Slot,
  VerifyChannel,
} from "../api/types";
import type { Lang } from "../i18n/translations";
import { nextDays } from "../utils/businessHours";

// "homeVisit" used to be its own tab; it's now the `homeVisitOpen` overlay
// flag below, reached via a CTA on Home instead of a bottom-tab slot.
// "bookings" and "explore" are no longer bottom-tab destinations either —
// both screens still render exactly as before, just reached via rows in
// Profile's settings list (see ProfileView.tsx) instead of TabBar buttons.
export type Tab = "home" | "bookings" | "explore" | "branches" | "points" | "profile";
export type HomeTab = "services" | "photos" | "staff" | "info";

export interface BookingWizardState {
  step: number;
  selectedServices: string[];
  barberId: string;
  date: string;
  slot: Slot | null;
  cat: string;
  // null = not answered yet (gates the FirstVisit step the same way
  // slot/barberId gate theirs below).
  isFirstVisit: boolean | null;
  success: Booking | null;
  submitting: boolean;
  error: string | null;
}

export interface RescheduleState {
  bookingId: string;
  barberId: string;
  serviceIds: string[];
  branchId: string;
  date: string;
  slot: Slot | null;
  submitting: boolean;
  error: string | null;
}

export interface ReviewState {
  bookingId: string;
  barberId: string;
  barberName: string;
  barberPhotoUrl?: string;
  score: number; // 0 = nothing picked yet
  comment: string;
  submitting: boolean;
  error: string | null;
  success: boolean;
}

interface AppState {
  // ---- language ----
  lang: Lang;
  setLang: (lang: Lang) => void;

  // ---- auth ----
  token: string;
  account: CustomerAccount | null;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => void;
  sendVerification: (channel: VerifyChannel) => Promise<void>;
  confirmVerification: (channel: VerifyChannel, code: string) => Promise<void>;

  // ---- bootstrap / catalog ----
  settings: Settings | null;
  branches: Branch[];
  services: Service[];
  barbers: Barber[];
  branchId: string;
  bootstrapError: string | null;
  bootstrap: () => Promise<void>;
  switchBranch: (id: string) => void;

  // ---- shell ----
  tab: Tab;
  homeTab: HomeTab;
  offline: boolean;
  setTab: (tab: Tab) => void;
  setHomeTab: (tab: HomeTab) => void;
  setOffline: (offline: boolean) => void;

  // ---- my bookings ----
  myBookings: Booking[] | null;
  myBookingsLoading: boolean;
  myBookingsError: string | null;
  myBookingsActionError: string | null;
  loadMyBookings: () => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;

  // ---- explore (profiles/follow bridge — see memory: no backend follow
  // concept exists yet, so "following" is a private per-device bookmark
  // list, not a real synced social feature. Keys are "branch:<id>" or
  // "barber:<id>"). ----
  favorites: string[];
  toggleFavorite: (key: string) => void;

  // ---- booking wizard (rendered as a full-screen overlay regardless of tab) ----
  booking: BookingWizardState | null;
  openBooking: (serviceId?: string, barberId?: string) => void;
  closeBooking: () => void;
  toggleBkService: (id: string) => void;
  setBkBarber: (id: string) => void;
  setBkDate: (date: string) => void;
  setBkSlot: (slot: Slot | null) => void;
  setBkCategory: (cat: string) => void;
  setBkFirstVisit: (v: boolean) => void;
  bookingNext: () => void;
  bookingPrev: () => void;
  jumpToConfirmStep: () => void;
  confirmBooking: () => Promise<void>;

  // ---- year calendar modal (only reachable from the booking wizard's time
  // step; tracked in the store, not local component state, so the global
  // Escape/Tab handler below can give it top keyboard precedence) ----
  yearCalendarOpen: boolean;
  openYearCalendar: () => void;
  closeYearCalendar: () => void;

  // ---- customer satisfaction review (POST /api/customer/bookings/:id/rate
  // -- a real endpoint that already existed backend-side with nothing on
  // the frontend calling it yet) ----
  review: ReviewState | null;
  openReview: (bookingId: string) => void;
  closeReview: () => void;
  setReviewScore: (score: number) => void;
  setReviewComment: (comment: string) => void;
  submitReview: () => Promise<void>;

  // ---- reschedule (its own lighter overlay, same availability endpoint) ----
  reschedule: RescheduleState | null;
  openReschedule: (bookingId: string) => void;
  closeReschedule: () => void;
  setRescheduleDate: (date: string) => void;
  setRescheduleSlot: (slot: Slot | null) => void;
  confirmReschedule: () => Promise<void>;

  // ---- home visit (full-screen overlay wrapping HomeVisitWizard, reached
  // from a CTA on Home rather than its own bottom tab) ----
  homeVisitOpen: boolean;
  openHomeVisit: () => void;
  closeHomeVisit: () => void;
}

function errorMessage(err: unknown, fallbackKey: "errNetwork" | "errGeneric" = "errGeneric"): string {
  if (err instanceof ApiError) return err.serverMessage || `__key:${fallbackKey}`;
  return `__key:errNetwork`;
}

export const useAppStore = create<AppState>()((set, get) => ({
  lang: (localStorage.getItem("customerLang") as Lang) || "ar",
  setLang: (lang) => {
    localStorage.setItem("customerLang", lang);
    set({ lang });
  },

  token: authStorage.getToken(),
  account: authStorage.getAccount(),
  register: async (payload) => {
    const res = await api<RegisterResponse>("/api/customer/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    authStorage.save(res.customerToken, res.account);
    set({ token: res.customerToken, account: res.account });
    return res;
  },
  logout: () => {
    authStorage.clear();
    set({ token: "", account: null, myBookings: null });
  },
  sendVerification: async (channel) => {
    await api<{ ok: boolean }>("/api/customer/verify/send", {
      method: "POST",
      token: get().token,
      body: JSON.stringify({ channel }),
    });
  },
  confirmVerification: async (channel, code) => {
    const res = await api<{ ok: boolean; account: CustomerAccount }>("/api/customer/verify/confirm", {
      method: "POST",
      token: get().token,
      body: JSON.stringify({ channel, code }),
    });
    authStorage.save(get().token, res.account);
    set({ account: res.account });
  },

  settings: null,
  branches: [],
  services: [],
  barbers: [],
  branchId: localStorage.getItem("customerBranchId") || "",
  bootstrapError: null,
  bootstrap: async () => {
    try {
      const d = await api<BootstrapResponse>("/api/bootstrap", { token: get().token });
      const branches = d.branches.filter((b) => b.active !== false);
      const patch: Partial<AppState> = {
        settings: d.settings,
        branches,
        // customerVisible: the backend delivers every service here (even
        // ones an admin marked hidden-from-customers) — /api/public/branch/:id
        // filters this server-side, /api/bootstrap doesn't, so it's filtered
        // here instead.
        services: d.services.filter((s) => s.active !== false && s.customerVisible !== false),
        // frozen/suspended: bootstrap only excludes employeeStatus==="archived"
        // server-side. A frozen/suspended barber would otherwise show up as
        // pickable and then silently return zero slots with no explanation —
        // excluded here so the picker only ever shows barbers who can
        // actually take a booking.
        barbers: d.barbers.filter(
          (b) => b.active !== false && b.employeeStatus !== "frozen" && b.employeeStatus !== "suspended"
        ),
      };
      // Legacy deep link support: a URL ending in /branch/xyz still
      // preselects that branch — no leading-anchor so this matches whether
      // the app is mounted at the domain root ("/branch/xyz") or under a
      // path prefix ("/customer-app/branch/xyz").
      const m = window.location.pathname.match(/\/branch\/([^/]+)/);
      let branchId = m ? decodeURIComponent(m[1]) : get().branchId;
      if (!branchId || !branches.some((b) => b.id === branchId)) branchId = branches[0]?.id || "";
      patch.branchId = branchId;
      set(patch);

      if (get().token) {
        try {
          const account = await api<CustomerAccount>("/api/customer/me", { token: get().token });
          set({ account });
        } catch {
          authStorage.clear();
          set({ token: "", account: null });
        }
      }
    } catch (err) {
      set({ bootstrapError: errorMessage(err) });
    }
  },
  switchBranch: (id) => {
    localStorage.setItem("customerBranchId", id);
    set({ branchId: id, homeTab: "services" });
  },

  tab: "home",
  homeTab: "services",
  offline: typeof navigator !== "undefined" && "onLine" in navigator ? !navigator.onLine : false,
  setTab: (tab) => {
    set({ tab });
    if (tab === "bookings") void get().loadMyBookings();
  },
  setHomeTab: (homeTab) => set({ homeTab }),
  setOffline: (offline) => set({ offline }),

  myBookings: null,
  myBookingsLoading: false,
  myBookingsError: null,
  myBookingsActionError: null,
  loadMyBookings: async () => {
    if (!get().account) return;
    set({ myBookingsLoading: true, myBookingsError: null, myBookingsActionError: null });
    try {
      const d = await api<{ bookings?: Booking[] } | Booking[]>("/api/customer/bookings", { token: get().token });
      const bookings = Array.isArray(d) ? d : d.bookings || [];
      set({ myBookings: bookings, myBookingsLoading: false });
    } catch (err) {
      set({ myBookingsError: errorMessage(err), myBookings: null, myBookingsLoading: false });
    }
  },
  cancelBooking: async (id) => {
    try {
      await api(`/api/customer/bookings/${encodeURIComponent(id)}/cancel`, { method: "POST", token: get().token });
      set({ myBookingsActionError: null });
      await get().loadMyBookings();
    } catch (err) {
      set({ myBookingsActionError: errorMessage(err) });
      throw err;
    }
  },

  favorites: (() => {
    try {
      return JSON.parse(localStorage.getItem("customerFavorites") || "[]");
    } catch {
      return [];
    }
  })(),
  toggleFavorite: (key) =>
    set((s) => {
      const has = s.favorites.includes(key);
      const favorites = has ? s.favorites.filter((k) => k !== key) : [...s.favorites, key];
      localStorage.setItem("customerFavorites", JSON.stringify(favorites));
      return { favorites };
    }),

  booking: null,
  openBooking: (serviceId, barberId) =>
    set({
      booking: {
        step: 0,
        selectedServices: serviceId ? [serviceId] : [],
        barberId: barberId || "",
        date: new Date().toISOString().slice(0, 10),
        slot: null,
        cat: "all",
        isFirstVisit: null,
        success: null,
        submitting: false,
        error: null,
      },
    }),
  closeBooking: () => set({ booking: null }),
  toggleBkService: (id) =>
    set((s) => {
      if (!s.booking) return s;
      const i = s.booking.selectedServices.indexOf(id);
      const selectedServices =
        i >= 0
          ? s.booking.selectedServices.filter((x) => x !== id)
          : [...s.booking.selectedServices, id];
      return { booking: { ...s.booking, selectedServices, slot: null } };
    }),
  setBkBarber: (id) =>
    set((s) => (s.booking ? { booking: { ...s.booking, barberId: id, slot: null } } : s)),
  setBkDate: (date) =>
    set((s) => (s.booking ? { booking: { ...s.booking, date, slot: null } } : s)),
  setBkSlot: (slot) => set((s) => (s.booking ? { booking: { ...s.booking, slot } } : s)),
  setBkCategory: (cat) => set((s) => (s.booking ? { booking: { ...s.booking, cat } } : s)),
  setBkFirstVisit: (v) => set((s) => (s.booking ? { booking: { ...s.booking, isFirstVisit: v } } : s)),
  // Steps: 0 services, 1 barber, 2 time, 3 first-visit question, 4 account
  // (skipped once s.account exists), 5 confirm.
  bookingNext: () =>
    set((s) => {
      const b = s.booking;
      if (!b || b.success) return s;
      if (b.step === 0 && !b.selectedServices.length) return s;
      if (b.step === 1 && !b.barberId) return s;
      if (b.step === 2 && !b.slot) return s;
      if (b.step === 3 && b.isFirstVisit === null) return s;
      if (b.step === 4 && !s.account) return s;
      let next = b.step + 1;
      if (next === 4 && s.account) next = 5;
      return { booking: { ...b, step: Math.min(5, next) } };
    }),
  bookingPrev: () =>
    set((s) => {
      const b = s.booking;
      if (!b) return s;
      let prev = b.step - 1;
      if (prev === 4 && s.account) prev = 3;
      return { booking: { ...b, step: Math.max(0, prev) } };
    }),
  jumpToConfirmStep: () => set((s) => (s.booking ? { booking: { ...s.booking, step: 5 } } : s)),
  confirmBooking: async () => {
    const b = get().booking;
    if (!b || b.submitting || !b.slot) return;
    set({ booking: { ...b, submitting: true, error: null } });
    try {
      const firstVisitNote =
        b.isFirstVisit === null ? "" : b.isFirstVisit ? "أول زيارة: نعم" : "أول زيارة: لا";
      const res = await api<Booking>("/api/customer/bookings", {
        method: "POST",
        token: get().token,
        body: JSON.stringify({
          branchId: get().branchId,
          barberId: b.barberId,
          serviceIds: b.selectedServices,
          start: b.slot.start,
          notes: firstVisitNote,
        }),
      });
      set((s) => (s.booking ? { booking: { ...s.booking, submitting: false, success: res } } : s));
      set({ myBookings: null }); // force a refresh next time the tab is opened
    } catch (err) {
      set((s) => (s.booking ? { booking: { ...s.booking, submitting: false, error: errorMessage(err) } } : s));
    }
  },

  yearCalendarOpen: false,
  openYearCalendar: () => set({ yearCalendarOpen: true }),
  closeYearCalendar: () => set({ yearCalendarOpen: false }),

  review: null,
  openReview: (bookingId) => {
    const bk = (get().myBookings || []).find((x) => x.id === bookingId);
    if (!bk || bk.status !== "completed" || bk.rated) return;
    set({
      review: {
        bookingId,
        barberId: bk.barberId || "",
        barberName: bk.barber?.name || "",
        barberPhotoUrl: bk.barber?.photoUrl,
        score: 0,
        comment: "",
        submitting: false,
        error: null,
        success: false,
      },
    });
  },
  closeReview: () => set({ review: null }),
  setReviewScore: (score) => set((s) => (s.review ? { review: { ...s.review, score, error: null } } : s)),
  setReviewComment: (comment) => set((s) => (s.review ? { review: { ...s.review, comment } } : s)),
  submitReview: async () => {
    const r = get().review;
    if (!r || r.score < 1 || r.submitting) return;
    set({ review: { ...r, submitting: true, error: null } });
    try {
      await api(`/api/customer/bookings/${encodeURIComponent(r.bookingId)}/rate`, {
        method: "POST",
        token: get().token,
        body: JSON.stringify({ score: r.score, comment: r.comment }),
      });
      set((s) => (s.review ? { review: { ...s.review, submitting: false, success: true } } : s));
      void get().loadMyBookings(); // refresh in the background so `rated` is
      // already current once the customer closes this thank-you screen.
    } catch (err) {
      set((s) => (s.review ? { review: { ...s.review, submitting: false, error: errorMessage(err) } } : s));
    }
  },

  reschedule: null,
  openReschedule: (bookingId) => {
    const bk = (get().myBookings || []).find((x) => x.id === bookingId);
    if (!bk) return;
    set({
      reschedule: {
        bookingId,
        barberId: bk.barberId || "",
        serviceIds: bk.serviceIds || [],
        branchId: bk.branchId || get().branchId,
        date: nextDays(1)[0],
        slot: null,
        submitting: false,
        error: null,
      },
    });
  },
  closeReschedule: () => set({ reschedule: null }),
  setRescheduleDate: (date) =>
    set((s) => (s.reschedule ? { reschedule: { ...s.reschedule, date, slot: null } } : s)),
  setRescheduleSlot: (slot) => set((s) => (s.reschedule ? { reschedule: { ...s.reschedule, slot } } : s)),
  confirmReschedule: async () => {
    const r = get().reschedule;
    if (!r || !r.slot || r.submitting) return;
    set({ reschedule: { ...r, submitting: true, error: null } });
    try {
      await api(`/api/customer/bookings/${encodeURIComponent(r.bookingId)}/reschedule`, {
        method: "PATCH",
        token: get().token,
        body: JSON.stringify({ start: r.slot.start }),
      });
      set({ reschedule: null, myBookingsActionError: null });
      await get().loadMyBookings();
    } catch (err) {
      set((s) => (s.reschedule ? { reschedule: { ...s.reschedule, submitting: false, error: errorMessage(err) } } : s));
    }
  },

  homeVisitOpen: false,
  openHomeVisit: () => set({ homeVisitOpen: true }),
  closeHomeVisit: () => set({ homeVisitOpen: false }),
}));

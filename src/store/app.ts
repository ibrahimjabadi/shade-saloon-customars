import { create } from "zustand";
import { api, getToken, setToken, setUnauthorizedHandler } from "../lib/api";
import { translate, type Lang, type TKey } from "../lib/i18n";
import type { Account, Barber, Booking, Branch, Service, Settings } from "../lib/types";

// Everything the whole app shares: language and theme, the salon's public
// data (bootstrap), the signed-in customer, their bookings and favorites,
// which tab is open, and which full-screen flow (booking, reschedule…) is up.
export type Tab = "home" | "book" | "bookings" | "explore" | "account";
export type Flow =
  | { kind: "book"; mode?: "salon" | "home"; serviceId?: string; barberId?: string; branchId?: string }
  | { kind: "reschedule"; booking: Booking }
  | { kind: "review"; booking: Booking }
  | null;

const LS = { lang: "shadi.c.lang", theme: "shadi.c.theme", branch: "shadi.c.branch", favs: "shadi.c.favs" };
const read = (k: string) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const write = (k: string, v: string) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* private mode */ } };

interface State {
  lang: Lang; setLang: (l: Lang) => void;
  theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void;
  ready: boolean; bootError: string;
  settings: Settings; branches: Branch[]; services: Service[]; barbers: Barber[];
  branchId: string; setBranch: (id: string) => void;
  boot: () => Promise<void>;
  account: Account | null;
  signedIn: (token: string, account: Account) => void;
  setAccount: (a: Account) => void;
  logout: () => void;
  tab: Tab; go: (t: Tab) => void;
  flow: Flow; open: (f: Flow) => void; closeFlow: () => void;
  bookings: Booking[] | null; bookingsError: string; loadBookings: () => Promise<void>;
  favorites: string[]; toggleFavorite: (key: string) => void;
  unread: number; loadUnread: () => Promise<void>;
  toast: { msg: string; bad: boolean } | null; say: (msg: string, bad?: boolean) => void;
}

let toastTimer: number | undefined;

export const useApp = create<State>()((set, get) => ({
  lang: (read(LS.lang) as Lang) || "ar",
  setLang: (lang) => { write(LS.lang, lang); set({ lang }); applyDoc(lang, get().theme); },
  theme: (read(LS.theme) as "dark" | "light") || "dark",
  setTheme: (theme) => { write(LS.theme, theme); set({ theme }); applyDoc(get().lang, theme); },

  ready: false, bootError: "",
  settings: {}, branches: [], services: [], barbers: [],
  branchId: read(LS.branch),
  setBranch: (id) => { write(LS.branch, id); set({ branchId: id }); },

  boot: async () => {
    try {
      const d = await api<{ settings: Settings; branches: Branch[]; services: Service[]; barbers: Barber[] }>("/api/bootstrap");
      const branches = d.branches.filter((b) => b.active !== false);
      const barbers = d.barbers.filter((b) => b.active !== false && !["frozen", "suspended", "archived"].includes(b.employeeStatus || ""));
      // deep links: /branch/:id opens that branch, /barber/:id opens booking with them
      const path = location.pathname;
      const linkBranch = /\/branch\/([^/]+)/.exec(path)?.[1];
      const linkBarber = barbers.find((b) => b.id === decodeURIComponent(/\/barber\/([^/]+)/.exec(path)?.[1] || ""));
      let branchId = linkBarber?.branchId || (linkBranch && decodeURIComponent(linkBranch)) || get().branchId;
      if (!branches.some((b) => b.id === branchId)) branchId = branches[0]?.id || "";
      set({ settings: d.settings || {}, branches, services: d.services.filter((s) => s.active !== false && s.customerVisible !== false), barbers, branchId, ready: true });
      applyAccent(d.settings?.customerPortalTheme?.accentColor);
      if (linkBarber) set({ flow: { kind: "book", barberId: linkBarber.id } });
      if (getToken()) {
        try {
          const a = await api<Account>("/api/customer/me");
          set({ account: a });
          await syncFavorites(a);
          void get().loadUnread();
        } catch { /* 401 handler signs out */ }
      }
    } catch (e) {
      set({ bootError: (e as Error).message || "network" });
    }
  },

  account: null,
  signedIn: (token, account) => {
    setToken(token);
    set({ account, bookings: null });
    void syncFavorites(account);
    void get().loadUnread();
  },
  setAccount: (account) => set({ account }),
  logout: () => {
    if (getToken()) void api("/api/customer/auth/logout", { body: {} }).catch(() => {});
    setToken("");
    set({ account: null, bookings: null, unread: 0 });
  },

  tab: "home",
  go: (tab) => {
    if (tab === "book") { set({ flow: { kind: "book" } }); return; }
    set({ tab });
    window.scrollTo(0, 0);
    if (tab === "bookings") void get().loadBookings();
  },
  flow: null,
  open: (flow) => set({ flow }),
  closeFlow: () => set({ flow: null }),

  bookings: null, bookingsError: "",
  loadBookings: async () => {
    if (!get().account) return;
    try {
      const d = await api<Booking[] | { bookings: Booking[] }>("/api/customer/bookings");
      set({ bookings: Array.isArray(d) ? d : d.bookings || [], bookingsError: "" });
    } catch (e) { set({ bookingsError: (e as Error).message || "network" }); }
  },

  favorites: (() => { try { return JSON.parse(read(LS.favs) || "[]"); } catch { return []; } })(),
  toggleFavorite: (key) => {
    const has = get().favorites.includes(key);
    const favorites = has ? get().favorites.filter((k) => k !== key) : [...get().favorites, key];
    set({ favorites });
    write(LS.favs, JSON.stringify(favorites));
    if (get().account) void api("/api/customer/favorites", { method: "PUT", body: { favorites } }).catch(() => {});
  },

  unread: 0,
  loadUnread: async () => {
    if (!get().account) return;
    try { set({ unread: (await api<{ unread: number }>("/api/customer/notifications")).unread }); } catch { /* badge only */ }
  },

  toast: null,
  say: (msg, bad = false) => {
    set({ toast: { msg, bad } });
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => set({ toast: null }), 2800);
  },
}));

/** Favorites used to live on the phone only: merge those into the account
 * once, then the account is the source of truth. */
async function syncFavorites(a: Account) {
  const local = useApp.getState().favorites;
  const server = a.favorites || (await api<string[]>("/api/customer/favorites").catch(() => [] as string[]));
  const merged = [...new Set([...server, ...local])];
  useApp.setState({ favorites: merged });
  write(LS.favs, JSON.stringify(merged));
  if (merged.length !== server.length) void api("/api/customer/favorites", { method: "PUT", body: { favorites: merged } }).catch(() => {});
}

function applyDoc(lang: Lang, theme: string) {
  const h = document.documentElement;
  h.lang = lang;
  h.dir = lang === "ar" ? "rtl" : "ltr";
  h.dataset.theme = theme;
}
/** The salon can pick its own main color (Settings > customer app). */
function applyAccent(hex?: string) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return;
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const s = document.documentElement.style;
  s.setProperty("--gold", hex);
  s.setProperty("--gold-2", hex);
  s.setProperty("--gold-text", hex);
  s.setProperty("--gold-soft", `rgba(${r},${g},${b},.12)`);
  s.setProperty("--gold-line", `rgba(${r},${g},${b},.35)`);
  s.setProperty("--gold-ink", (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#16130C" : "#FFFFFF");
}

setUnauthorizedHandler(() => { setToken(""); useApp.setState({ account: null, bookings: null, unread: 0 }); });
applyDoc(useApp.getState().lang, useApp.getState().theme);

/** t("key") in the current language. */
export function useT() {
  const lang = useApp((s) => s.lang);
  return Object.assign((k: TKey) => translate(lang, k), { lang });
}
/** The message to show for any thrown error. */
export function errText(e: unknown, t: (k: TKey) => string) {
  const m = (e as Error)?.message;
  return !m || m === "network" ? t(m === "network" ? "errNetwork" : "errGeneric") : m;
}

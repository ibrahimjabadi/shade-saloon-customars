import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { Icon } from "./components/Icon";
import { Empty, Loading, Toast } from "./components/ui";
import { haptic } from "./lib/platform";
import { useApp, useT, type Tab } from "./store/app";
import { Home } from "./screens/Home";

// Home is in the main bundle (it's what opens first); the other tabs and the
// booking sheets are separate chunks, fetched quietly once the app is idle.
const loaders = {
  account: () => import("./screens/Account"),
  book: () => import("./screens/book/BookFlow"),
  bookings: () => import("./screens/Bookings"),
  explore: () => import("./screens/Explore"),
  notifications: () => import("./screens/Notifications"),
};
function named<M, K extends keyof M>(load: () => Promise<M>, key: K) {
  return lazy(() => load().then((m) => ({ default: m[key] as unknown as ComponentType<any> })));
}
const Account = named(loaders.account, "Account");
const BookFlow = named(loaders.book, "BookFlow");
const Bookings = named(loaders.bookings, "Bookings");
const Reschedule = named(loaders.bookings, "Reschedule");
const Review = named(loaders.bookings, "Review");
const Explore = named(loaders.explore, "Explore");
const Notifications = named(loaders.notifications, "Notifications");
function prefetch() {
  const go = () => Object.values(loaders).forEach((load) => load().catch(() => {}));
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 4000 });
  else setTimeout(go, 1500);
}

const TABS: [Tab, string, "tabHome" | "tabBook" | "tabBookings" | "tabExplore" | "tabAccount"][] = [
  ["home", "house", "tabHome"],
  ["bookings", "list", "tabBookings"],
  ["book", "plus", "tabBook"],
  ["explore", "compass", "tabExplore"],
  ["account", "user", "tabAccount"],
];

// The customer app: top bar (logo, notifications, language), the open tab,
// the bottom tab bar on phones (a header nav on computers), and whichever
// full-screen flow is up (booking, reschedule, review).
export function App() {
  const t = useT();
  const { ready, bootError, boot, tab, go, flow, account, unread, setLang, lang, settings } = useApp();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [scrolled, setScrolled] = useState(false);
  const [notifs, setNotifs] = useState(false);

  useEffect(() => {
    void boot();
  }, [boot]);
  useEffect(() => {
    if (ready) prefetch();
  }, [ready]);
  useEffect(() => {
    const on = () => setOffline(false),
      off = () => setOffline(true);
    const sc = () => setScrolled(window.scrollY > 8);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("scroll", sc, { passive: true });
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("scroll", sc);
    };
  }, []);

  const nav = (x: Tab) => {
    haptic();
    go(x);
  };
  const tabBar = (
    <>
      {TABS.map(([id, icon, label]) => (
        <button
          key={id}
          className={`${id === "book" ? "book" : ""} ${(id === tab && id !== "book") || (id === "book" && flow?.kind === "book") ? "on" : ""}`}
          onClick={() => nav(id)}
          aria-current={id === tab ? "page" : undefined}
        >
          <span className="ic">
            <Icon name={icon} size={20} />
          </span>
          {t(label)}
        </button>
      ))}
    </>
  );

  return (
    <>
      {offline && <div className="offline">{t("offline")}</div>}
      <header className={`top ${scrolled ? "scrolled" : ""}`}>
        <button className="brand" onClick={() => nav("home")} aria-label="SHADI SALOON">
          <img className="logo" src={`${import.meta.env.BASE_URL}assets/mark.png`} alt="" />
          <img className="word" src={`${import.meta.env.BASE_URL}assets/wordmark.png`} alt="SHADI SALOON" />
        </button>
        <nav className="nav">{tabBar}</nav>
        <div className="grow" />
        <button className="lang-btn" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
          {t("langSwitch")}
        </button>
        {account && (
          <button className="icon-btn" aria-label={t("notifications")} onClick={() => setNotifs(true)}>
            <Icon name="bell" size={20} />
            {unread > 0 && <span className="badge">{unread > 9 ? "9+" : unread}</span>}
          </button>
        )}
      </header>

      <main className="page">
        {bootError ? (
          <Empty icon="globe" title={t("errNetwork")}>
            <button className="btn gold" onClick={() => location.reload()}>
              {t("retry")}
            </button>
          </Empty>
        ) : !ready ? (
          <Loading />
        ) : settings.maintenanceMode?.enabled ? (
          <Empty icon="settings" title={settings.maintenanceMode.message || "…"} />
        ) : (
          <div className="view" key={tab}>
            <Suspense fallback={<Loading />}>
              {tab === "home" && <Home />}
              {tab === "bookings" && <Bookings />}
              {tab === "explore" && <Explore />}
              {tab === "account" && <Account />}
            </Suspense>
          </div>
        )}
      </main>

      <nav className="tabbar">{tabBar}</nav>

      <Suspense fallback={null}>
        {ready && flow?.kind === "book" && <BookFlow key={JSON.stringify(flow)} start={flow} />}
        {flow?.kind === "reschedule" && <Reschedule booking={flow.booking} />}
        {flow?.kind === "review" && <Review booking={flow.booking} />}
        {notifs && <Notifications onClose={() => setNotifs(false)} />}
      </Suspense>
      <Toast />
    </>
  );
}

import { useEffect, type ReactNode } from "react";
import { useAppStore } from "./store/appStore";
import { useGlobalOverlayEffects } from "./hooks/useGlobalOverlayEffects";
import { Topbar } from "./components/shell/Topbar";
import { TabBar } from "./components/shell/TabBar";
import { OfflineBanner } from "./components/shell/OfflineBanner";
import { SkeletonHome } from "./components/shell/Skeletons";
import { ConfigErrorScreen } from "./components/ConfigErrorScreen";
import { HomeView } from "./components/home/HomeView";
import { BookingsView } from "./components/bookings/BookingsView";
import { ProfileView } from "./components/profile/ProfileView";
import { BranchesView } from "./components/branches/BranchesView";
import { PointsView } from "./components/points/PointsView";
import { ExploreView } from "./components/explore/ExploreView";
import { BookingOverlay } from "./components/booking/BookingOverlay";
import { RescheduleOverlay } from "./components/bookings/RescheduleOverlay";
import { HomeVisitOverlay } from "./components/homevisit/HomeVisitOverlay";
import { displayError } from "./utils/errorDisplay";
import { useTranslation } from "./hooks/useTranslation";

// Applies an admin-configured accent color at runtime (Settings > Customer
// portal). Derives the same --accent-soft/--shadow-gold tones global.css
// otherwise hardcodes, plus flips --accent-ink dark if the chosen color is
// too light for white button text to stay readable on top of it.
function applyPortalAccentColor(hex?: string) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return;
  const root = document.documentElement.style;
  root.setProperty("--accent", hex);
  const m = /^#([0-9a-f]{6})$/i.exec(hex)!;
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  root.setProperty("--accent-soft", `rgba(${r},${g},${b},.10)`);
  root.setProperty("--shadow-gold", `0 6px 16px rgba(${r},${g},${b},.20)`);
  // Accent-ink (text drawn on top of the accent, e.g. the gold/book button
  // label) needs to flip to dark if the admin picks a light accent color —
  // a fixed white would go unreadable on e.g. a pale/yellow accent.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  root.setProperty("--accent-ink", luminance > 0.6 ? "#171717" : "#FFFFFF");
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <OfflineBanner />
      <Topbar />
      <div className="app-content">
        <div className="app-content-inner">{children}</div>
      </div>
      <TabBar />
    </>
  );
}

export default function App() {
  const { lang, tr } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const bootstrapError = useAppStore((s) => s.bootstrapError);
  const bootstrap = useAppStore((s) => s.bootstrap);
  const tab = useAppStore((s) => s.tab);
  const booking = useAppStore((s) => s.booking);
  const reschedule = useAppStore((s) => s.reschedule);
  const homeVisitOpen = useAppStore((s) => s.homeVisitOpen);

  useGlobalOverlayEffects();

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    applyPortalAccentColor(settings?.customerPortalTheme?.accentColor);
  }, [settings?.customerPortalTheme?.accentColor]);

  if (bootstrapError) {
    return <ConfigErrorScreen message={displayError(bootstrapError, tr)} />;
  }

  if (!settings) {
    return (
      <Shell>
        <SkeletonHome />
      </Shell>
    );
  }

  return (
    <>
      <Shell>
        {tab === "home" && <HomeView />}
        {tab === "bookings" && <BookingsView />}
        {tab === "branches" && <BranchesView />}
        {tab === "points" && <PointsView />}
        {tab === "explore" && <ExploreView />}
        {tab === "profile" && <ProfileView />}
      </Shell>
      {booking && <BookingOverlay />}
      {reschedule && <RescheduleOverlay />}
      {homeVisitOpen && <HomeVisitOverlay />}
    </>
  );
}

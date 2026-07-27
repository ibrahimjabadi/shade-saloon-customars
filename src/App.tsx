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
import { BookingOverlay } from "./components/booking/BookingOverlay";
import { RescheduleOverlay } from "./components/bookings/RescheduleOverlay";
import { displayError } from "./utils/errorDisplay";
import { useTranslation } from "./hooks/useTranslation";

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
        {tab === "profile" && <ProfileView />}
      </Shell>
      {booking && <BookingOverlay />}
      {reschedule && <RescheduleOverlay />}
    </>
  );
}

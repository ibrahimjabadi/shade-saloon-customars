import type { ReactNode } from "react";
import { useAppStore, type Tab } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { IconCalendar, IconHome, IconHomeVisit, IconUser } from "./icons";

function TabButton({ id, icon, label }: { id: Tab; icon: ReactNode; label: string }) {
  const active = useAppStore((s) => s.tab === id);
  const setTab = useAppStore((s) => s.setTab);
  return (
    <button
      className={`app-tab ${active ? "active" : ""}`}
      role="tab"
      aria-selected={active}
      aria-current={active ? "page" : "false"}
      onClick={() => setTab(id)}
    >
      <span className="tab-icon-wrap" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function TabBar() {
  const { lang, tr } = useTranslation();
  return (
    <div className="app-tabbar" role="tablist" aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
      <TabButton id="home" icon={<IconHome />} label={tr("home")} />
      <TabButton id="bookings" icon={<IconCalendar />} label={tr("myBookings")} />
      <TabButton id="homeVisit" icon={<IconHomeVisit />} label={tr("homeVisitTab")} />
      <TabButton id="profile" icon={<IconUser />} label={tr("profile")} />
    </div>
  );
}

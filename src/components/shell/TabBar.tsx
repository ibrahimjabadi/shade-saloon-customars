import type { ReactNode } from "react";
import { useAppStore, type Tab } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { IconBuilding, IconCalendar, IconHome, IconStar, IconUser } from "./icons";

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button className={`app-tab ${active ? "active" : ""}`} role="tab" aria-selected={active} onClick={onClick}>
      <span className="tab-icon-wrap" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function NavTabButton({ id, icon, label, extraActive }: { id: Tab; icon: ReactNode; label: string; extraActive?: Tab[] }) {
  const active = useAppStore((s) => s.tab === id || (extraActive?.includes(s.tab) ?? false));
  const setTab = useAppStore((s) => s.setTab);
  return <TabButton active={active} onClick={() => setTab(id)} icon={icon} label={label} />;
}

// "Book" isn't a `tab` destination — it's an action that opens the existing
// booking wizard overlay (same one Home's CTA opens), so it's "active"
// whenever that overlay is open rather than tracking `s.tab`.
function BookTabButton({ label }: { label: string }) {
  const active = useAppStore((s) => !!s.booking);
  const openBooking = useAppStore((s) => s.openBooking);
  return <TabButton active={active} onClick={() => openBooking()} icon={<IconCalendar />} label={label} />;
}

export function TabBar() {
  const { lang, tr } = useTranslation();
  return (
    <div className="app-tabbar" role="tablist" aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
      <NavTabButton id="home" icon={<IconHome />} label={tr("home")} />
      <BookTabButton label={tr("bookTab")} />
      <NavTabButton id="branches" icon={<IconBuilding />} label={tr("branchesTab")} />
      <NavTabButton id="points" icon={<IconStar />} label={tr("pointsTab")} />
      {/* Profile also "owns" the two relocated screens (My Bookings, Explore)
          reached via its settings list — stays visually active while on
          either, so users don't lose their place in the bottom nav. */}
      <NavTabButton id="profile" icon={<IconUser />} label={tr("profile")} extraActive={["bookings", "explore"]} />
    </div>
  );
}

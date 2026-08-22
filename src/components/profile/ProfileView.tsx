import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { AccountForm } from "./AccountForm";
import { VerifyAccountBanner } from "./VerifyAccountBanner";
import { IconCalendar, IconExplore, IconLogout } from "../shell/icons";

function StatsGrid() {
  const { tr } = useTranslation();
  const myBookings = useAppStore((s) => s.myBookings);
  const total = myBookings?.length ?? null;
  const completed = myBookings?.filter((b) => b.status === "completed").length ?? null;
  const upcoming = myBookings?.filter((b) => b.status === "upcoming").length ?? null;
  const stats: [string, number | null][] = [
    [tr("statTotalBookings"), total],
    [tr("statCompleted"), completed],
    [tr("statUpcoming"), upcoming],
  ];
  return (
    <div className="profile-stats-grid">
      {stats.map(([label, value]) => (
        <div className="card profile-stat-card" key={label}>
          <div className="profile-stat-value">{value === null ? "—" : value}</div>
          <div className="profile-stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

function SettingsList() {
  const { tr } = useTranslation();
  const setTab = useAppStore((s) => s.setTab);
  const logout = useAppStore((s) => s.logout);
  const rows: { icon: typeof IconCalendar; label: string; onClick: () => void; danger?: boolean }[] = [
    { icon: IconCalendar, label: tr("myBookings"), onClick: () => setTab("bookings") },
    { icon: IconExplore, label: tr("exploreTab"), onClick: () => setTab("explore") },
    { icon: IconLogout, label: tr("logout"), onClick: logout, danger: true },
  ];
  return (
    <div className="card settings-list">
      {rows.map((row) => (
        <button key={row.label} className={`settings-row ${row.danger ? "danger" : ""}`} onClick={row.onClick}>
          <span className="settings-row-icon" aria-hidden="true">
            <row.icon />
          </span>
          <span className="settings-row-label">{row.label}</span>
          <span className="settings-row-chevron" aria-hidden="true">
            ‹
          </span>
        </button>
      ))}
    </div>
  );
}

export function ProfileView() {
  const { tr } = useTranslation();
  const account = useAppStore((s) => s.account);

  if (account) {
    return (
      <>
        <div className="card-accent profile-user-card">
          <div className="card-accent-decor-1" aria-hidden="true" />
          <div className="profile-user-avatar">{(account.name || "?").trim()[0] || "?"}</div>
          <div>
            <strong className="profile-user-name">{account.name}</strong>
            <div className="profile-user-phone">{account.phone}</div>
            {account.email && <div className="profile-user-phone">{account.email}</div>}
          </div>
        </div>
        <StatsGrid />
        <VerifyAccountBanner />
        <SettingsList />
      </>
    );
  }

  return (
    <div className="card">
      <h2>{tr("account")}</h2>
      <AccountForm />
    </div>
  );
}

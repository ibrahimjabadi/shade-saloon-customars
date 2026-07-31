import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { AccountForm } from "./AccountForm";
import { VerifyAccountBanner } from "./VerifyAccountBanner";

export function ProfileView() {
  const { tr } = useTranslation();
  const account = useAppStore((s) => s.account);
  const logout = useAppStore((s) => s.logout);

  if (account) {
    return (
      <>
        <div className="card profile-card">
          <strong>{account.name}</strong>
          <span className="muted">{account.phone}</span>
          {account.email && <span className="muted">{account.email}</span>}
        </div>
        <VerifyAccountBanner />
        <button className="btn secondary" style={{ marginTop: 14 }} onClick={logout}>
          {tr("logout")}
        </button>
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

import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { OpenStatusBadge } from "../home/BusinessHours";

/** Full branch list — a top-level tab now, rather than nested inside Home's
 * branch-switcher chips. Deliberately shows only real fields (name, area,
 * hours/open-status when the branch actually has businessHours). No
 * rating/distance: this app has neither reviews nor geolocation data, and
 * fabricating either would misrepresent the branch to the customer. */
export function BranchesView() {
  const { tr } = useTranslation();
  const branches = useAppStore((s) => s.branches);
  const switchBranch = useAppStore((s) => s.switchBranch);
  const setTab = useAppStore((s) => s.setTab);

  function pick(id: string) {
    switchBranch(id);
    setTab("home");
  }

  return (
    <div className="grid">
      <div className="section-label">{tr("branchesTab")}</div>
      {branches.map((b) => (
        <div className="card branch-list-card" key={b.id}>
          <div className="branch-list-head">
            <h3>{b.name}</h3>
            {b.businessHours && <OpenStatusBadge hours={b.businessHours} timezone={b.timezone} />}
          </div>
          {(b.address || b.city) && <div className="muted branch-list-area">{[b.address, b.city].filter(Boolean).join(" — ")}</div>}
          <button className="btn secondary branch-list-cta" onClick={() => pick(b.id)}>
            {tr("switchToBranch")}
          </button>
        </div>
      ))}
    </div>
  );
}

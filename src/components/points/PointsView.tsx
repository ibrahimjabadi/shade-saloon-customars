import { useTranslation } from "../../hooks/useTranslation";
import { IconStar } from "../shell/icons";

/** Deliberately a placeholder, not a fake points balance. There's no points/
 * loyalty concept anywhere in the backend (Booking/CustomerAccount/Settings
 * have no such fields) — inventing a believable-looking number here would
 * mislead real customers into thinking they're accumulating redeemable
 * value. Matches this app's existing convention of never fabricating
 * numbers it can't back with real data (see utils/explorePosts.ts). */
export function PointsView() {
  const { tr } = useTranslation();
  return (
    <div className="empty-state points-coming-soon">
      <span className="points-coming-soon-icon" aria-hidden="true">
        <IconStar />
      </span>
      <p style={{ fontWeight: 700, color: "var(--text)" }}>{tr("pointsComingSoonTitle")}</p>
      <p className="muted">{tr("pointsComingSoonBody")}</p>
    </div>
  );
}

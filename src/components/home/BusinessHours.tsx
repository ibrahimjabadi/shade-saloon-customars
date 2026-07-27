import { DAY_KEYS } from "../../i18n/translations";
import { computeOpenStatus, zonedNow } from "../../utils/businessHours";
import { useTranslation } from "../../hooks/useTranslation";
import type { BusinessHours } from "../../api/types";

export function OpenStatusBadge({ hours, timezone }: { hours?: BusinessHours; timezone?: string }) {
  const { tr } = useTranslation();
  const status = computeOpenStatus(hours, timezone);
  if (!status) return null;
  if (status.open) {
    return (
      <span className="status-badge open">
        ● {tr("openNow")} · {tr("closesAt")} {status.closesAt}
      </span>
    );
  }
  if (status.opensAt) {
    return (
      <span className="status-badge closed">
        ● {tr("closedNow")} · {tr("opensAt")} {status.opensAt}
      </span>
    );
  }
  if (status.next) {
    return (
      <span className="status-badge closed">
        ● {tr("closedNow")} · {tr("opensAt")} {tr(status.next.day)} {status.next.time}
      </span>
    );
  }
  return <span className="status-badge closed">● {tr("closedNow")}</span>;
}

export function HoursTable({ hours, timezone }: { hours?: BusinessHours; timezone?: string }) {
  const { tr } = useTranslation();
  if (!hours || typeof hours !== "object") return null;
  const todayKey = DAY_KEYS[zonedNow(timezone).weekday];
  return (
    <div className="hours-table">
      {DAY_KEYS.map((k) => {
        const d = hours[k];
        const isToday = k === todayKey;
        return (
          <div className={`hours-row${isToday ? " today" : ""}`} key={k}>
            <span className="hours-day">
              {tr(k)}
              {isToday ? ` (${tr("today")})` : ""}
            </span>
            {!d || d.closed ? (
              <span className="hours-closed">{tr("closedDay")}</span>
            ) : (
              <span>
                {d.open} – {d.close}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

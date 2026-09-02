import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";

/** Two big selectable cards (same `.item`/`.item.selected` pattern as
 * BarberStep), not a plain yes/no toggle -- matches how every other
 * single-choice step in this wizard already looks. Answering doesn't
 * unlock anything new in the flow itself; it's carried through to the
 * booking's notes field (see confirmBooking in appStore.ts) so the
 * salon actually sees it, instead of collecting it for nothing. */
export function FirstVisitStep() {
  const { tr } = useTranslation();
  const isFirstVisit = useAppStore((s) => s.booking?.isFirstVisit ?? null);
  const setBkFirstVisit = useAppStore((s) => s.setBkFirstVisit);

  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>
        {tr("firstVisitQuestion")}
      </p>
      <div className="grid">
        <div className={`item ${isFirstVisit === true ? "selected" : ""}`} onClick={() => setBkFirstVisit(true)}>
          <strong>{tr("firstVisitYes")}</strong>
          <div className="meta">{tr("firstVisitYesSub")}</div>
        </div>
        <div className={`item ${isFirstVisit === false ? "selected" : ""}`} onClick={() => setBkFirstVisit(false)}>
          <strong>{tr("firstVisitNo")}</strong>
          <div className="meta">{tr("firstVisitNoSub")}</div>
        </div>
      </div>
    </>
  );
}

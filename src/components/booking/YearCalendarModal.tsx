import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { IconCalendar } from "../shell/icons";

const MONTH_NAMES: Record<"ar" | "en", string[]> = {
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
const WEEK_LETTERS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDay(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

/** One month at a time, not all 12 stacked -- the previous version's
 * .customer-year-grid was a 3-months-per-row desktop layout (year-panel
 * width min(1180px,96vw)) that only fell back to 12 stacked single-column
 * months below 400px, meaning finding a date in e.g. December meant
 * scrolling past 11 other full month grids first. This app is
 * mobile-only, so there's no width where the 3-per-row layout was ever
 * actually reachable -- it was dead code on every real device. */
export function YearCalendarModal() {
  const { lang, tr } = useTranslation();
  const booking = useAppStore((s) => s.booking);
  const setBkDate = useAppStore((s) => s.setBkDate);
  const closeYearCalendar = useAppStore((s) => s.closeYearCalendar);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const initial = booking?.date ? new Date(`${booking.date}T12:00:00`) : new Date();
  const [activeYear, setActiveYear] = useState(initial.getFullYear());
  const [activeMonth, setActiveMonth] = useState(initial.getMonth());

  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  if (!booking) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const shiftMonth = (delta: number) => {
    let m = activeMonth + delta, y = activeYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setActiveMonth(m);
    setActiveYear(y);
  };
  const goToday = () => {
    const now = new Date();
    setActiveYear(now.getFullYear());
    setActiveMonth(now.getMonth());
  };

  const blanksCount = firstDay(activeYear, activeMonth);
  const dayCount = daysInMonth(activeYear, activeMonth);

  return createPortal(
    <div className="year-modal" role="dialog" aria-modal="true" aria-label={lang === "ar" ? "اختيار التاريخ" : "Choose date"}>
      <div className="year-panel">
        <div className="year-top">
          <button ref={closeBtnRef} className="year-close" aria-label={lang === "ar" ? "إغلاق" : "Close"} onClick={closeYearCalendar}>
            ×
          </button>
          <h2>
            <IconCalendar /> {MONTH_NAMES[lang][activeMonth]} {activeYear}
          </h2>
          <div className="year-nav">
            <button aria-label={lang === "ar" ? "الشهر السابق" : "Previous month"} onClick={() => shiftMonth(-1)}>‹</button>
            <button className="year-today-btn" onClick={goToday}>{tr("today")}</button>
            <button aria-label={lang === "ar" ? "الشهر التالي" : "Next month"} onClick={() => shiftMonth(1)}>›</button>
          </div>
        </div>
        <div className="week-row">
          {WEEK_LETTERS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="month-days month-days-solo">
          {Array.from({ length: blanksCount }).map((_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: dayCount }).map((_, i) => {
            const v = `${activeYear}-${String(activeMonth + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
            const past = v < todayStr;
            return (
              <button
                key={v}
                className={`year-day ${v === booking.date ? "selected" : ""} ${v === todayStr ? "is-today" : ""}`}
                disabled={past}
                onClick={() => {
                  setBkDate(v);
                  closeYearCalendar();
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

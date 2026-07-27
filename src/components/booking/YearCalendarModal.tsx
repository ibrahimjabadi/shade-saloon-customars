import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";

const MONTH_NAMES: Record<"ar" | "en", string[]> = {
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
const WEEK_LETTERS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDay(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

export function YearCalendarModal() {
  const { lang } = useTranslation();
  const booking = useAppStore((s) => s.booking);
  const setBkDate = useAppStore((s) => s.setBkDate);
  const closeYearCalendar = useAppStore((s) => s.closeYearCalendar);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [activeYear, setActiveYear] = useState(() => Number((booking?.date || new Date().toISOString()).slice(0, 4)) || new Date().getFullYear());

  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  if (!booking) return null;

  return createPortal(
    <div
      className="year-modal"
      role="dialog"
      aria-modal="true"
      aria-label={lang === "ar" ? "اختيار التاريخ" : "Choose date"}
    >
      <div className="year-panel">
        <div className="year-top">
          <h2>📅 {activeYear}</h2>
          <div>
            <button onClick={() => setActiveYear((y) => y - 1)}>‹</button>
            <button onClick={() => setActiveYear(new Date().getFullYear())}>{lang === "ar" ? "اليوم" : "Today"}</button>
            <button onClick={() => setActiveYear((y) => y + 1)}>›</button>
            <button ref={closeBtnRef} aria-label={lang === "ar" ? "إغلاق" : "Close"} onClick={closeYearCalendar}>
              ×
            </button>
          </div>
        </div>
        <div className="customer-year-grid">
          {MONTH_NAMES[lang].map((mn, m) => {
            const blanksCount = firstDay(activeYear, m);
            const dayCount = daysInMonth(activeYear, m);
            return (
              <div className="month-card" key={m}>
                <h3>{mn}</h3>
                <div className="week-row">
                  {WEEK_LETTERS.map((w, i) => (
                    <span key={i}>{w}</span>
                  ))}
                </div>
                <div className="month-days">
                  {Array.from({ length: blanksCount }).map((_, i) => (
                    <span key={`b${i}`} />
                  ))}
                  {Array.from({ length: dayCount }).map((_, i) => {
                    const v = `${activeYear}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                    return (
                      <button
                        key={v}
                        className={`year-day ${v === booking.date ? "selected" : ""}`}
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
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

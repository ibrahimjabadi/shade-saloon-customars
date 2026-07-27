import { useMemo } from "react";
import { useAppStore } from "../../../store/appStore";
import { useTranslation } from "../../../hooks/useTranslation";
import { serviceName } from "../../../utils/booking";
import { formatMoney } from "../../../utils/money";

export function ServicesStep() {
  const { tr, lang } = useTranslation();
  const services = useAppStore((s) => s.services);
  const currency = useAppStore((s) => s.settings?.currency);
  const cat = useAppStore((s) => s.booking?.cat || "all");
  const selectedServices = useAppStore((s) => s.booking?.selectedServices || []);
  const setBkCategory = useAppStore((s) => s.setBkCategory);
  const toggleBkService = useAppStore((s) => s.toggleBkService);

  // "" (not undefined) is the sentinel for "no category set" throughout —
  // picked once here so the chip's selected-state comparison and the list
  // filter below always agree on what an uncategorized service looks like.
  const categories = useMemo(() => ["all", ...new Set(services.map((s) => s.category || ""))], [services]);
  const list = cat === "all" ? services : services.filter((s) => (s.category || "") === cat);

  return (
    <>
      <div className="chips">
        {categories.map((c) => (
          <button key={c || "uncategorized"} className={`chip ${cat === c ? "active" : ""}`} onClick={() => setBkCategory(c)}>
            {c === "all" ? (lang === "ar" ? "الكل" : "All") : c}
          </button>
        ))}
      </div>
      <div className="grid">
        {list.map((s) => {
          const selected = selectedServices.includes(s.id);
          return (
            <div className="service-row" key={s.id}>
              <div style={{ cursor: "pointer" }} onClick={() => toggleBkService(s.id)}>
                <strong>{serviceName(s, lang)}</strong>
                <div className="meta">
                  {s.duration} {tr("min")} · {formatMoney(s.price, currency, lang)}
                </div>
              </div>
              <button className={`service-book-btn ${selected ? "added" : ""}`} onClick={() => toggleBkService(s.id)}>
                {selected ? `✓ ${tr("added")}` : tr("book")}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

import type { ReactNode } from "react";
import type { Lang } from "../../i18n/translations";

const AMENITY_ICONS: Record<string, ReactNode> = {
  parking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M9 16V8h4a3 3 0 0 1 0 6H9" />
    </svg>
  ),
  wheelchair: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="5" r="1.6" />
      <path d="M11 8v5l-3 7M11 13h5l3 6M8 13h8" />
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 9a11 11 0 0 1 14 0M8 12.5a7 7 0 0 1 8 0M11 16a3 3 0 0 1 2 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19" />
    </svg>
  ),
  kids: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="6" r="2.6" />
      <path d="M6 20c0-4 2.7-6.5 6-6.5S18 16 18 20" />
    </svg>
  ),
  transport: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="12" rx="3" />
      <path d="M4 12h16M8 20l1.4-2M16 20l-1.4-2" />
      <circle cx="8" cy="16" r=".6" fill="currentColor" />
      <circle cx="16" cy="16" r=".6" fill="currentColor" />
    </svg>
  ),
};

const FALLBACK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 12l5 5L19 7" />
  </svg>
);

const AMENITY_LABELS: Record<string, Record<Lang, string>> = {
  parking: { ar: "موقف سيارات", en: "Parking" },
  wheelchair: { ar: "دخول كراسي متحركة", en: "Wheelchair accessible" },
  wifi: { ar: "واي فاي مجاني", en: "Free WiFi" },
  card: { ar: "الدفع بالبطاقة", en: "Card payment" },
  kids: { ar: "مناسب للأطفال", en: "Kid friendly" },
  transport: { ar: "قريب من مواصلات", en: "Near public transport" },
};

export function AmenitiesGrid({ list, lang }: { list: string[] | undefined; lang: Lang }) {
  if (!Array.isArray(list) || !list.length) return null;
  return (
    <div className="amenity-grid">
      {list.map((key) => (
        <div className="amenity-item" key={key}>
          <span className="amenity-icon">{AMENITY_ICONS[key] || FALLBACK_ICON}</span>
          <span>{AMENITY_LABELS[key] ? AMENITY_LABELS[key][lang] : key}</span>
        </div>
      ))}
    </div>
  );
}

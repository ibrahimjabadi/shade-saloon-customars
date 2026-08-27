/* Country dial codes for the phone field — Jordan first (the salon's home
   market and the pre-existing default), then the rest of the Arab world,
   then other countries clients commonly travel from. Mirrors the same list
   used in the admin app (public/app.js, countryDialCodes()) so a phone
   saved from either side reads the same way. */
export interface CountryDialCode {
  iso: string;
  dial: string;
  flag: string;
  nameAr: string;
  nameEn: string;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { iso: "JO", dial: "962", flag: "🇯🇴", nameAr: "الأردن", nameEn: "Jordan" },
  { iso: "SA", dial: "966", flag: "🇸🇦", nameAr: "السعودية", nameEn: "Saudi Arabia" },
  { iso: "AE", dial: "971", flag: "🇦🇪", nameAr: "الإمارات", nameEn: "UAE" },
  { iso: "KW", dial: "965", flag: "🇰🇼", nameAr: "الكويت", nameEn: "Kuwait" },
  { iso: "QA", dial: "974", flag: "🇶🇦", nameAr: "قطر", nameEn: "Qatar" },
  { iso: "BH", dial: "973", flag: "🇧🇭", nameAr: "البحرين", nameEn: "Bahrain" },
  { iso: "OM", dial: "968", flag: "🇴🇲", nameAr: "عمان", nameEn: "Oman" },
  { iso: "PS", dial: "970", flag: "🇵🇸", nameAr: "فلسطين", nameEn: "Palestine" },
  { iso: "LB", dial: "961", flag: "🇱🇧", nameAr: "لبنان", nameEn: "Lebanon" },
  { iso: "SY", dial: "963", flag: "🇸🇾", nameAr: "سوريا", nameEn: "Syria" },
  { iso: "IQ", dial: "964", flag: "🇮🇶", nameAr: "العراق", nameEn: "Iraq" },
  { iso: "EG", dial: "20", flag: "🇪🇬", nameAr: "مصر", nameEn: "Egypt" },
  { iso: "LY", dial: "218", flag: "🇱🇾", nameAr: "ليبيا", nameEn: "Libya" },
  { iso: "TN", dial: "216", flag: "🇹🇳", nameAr: "تونس", nameEn: "Tunisia" },
  { iso: "DZ", dial: "213", flag: "🇩🇿", nameAr: "الجزائر", nameEn: "Algeria" },
  { iso: "MA", dial: "212", flag: "🇲🇦", nameAr: "المغرب", nameEn: "Morocco" },
  { iso: "SD", dial: "249", flag: "🇸🇩", nameAr: "السودان", nameEn: "Sudan" },
  { iso: "YE", dial: "967", flag: "🇾🇪", nameAr: "اليمن", nameEn: "Yemen" },
  { iso: "TR", dial: "90", flag: "🇹🇷", nameAr: "تركيا", nameEn: "Turkey" },
  { iso: "US", dial: "1", flag: "🇺🇸", nameAr: "أمريكا", nameEn: "United States" },
  { iso: "CA", dial: "1", flag: "🇨🇦", nameAr: "كندا", nameEn: "Canada" },
  { iso: "GB", dial: "44", flag: "🇬🇧", nameAr: "بريطانيا", nameEn: "United Kingdom" },
  { iso: "DE", dial: "49", flag: "🇩🇪", nameAr: "ألمانيا", nameEn: "Germany" },
  { iso: "FR", dial: "33", flag: "🇫🇷", nameAr: "فرنسا", nameEn: "France" },
  { iso: "IT", dial: "39", flag: "🇮🇹", nameAr: "إيطاليا", nameEn: "Italy" },
  { iso: "ES", dial: "34", flag: "🇪🇸", nameAr: "إسبانيا", nameEn: "Spain" },
  { iso: "NL", dial: "31", flag: "🇳🇱", nameAr: "هولندا", nameEn: "Netherlands" },
  { iso: "SE", dial: "46", flag: "🇸🇪", nameAr: "السويد", nameEn: "Sweden" },
  { iso: "IN", dial: "91", flag: "🇮🇳", nameAr: "الهند", nameEn: "India" },
  { iso: "PK", dial: "92", flag: "🇵🇰", nameAr: "باكستان", nameEn: "Pakistan" },
  { iso: "BD", dial: "880", flag: "🇧🇩", nameAr: "بنغلاديش", nameEn: "Bangladesh" },
  { iso: "PH", dial: "63", flag: "🇵🇭", nameAr: "الفلبين", nameEn: "Philippines" },
  { iso: "ID", dial: "62", flag: "🇮🇩", nameAr: "إندونيسيا", nameEn: "Indonesia" },
  { iso: "MY", dial: "60", flag: "🇲🇾", nameAr: "ماليزيا", nameEn: "Malaysia" },
  { iso: "CN", dial: "86", flag: "🇨🇳", nameAr: "الصين", nameEn: "China" },
  { iso: "RU", dial: "7", flag: "🇷🇺", nameAr: "روسيا", nameEn: "Russia" },
  { iso: "AU", dial: "61", flag: "🇦🇺", nameAr: "أستراليا", nameEn: "Australia" },
];

export function combinePhone(dial: string, local: string): string {
  const digits = String(local || "").trim().replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `+${dial}${digits}` : "";
}

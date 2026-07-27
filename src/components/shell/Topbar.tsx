import { useTranslation } from "../../hooks/useTranslation";

export function Topbar() {
  const { lang, toggleLang } = useTranslation();
  return (
    <div className="app-topbar">
      <img className="app-logo" src="/assets/shadi-logo.png" alt="SHADI SALOON" />
      <button
        className="app-lang-btn"
        aria-label={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
        onClick={toggleLang}
      >
        {lang === "ar" ? "EN" : "عربي"}
      </button>
    </div>
  );
}

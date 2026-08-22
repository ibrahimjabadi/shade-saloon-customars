import { useTranslation } from "../../hooks/useTranslation";
import { IconBell } from "./icons";

export function Topbar() {
  const { lang, toggleLang } = useTranslation();
  return (
    <div className="app-topbar">
      <div className="app-topbar-brand">
        <img className="app-logo" src="/assets/shadi-logo.png" alt="SHADI SALOON" />
      </div>
      <div className="app-topbar-actions">
        <button
          className="app-lang-btn"
          aria-label={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
          onClick={toggleLang}
        >
          {lang === "ar" ? "EN" : "عربي"}
        </button>
        {/* No unread-notification dot on purpose — this app has no
            notifications backend, so there's no real count to show. */}
        <span className="app-bell-btn" aria-hidden="true">
          <IconBell />
        </span>
      </div>
    </div>
  );
}

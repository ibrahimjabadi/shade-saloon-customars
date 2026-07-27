import { useCallback } from "react";
import { useAppStore } from "../store/appStore";
import { translations, type TranslationKey } from "../i18n/translations";

export function useTranslation() {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const tr = useCallback((key: TranslationKey) => translations[lang][key] || key, [lang]);
  const toggleLang = useCallback(() => setLang(lang === "ar" ? "en" : "ar"), [lang, setLang]);
  return { lang, tr, setLang, toggleLang };
}

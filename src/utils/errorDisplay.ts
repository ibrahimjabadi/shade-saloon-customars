import type { TranslationKey } from "../i18n/translations";

/** The store can't import the translation hook (it has no notion of the
 * current render), so async actions store network/generic failures as a
 * `__key:<translationKey>` sentinel instead of a baked-in string. Backend
 * error messages (which may legitimately be arbitrary text) pass through
 * unchanged. Resolving the sentinel here, at render time, also means the
 * message re-translates correctly if the user switches language after the
 * error already appeared — the original vanilla-JS version baked the
 * translation in at throw time instead. */
export function displayError(raw: string | null | undefined, tr: (key: TranslationKey) => string): string {
  if (!raw) return "";
  if (raw.startsWith("__key:")) return tr(raw.slice(6) as TranslationKey);
  return raw;
}

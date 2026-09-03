import { API_BASE } from "../api/config";
import { displayError } from "../utils/errorDisplay";
import { useTranslation } from "../hooks/useTranslation";

export function ConfigErrorScreen({ message }: { message: string }) {
  const { tr } = useTranslation();
  const isPlaceholder = API_BASE.includes("YOUR-BACKEND-URL-HERE") || !API_BASE;
  const title = isPlaceholder ? "لم يتم ضبط رابط الخادم بعد" : "تعذّر الاتصال بالخادم";
  const resolved = displayError(message, tr);
  const detail = isPlaceholder
    ? "افتح ملف public/config.js وضع رابط الخادم الرئيسي الفعلي بدلًا من النص التجريبي، ثم أعد تحميل الصفحة."
    : `تأكد من صحة رابط الخادم في ملف config.js ومن أن الخادم يعمل. (${resolved})`;
  return (
    <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 10 }}>{title}</h2>
      <p className="muted">{detail}</p>
      <div style={{ marginTop: 24, padding: 14, border: "1px solid var(--line)", borderRadius: 12 }}>
        <p className="muted" style={{ margin: "0 0 6px" }}>
          الرابط الحالي المقروء من config.js:
        </p>
        <code style={{ wordBreak: "break-all" }}>{API_BASE || "(فارغ / empty)"}</code>
      </div>
    </div>
  );
}

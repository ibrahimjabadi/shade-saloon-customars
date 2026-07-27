import { API_BASE } from "../api/config";
import { displayError } from "../utils/errorDisplay";
import { useTranslation } from "../hooks/useTranslation";

export function ConfigErrorScreen({ message }: { message: string }) {
  const { tr } = useTranslation();
  const isPlaceholder = API_BASE.includes("YOUR-BACKEND-URL-HERE") || !API_BASE;
  const title = isPlaceholder ? "لسا ما ضبطتي رابط السيرفر" : "تعذّر الاتصال بالسيرفر";
  const resolved = displayError(message, tr);
  const detail = isPlaceholder
    ? "افتحي ملف public/config.js وحطي رابط السيرفر الرئيسي الفعلي بدل النص التجريبي، ثم أعيدي تحميل الصفحة."
    : `تأكد أن رابط السيرفر بملف config.js صحيح وأن السيرفر يعمل. (${resolved})`;
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

import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";

export function OfflineBanner() {
  const offline = useAppStore((s) => s.offline);
  const { tr } = useTranslation();
  if (!offline) return null;
  return (
    <div className="offline-banner" role="status">
      {tr("offline")}
    </div>
  );
}

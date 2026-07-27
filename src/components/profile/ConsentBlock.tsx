import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";

export function ConsentBlock({
  consentChecked,
  onConsentChange,
  marketingChecked,
  onMarketingChange,
}: {
  consentChecked: boolean;
  onConsentChange: (v: boolean) => void;
  marketingChecked: boolean;
  onMarketingChange: (v: boolean) => void;
}) {
  const { tr, lang } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const s = settings || {};
  const policy = lang === "ar" ? s.privacyPolicyAr : s.privacyPolicyEn;
  const terms = lang === "ar" ? s.termsAr : s.termsEn;
  const marketingText = lang === "ar" ? s.marketingConsentAr : s.marketingConsentEn;

  if (s.privacyPolicyEnabled === false && !s.requireCustomerConsent && !s.requireMarketingConsent) return null;

  return (
    <div className="consent-block">
      {policy && (
        <details className="consent-policy">
          <summary>{tr("privacyPolicy")}</summary>
          <p>{policy}</p>
          {terms && (
            <>
              <h4>{tr("terms")}</h4>
              <p>{terms}</p>
            </>
          )}
        </details>
      )}
      {s.requireCustomerConsent !== false && (
        <label className="consent-check">
          <input type="checkbox" checked={consentChecked} onChange={(e) => onConsentChange(e.target.checked)} />
          <span>{tr("consentAgree")}</span>
        </label>
      )}
      {s.requireMarketingConsent === true && (
        <label className="consent-check">
          <input type="checkbox" checked={marketingChecked} onChange={(e) => onMarketingChange(e.target.checked)} />
          <span>{marketingText || tr("marketingAgree")}</span>
        </label>
      )}
    </div>
  );
}

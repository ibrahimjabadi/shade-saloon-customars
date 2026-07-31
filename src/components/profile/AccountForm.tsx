import { useRef, useState } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { validateEmail, validatePhone } from "../../utils/validators";
import { resolveErrorMessage } from "../../api/client";
import { ConsentBlock } from "./ConsentBlock";
import { COUNTRY_DIAL_CODES, combinePhone } from "../../utils/countryDialCodes";

/** Shared between the standalone Profile tab and the booking wizard's
 * "account" step — in the original vanilla-JS app these were two separate,
 * hand-copied 3-field-plus-consent forms (profileView() and bkAccountStep())
 * that had to be kept in sync manually. One component now, used from both
 * places via `onRegistered`. */
export function AccountForm({ onRegistered }: { onRegistered?: () => void }) {
  const { tr, lang } = useTranslation();
  const register = useAppStore((s) => s.register);
  const settings = useAppStore((s) => s.settings);

  const [name, setName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("962");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (submitting) return; // already in flight — ignore extra clicks/taps
    if (!name.trim()) {
      setMessage(tr("errRequiredName"));
      nameRef.current?.focus();
      return;
    }
    if (!phone.trim()) {
      setMessage(tr("errRequiredPhone"));
      phoneRef.current?.focus();
      return;
    }
    if (!validatePhone(phone)) {
      setMessage(tr("errInvalidPhone"));
      phoneRef.current?.focus();
      return;
    }
    if (!validateEmail(email)) {
      setMessage(tr("errInvalidEmail"));
      emailRef.current?.focus();
      return;
    }
    const s = settings || {};
    if (s.requireCustomerConsent !== false && !consent) {
      setMessage(tr("consentRequired"));
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      await register({
        name,
        phone: combinePhone(phoneCountry, phone),
        email,
        consent: s.requireCustomerConsent !== false ? consent : true,
        marketingConsent: marketing,
      });
      onRegistered?.();
    } catch (err) {
      setMessage(resolveErrorMessage(err, tr));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid">
      <label>
        {tr("name")}
        <input ref={nameRef} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        {tr("phone")}
        <div className="phone-with-country-row">
          <select
            value={phoneCountry}
            onChange={(e) => setPhoneCountry(e.target.value)}
            aria-label={tr("phoneCountry")}
          >
            {COUNTRY_DIAL_CODES.map((c) => (
              <option key={c.iso} value={c.dial}>
                {c.flag} +{c.dial} {lang === "ar" ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>
          <input
            ref={phoneRef}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="7XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </label>
      <label>
        {tr("email")}
        <input
          ref={emailRef}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <ConsentBlock
        consentChecked={consent}
        onConsentChange={setConsent}
        marketingChecked={marketing}
        onMarketingChange={setMarketing}
      />
      <button className="btn gold" disabled={submitting} onClick={() => void handleSubmit()}>
        {submitting ? tr("loading") : tr("createAccount")}
      </button>
      <div className="muted">{message}</div>
    </div>
  );
}

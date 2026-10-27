import { useRef, useState } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { validateEmail, validatePhone } from "../../utils/validators";
import { api, ApiError, resolveErrorMessage } from "../../api/client";
import { ConsentBlock } from "./ConsentBlock";
import { OtpInput } from "./OtpInput";
import { COUNTRY_DIAL_CODES, combinePhone } from "../../utils/countryDialCodes";
import type { AuthStartResponse } from "../../api/types";

/** Sign in / sign up, shared between the Profile tab and the booking
 * wizard's "account" step (via `onRegistered`).
 *
 * 2026-10-25: used to be one name+phone(+email) form whose submit signed
 * the caller straight in -- including into an existing account, for anyone
 * who knew its phone number. Now:
 *   phone -> (existing account) a 6-digit code to the account's email
 *         -> (old account with no email) add an email -> code to it
 *         -> (new number) sign-up form, email required -> code
 *   code  -> signed in
 * The server (routes/customer-auth.routes.js in the backend) enforces all
 * of this; this component only walks the customer through it. */
type Step = "phone" | "email" | "signup" | "code";

export function AccountForm({ onRegistered }: { onRegistered?: () => void }) {
  const { tr, lang } = useTranslation();
  const authStart = useAppStore((s) => s.authStart);
  const register = useAppStore((s) => s.register);
  const verifyCode = useAppStore((s) => s.verifyCode);
  const settings = useAppStore((s) => s.settings);

  const [step, setStep] = useState<Step>("phone");
  const [name, setName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("962");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canChangeEmail, setCanChangeEmail] = useState(false);
  /** "Did you mean …?" -- from the live check on blur, or from the server
   * when it refused a mistyped address (2026-10-27, bounce clean-up). */
  const [emailSuggestion, setEmailSuggestion] = useState("");
  const [emailWarning, setEmailWarning] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const fullPhone = () => combinePhone(phoneCountry, phone);

  async function run(fn: () => Promise<void>) {
    if (submitting) return; // already in flight — ignore extra clicks/taps
    setSubmitting(true);
    setMessage("");
    try {
      await fn();
    } catch (err) {
      setMessage(resolveErrorMessage(err, tr));
      if (err instanceof ApiError && err.suggestion) setEmailSuggestion(err.suggestion);
    } finally {
      setSubmitting(false);
    }
  }
  function handleStart(res: AuthStartResponse) {
    if (res.status === "code_sent") {
      setCanChangeEmail(!!res.canChangeEmail);
      setChallengeId(res.challengeId || "");
      setSentTo(res.sentTo || "");
      setCode("");
      setStep("code");
    } else if (res.status === "need_email") setStep("email");
    else setStep("signup");
  }

  function submitPhone() {
    if (!phone.trim()) { setMessage(tr("errRequiredPhone")); phoneRef.current?.focus(); return; }
    if (!validatePhone(phone)) { setMessage(tr("errInvalidPhone")); phoneRef.current?.focus(); return; }
    void run(async () => handleStart(await authStart({ phone: fullPhone() })));
  }
  function submitEmail() {
    if (!email.trim() || !validateEmail(email)) { setMessage(tr("errInvalidEmail")); emailRef.current?.focus(); return; }
    void run(async () => handleStart(await authStart({ phone: fullPhone(), email })));
  }
  function submitSignup() {
    if (!name.trim()) { setMessage(tr("errRequiredName")); nameRef.current?.focus(); return; }
    if (!email.trim() || !validateEmail(email)) { setMessage(tr("errInvalidEmail")); emailRef.current?.focus(); return; }
    const s = settings || {};
    if (s.requireCustomerConsent !== false && !consent) { setMessage(tr("consentRequired")); return; }
    void run(async () =>
      handleStart(
        await register({
          name,
          phone: fullPhone(),
          email,
          consent: s.requireCustomerConsent !== false ? consent : true,
          marketingConsent: marketing,
        })
      )
    );
  }
  function submitCode() {
    if (code.length !== 6) { setMessage(tr("authCodeRequired")); return; }
    void run(async () => {
      await verifyCode(challengeId, code);
      onRegistered?.();
    });
  }
  function resend() {
    void run(async () => handleStart(await authStart({ phone: fullPhone(), ...(email ? { email } : {}) })));
  }

  const phoneField = (
    <label>
      {tr("phone")}
      <div className="phone-with-country-row">
        <select value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)} aria-label={tr("phoneCountry")} disabled={step !== "phone"}>
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
          disabled={step !== "phone"}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitPhone()}
        />
      </div>
    </label>
  );
  async function checkEmailHint() {
    const v = email.trim();
    setEmailSuggestion("");
    setEmailWarning("");
    if (!v || !validateEmail(v)) return;
    try {
      const r = await api<{ ok: boolean; suggestion?: string | null; message?: string | null }>(`/api/email-check?email=${encodeURIComponent(v)}`);
      if (r.suggestion) setEmailSuggestion(r.suggestion);
      if (!r.ok && !r.suggestion) setEmailWarning(r.message || tr("errInvalidEmail"));
    } catch {
      /* hint only -- never block on it */
    }
  }
  const emailField = (
    <label>
      {tr("email")}
      <input
        ref={emailRef}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setEmailSuggestion(""); setEmailWarning(""); }}
        onBlur={() => void checkEmailHint()}
      />
      {emailSuggestion && (
        <span className="email-hint">
          {tr("emailDidYouMean")}{" "}
          <button type="button" className="link-btn" dir="ltr" onClick={() => { setEmail(emailSuggestion); setEmailSuggestion(""); setMessage(""); }}>
            {emailSuggestion}
          </button>
        </span>
      )}
      {emailWarning && <span className="email-hint bad">{emailWarning}</span>}
    </label>
  );
  const changeNumber = (
    <button type="button" className="link-btn" onClick={() => { setStep("phone"); setMessage(""); }}>
      {tr("authChangeNumber")}
    </button>
  );

  return (
    <div className="grid">
      {step === "phone" && (
        <>
          <p className="muted">{tr("authPhoneIntro")}</p>
          {phoneField}
          <button className="btn gold" disabled={submitting} onClick={submitPhone}>
            {submitting ? tr("loading") : tr("authContinue")}
          </button>
        </>
      )}

      {step === "email" && (
        <>
          {phoneField}
          <p className="muted">{canChangeEmail ? tr("authFixEmail") : tr("authNeedEmail")}</p>
          {emailField}
          <button className="btn gold" disabled={submitting} onClick={submitEmail}>
            {submitting ? tr("loading") : tr("authSendCode")}
          </button>
          {changeNumber}
        </>
      )}

      {step === "signup" && (
        <>
          {phoneField}
          <p className="muted">{tr("authNewAccount")}</p>
          <label>
            {tr("name")}
            <input ref={nameRef} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          {emailField}
          <ConsentBlock consentChecked={consent} onConsentChange={setConsent} marketingChecked={marketing} onMarketingChange={setMarketing} />
          <button className="btn gold" disabled={submitting} onClick={submitSignup}>
            {submitting ? tr("loading") : tr("createAccount")}
          </button>
          {changeNumber}
        </>
      )}

      {step === "code" && (
        <>
          <p className="muted">
            {tr("authCodeSentTo")} <b dir="ltr">{sentTo}</b>
          </p>
          <OtpInput value={code} onChange={setCode} disabled={submitting} />
          <button className="btn gold" disabled={submitting} onClick={submitCode}>
            {submitting ? tr("loading") : tr("authConfirm")}
          </button>
          <button type="button" className="link-btn" disabled={submitting} onClick={resend}>
            {tr("authResend")}
          </button>
          {canChangeEmail && (
            <button type="button" className="link-btn" onClick={() => { setStep("email"); setMessage(""); }}>
              {tr("authWrongEmail")}
            </button>
          )}
          {changeNumber}
        </>
      )}

      <div className="muted">{message}</div>
    </div>
  );
}

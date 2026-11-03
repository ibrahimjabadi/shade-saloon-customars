import { useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { AuthStart } from "../lib/types";
import { errText, useApp, useT } from "../store/app";
import { CodeInput, Spinner } from "./ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COUNTRIES: [string, string, string][] = [
  ["962", "🇯🇴", "الأردن / Jordan"],
  ["966", "🇸🇦", "السعودية / KSA"],
  ["971", "🇦🇪", "الإمارات / UAE"],
  ["970", "🇵🇸", "فلسطين / Palestine"],
  ["965", "🇰🇼", "الكويت / Kuwait"],
  ["974", "🇶🇦", "قطر / Qatar"],
  ["973", "🇧🇭", "البحرين / Bahrain"],
  ["968", "🇴🇲", "عُمان / Oman"],
  ["964", "🇮🇶", "العراق / Iraq"],
  ["961", "🇱🇧", "لبنان / Lebanon"],
  ["963", "🇸🇾", "سوريا / Syria"],
  ["20", "🇪🇬", "مصر / Egypt"],
  ["1", "🇺🇸", "USA / Canada"],
  ["44", "🇬🇧", "UK"],
];

/** Sign in without a password: phone → (code to email | email needed |
 * new account) → code. A brand-new account is signed in straight away. */
export function AuthForm({ onDone }: { onDone?: () => void }) {
  const t = useT();
  const { settings, signedIn, lang } = useApp();
  const [step, setStep] = useState<"phone" | "email" | "signup" | "code">("phone");
  const [cc, setCc] = useState("962");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [mkt, setMkt] = useState(false);
  const [code, setCode] = useState("");
  const [ch, setCh] = useState({ id: "", to: "", canChange: false });
  const [msg, setMsg] = useState("");
  const [hint, setHint] = useState<{ suggestion?: string; warn?: string }>({});
  const [busy, setBusy] = useState(false);
  const [policy, setPolicy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const full = () => `+${cc}${phone.replace(/\D/g, "").replace(/^0+/, "")}`;
  const needConsent = settings.requireCustomerConsent !== false;

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      await fn();
    } catch (e) {
      setMsg(errText(e, t));
      if (e instanceof ApiError && e.suggestion) setHint({ suggestion: e.suggestion });
    } finally {
      setBusy(false);
    }
  }
  function after(r: AuthStart) {
    if (r.status === "signed_in" && r.customerToken && r.account) {
      signedIn(r.customerToken, r.account);
      onDone?.();
    } else if (r.status === "code_sent") {
      setCh({ id: r.challengeId || "", to: r.sentTo || "", canChange: !!r.canChangeEmail });
      setCode("");
      setStep("code");
    } else if (r.status === "need_email") setStep("email");
    else {
      setStep("signup");
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }
  const start = (withEmail = false) =>
    run(async () =>
      after(
        await api<AuthStart>("/api/customer/auth/start", { body: { phone: full(), ...(withEmail ? { email } : {}) } }),
      ),
    );

  function submitPhone() {
    if (phone.replace(/\D/g, "").length < 7) return setMsg(t("errPhone"));
    start();
  }
  function submitEmail() {
    if (!EMAIL.test(email.trim())) return setMsg(t("errEmail"));
    start(true);
  }
  function submitSignup() {
    if (!name.trim()) return setMsg(t("errName"));
    if (!EMAIL.test(email.trim())) return setMsg(t("errEmail"));
    if (needConsent && !consent) return setMsg(t("consentReq"));
    run(async () =>
      after(
        await api<AuthStart>("/api/customer/register", {
          body: {
            name: name.trim(),
            phone: full(),
            email: email.trim(),
            consent: needConsent ? consent : true,
            marketingConsent: mkt,
          },
        }),
      ),
    );
  }
  function submitCode() {
    if (code.length !== 6) return setMsg(t("errCode"));
    run(async () => {
      const r = await api<{ customerToken: string; account: AuthStart["account"] }>("/api/customer/auth/verify", {
        body: { challengeId: ch.id, code },
      });
      signedIn(r.customerToken, r.account!);
      onDone?.();
    });
  }
  async function checkEmail() {
    setHint({});
    if (!EMAIL.test(email.trim())) return;
    try {
      const r = await api<{ ok: boolean; suggestion?: string; message?: string }>(
        `/api/email-check?email=${encodeURIComponent(email.trim())}`,
      );
      if (r.suggestion) setHint({ suggestion: r.suggestion });
      else if (!r.ok) setHint({ warn: r.message || t("errEmail") });
    } catch {
      /* a hint only */
    }
  }

  const phoneField = (
    <label className="label">
      {t("phone")}
      <div className="field phone">
        <select value={cc} onChange={(e) => setCc(e.target.value)} disabled={step !== "phone"} aria-label="country">
          {COUNTRIES.map(([c, f, n]) => (
            <option key={c} value={c}>
              {f} +{c} {n}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          dir="ltr"
          placeholder="7X XXX XXXX"
          value={phone}
          disabled={step !== "phone"}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitPhone()}
        />
      </div>
    </label>
  );
  const emailField = (
    <label className="label">
      {t("email")}
      <div className="field">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setHint({});
          }}
          onBlur={checkEmail}
        />
      </div>
      {hint.suggestion && (
        <span className="hint">
          {t("didYouMean")}{" "}
          <button
            type="button"
            className="link"
            dir="ltr"
            onClick={() => {
              setEmail(hint.suggestion!);
              setHint({});
              setMsg("");
            }}
          >
            {hint.suggestion}
          </button>
          ؟
        </span>
      )}
      {hint.warn && <span className="hint bad">{hint.warn}</span>}
    </label>
  );
  const changeNumber = (
    <button
      type="button"
      className="link"
      onClick={() => {
        setStep("phone");
        setMsg("");
      }}
    >
      {t("changeNumber")}
    </button>
  );
  const go = (label: string, fn: () => void) => (
    <button className="btn gold wide" disabled={busy} onClick={fn}>
      {busy ? <Spinner size={18} /> : label}
    </button>
  );
  const policyText = lang === "ar" ? settings.privacyPolicyAr : settings.privacyPolicyEn || settings.privacyPolicyAr;

  return (
    <div className="auth stack">
      {step === "phone" && (
        <>
          <p className="muted">{t("signInSub")}</p>
          {phoneField}
          {go(t("continue"), submitPhone)}
        </>
      )}
      {step === "email" && (
        <>
          {phoneField}
          <p className="muted">{ch.canChange ? t("fixEmail") : t("needEmail")}</p>
          {emailField}
          {go(t("sendCode"), submitEmail)}
          {changeNumber}
        </>
      )}
      {step === "signup" && (
        <>
          {phoneField}
          <p className="muted">{t("newAccount")}</p>
          <label className="label">
            {t("name")}
            <div className="field">
              <input ref={nameRef} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </label>
          {emailField}
          {needConsent && (
            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                {t("consent")}{" "}
                {policyText && (
                  <button
                    type="button"
                    className="link"
                    onClick={(e) => {
                      e.preventDefault();
                      setPolicy(!policy);
                    }}
                  >
                    {t("readPolicy")}
                  </button>
                )}
              </span>
            </label>
          )}
          {policy && policyText && <div className="card policy">{policyText}</div>}
          <label className="check">
            <input type="checkbox" checked={mkt} onChange={(e) => setMkt(e.target.checked)} />
            <span>{(lang === "ar" ? settings.marketingConsentAr : settings.marketingConsentEn) || t("marketing")}</span>
          </label>
          {go(t("createAccount"), submitSignup)}
          {changeNumber}
        </>
      )}
      {step === "code" && (
        <>
          <p className="muted">
            {t("codeSentTo")} <b dir="ltr">{ch.to}</b>
          </p>
          <CodeInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setMsg("");
            }}
            disabled={busy}
          />
          {go(t("confirm"), submitCode)}
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <button type="button" className="link" disabled={busy} onClick={() => start(!!email)}>
              {t("resend")}
            </button>
            {ch.canChange && (
              <button
                type="button"
                className="link"
                onClick={() => {
                  setStep("email");
                  setMsg("");
                }}
              >
                {t("wrongEmail")}
              </button>
            )}
            {changeNumber}
          </div>
        </>
      )}
      {msg && <p className="err">{msg}</p>}
    </div>
  );
}

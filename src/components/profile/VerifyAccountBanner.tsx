import { useState } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { resolveErrorMessage } from "../../api/client";
import type { VerifyChannel } from "../../api/types";
import { OtpInput } from "./OtpInput";

/** Shown on the logged-in Profile view for whichever contact channel(s)
 * aren't verified yet. Verification is informational, not a gate — this
 * never blocks booking/using the app, it just nudges the customer to
 * confirm. Sending can fail with a real backend error (e.g. the salon
 * hasn't configured SMTP/Twilio yet) — that's surfaced as-is rather than
 * pretended away, same as everywhere else this app calls the backend. */
export function VerifyAccountBanner() {
  const { tr } = useTranslation();
  const account = useAppStore((s) => s.account);
  const sendVerification = useAppStore((s) => s.sendVerification);
  const confirmVerification = useAppStore((s) => s.confirmVerification);

  const [activeChannel, setActiveChannel] = useState<VerifyChannel | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!account) return null;
  const pending: VerifyChannel[] = [];
  if (account.email && !account.emailVerified) pending.push("email");
  if (!account.phoneVerified) pending.push("phone");
  if (!pending.length) return null;

  async function handleSend(channel: VerifyChannel) {
    setBusy(true);
    setError("");
    try {
      await sendVerification(channel);
      setActiveChannel(channel);
      setCode("");
    } catch (err) {
      setError(resolveErrorMessage(err, tr));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!activeChannel || !code.trim()) return;
    setBusy(true);
    setError("");
    try {
      await confirmVerification(activeChannel, code.trim());
      setActiveChannel(null);
      setCode("");
    } catch (err) {
      setError(resolveErrorMessage(err, tr));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card verify-account-card" style={{ marginTop: 14 }}>
      <strong>{tr("verifyAccountTitle")}</strong>
      {pending.map((channel) => (
        <div key={channel} className="verify-account-row">
          <span className="muted">{tr(channel === "email" ? "verifyEmailPending" : "verifyPhonePending")}</span>
          <button className="btn small secondary" disabled={busy} onClick={() => void handleSend(channel)}>
            {tr(activeChannel === channel ? "resendCode" : "sendCode")}
          </button>
        </div>
      ))}
      {activeChannel && (
        <div className="verify-account-confirm">
          <span className="muted">{tr("verificationCodeSentHint")}</span>
          <OtpInput value={code} onChange={setCode} disabled={busy} />
          <button className="btn small gold" disabled={busy || !code.trim()} onClick={() => void handleConfirm()}>
            {tr("confirmCode")}
          </button>
        </div>
      )}
      {error && <div className="muted">{error}</div>}
    </div>
  );
}

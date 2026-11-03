import { useEffect, useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { Icon } from "../components/Icon";
import { CodeInput, Sheet, Spinner } from "../components/ui";
import { api } from "../lib/api";
import { dayLabel, initial, money } from "../lib/format";
import type { Account as Acc, Loyalty, Offer } from "../lib/types";
import { errText, useApp, useT } from "../store/app";
import { BranchPicker } from "./Home";

const CAT_AR: Record<string, string> = { VIP: "VIP", Regular: "عميل دائم", "New Customer": "عميل جديد", Inactive: "عميل منقطع" };
const CAT_EN: Record<string, string> = { Regular: "Regular", "New Customer": "New", Inactive: "Inactive", VIP: "VIP" };

type Panel = null | "edit" | "branches" | "privacy" | "offers";

// Signed out: sign in / sign up. Signed in: who you are, your points and
// VIP progress, confirming your email/phone, your details, offers,
// branches, language and look, privacy, your data, sign out.
export function Account() {
  const t = useT();
  const { account, settings, lang, setLang, theme, setTheme, logout, say } = useApp();
  const [panel, setPanel] = useState<Panel>(null);
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [delPending, setDelPending] = useState(false);

  useEffect(() => {
    if (!account) return;
    api<Loyalty>("/api/customer/me/loyalty").then(setLoyalty).catch(() => {});
    api<Offer[]>("/api/customer/offers").then(setOffers).catch(() => {});
    api<{ pending: boolean }>("/api/customer/me/delete-request").then((r) => setDelPending(r.pending)).catch(() => {});
  }, [account]);

  const prefs = (
    <div className="group">
      <div className="list-row"><span className="ri"><Icon name="globe" size={18} /></span><span className="grow"><b>{t("language")}</b></span>
        <div className="seg mini"><button className={lang === "ar" ? "on" : ""} onClick={() => setLang("ar")}>عربي</button><button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button></div></div>
      <div className="list-row"><span className="ri"><Icon name={theme === "dark" ? "moon" : "sun"} size={18} /></span><span className="grow"><b>{t("appearance")}</b></span>
        <div className="seg mini"><button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>{t("dark")}</button><button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>{t("light")}</button></div></div>
      <Row icon="branch" label={t("branchesTitle")} onClick={() => setPanel("branches")} />
      {(settings.privacyPolicyAr || settings.termsAr) && <Row icon="shield" label={t("privacy")} onClick={() => setPanel("privacy")} />}
    </div>
  );

  if (!account) return (
    <>
      <div className="page-head"><h1>{t("signInTitle")}</h1></div>
      <div className="card"><AuthForm /></div>
      <div className="sec-title" />
      {prefs}
      {panel === "branches" && <BranchPicker onClose={() => setPanel(null)} />}
      {panel === "privacy" && <Privacy onClose={() => setPanel(null)} />}
    </>
  );

  async function exportData() {
    try {
      const d = await api<unknown>("/api/customer/me/export");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }));
      a.download = "shadi-saloon-my-data.json";
      a.click();
    } catch (e) { say(errText(e, t), true); }
  }
  async function requestDelete() {
    if (!window.confirm(t("deleteQ"))) return;
    try { await api("/api/customer/me/delete-request", { body: {} }); setDelPending(true); say(t("deleteSent")); } catch (e) { say(errText(e, t), true); }
  }

  return (
    <>
      <section className="me">
        <span className="me-av">{initial(account.name)}</span>
        <div className="grow" style={{ minWidth: 0 }}>
          <h1>{account.name}</h1>
          <p className="num" dir="ltr">{account.phone}</p>
          {account.email && <p dir="ltr">{account.email}</p>}
        </div>
        <button className="icon-btn" aria-label={t("editInfo")} onClick={() => setPanel("edit")}><Icon name="edit" size={18} /></button>
      </section>

      {loyalty && <LoyaltyCard l={loyalty} />}
      <Verify a={account} />

      {offers.length > 0 && (
        <button className="promo" onClick={() => setPanel("offers")}>
          <span className="pi"><Icon name="gift" size={22} /></span>
          <span className="grow"><b>{t("offersTitle")}</b><small>{offers[0].name}{offers.length > 1 ? ` +${offers.length - 1}` : ""}</small></span>
          <Icon name="chevron" size={18} />
        </button>
      )}

      <div className="sec-title" />
      <div className="group">
        <Row icon="user" label={t("myInfo")} sub={account.email || account.phone} onClick={() => setPanel("edit")} />
        <Row icon="gift" label={t("offers")} sub={offers.length ? `${offers.length}` : t("noOffers")} onClick={() => setPanel("offers")} />
      </div>
      <div className="sec-title" />
      {prefs}
      <div className="sec-title" />
      <div className="group">
        {settings.allowCustomerDataExport !== false && <Row icon="download" label={t("exportData")} onClick={exportData} />}
        {settings.allowCustomerDataDeleteRequest !== false && <Row icon="trash" label={delPending ? t("deletePending") : t("deleteAccount")} onClick={delPending ? undefined : requestDelete} bad={!delPending} />}
        <Row icon="logout" label={t("logout")} onClick={() => window.confirm(t("logoutQ")) && logout()} bad />
      </div>

      {panel === "edit" && <EditInfo a={account} onClose={() => setPanel(null)} />}
      {panel === "branches" && <BranchPicker onClose={() => setPanel(null)} />}
      {panel === "privacy" && <Privacy onClose={() => setPanel(null)} />}
      {panel === "offers" && <Offers list={offers} onClose={() => setPanel(null)} />}
    </>
  );
}

function Row({ icon, label, sub, onClick, bad }: { icon: string; label: string; sub?: string; onClick?: () => void; bad?: boolean }) {
  return (
    <button className={`list-row ${bad ? "bad" : ""}`} onClick={onClick} disabled={!onClick}>
      <span className="ri"><Icon name={icon} size={18} /></span>
      <span className="grow" style={{ minWidth: 0 }}><b>{label}</b>{sub && <small>{sub}</small>}</span>
      {onClick && <Icon name="chevron" size={16} />}
    </button>
  );
}

function LoyaltyCard({ l }: { l: Loyalty }) {
  const t = useT();
  const { settings, lang } = useApp();
  const v = l.vip;
  return (
    <section className={`loyal ${l.isVip ? "vip" : ""}`}>
      <div className="loyal-top">
        <div><b className="num">{l.points}</b><small>{t("points")}</small></div>
        {l.isVip ? <span className="vip-badge">{t("vipYou")}</span> : <span className="pill gold nodot">{(lang === "ar" ? CAT_AR[l.category] : CAT_EN[l.category]) || l.category || "—"}</span>}
      </div>
      <div className="loyal-stats">
        <span><b className="num">{l.visits}</b> {t("visits")}</span>
        <span><b className="num">{money(l.spent, settings.currency, lang)}</b> {t("spent")}</span>
        {l.memberSince && <span>{t("memberSince")} <b>{dayLabel(l.memberSince, lang, { month: "short", year: "numeric" })}</b></span>}
      </div>
      {!l.isVip && (v.visitThreshold > 0 || v.spendThreshold > 0) && (
        <div className="vip-prog">
          <div className="bar"><i style={{ width: `${Math.round(v.progress * 100)}%` }} /></div>
          <small>{t("vipLeft")}: {v.visitThreshold > 0 && <><b className="num">{v.visitsLeft}</b> {t("vipVisitsLeft")}</>}{v.visitThreshold > 0 && v.spendThreshold > 0 && ` ${t("vipOr")} `}{v.spendThreshold > 0 && <b className="num">{money(v.spendLeft, settings.currency, lang)}</b>}</small>
        </div>
      )}
      {l.favoriteBarber && <small className="fav">{t("favBarber")}: <b>{l.favoriteBarber.name}</b></small>}
    </section>
  );
}

/** Confirm an unconfirmed email or phone with a code. */
function Verify({ a }: { a: Acc }) {
  const t = useT();
  const { setAccount, say } = useApp();
  const [ch, setCh] = useState<"email" | "phone" | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [hide, setHide] = useState(false);
  const pending: ("email" | "phone")[] = [];
  if (a.email && !a.emailVerified) pending.push("email");
  if (!a.phoneVerified) pending.push("phone");
  if (!pending.length || hide) return null;
  async function send(c: "email" | "phone") {
    setBusy(true);
    try { await api("/api/customer/verify/send", { body: { channel: c } }); setCh(c); setCode(""); } catch (e) { say(errText(e, t), true); } finally { setBusy(false); }
  }
  async function confirm() {
    if (!ch || code.length < 4) return;
    setBusy(true);
    try { const r = await api<{ account: Acc }>("/api/customer/verify/confirm", { body: { channel: ch, code } }); setAccount({ ...a, ...r.account }); setCh(null); say(t("saved")); } catch (e) { say(errText(e, t), true); } finally { setBusy(false); }
  }
  return (
    <div className="card verify">
      <div className="row"><Icon name="shield" size={18} /><b className="grow">{t("verifyTitle")}</b><button className="icon-btn" aria-label={t("close")} onClick={() => setHide(true)}><Icon name="x" size={16} /></button></div>
      {pending.map((c) => (
        <div key={c} className="row" style={{ marginTop: 8 }}>
          <span className="grow muted">{c === "email" ? t("verifyEmail") : t("verifyPhone")}</span>
          <button className="btn sm soft" disabled={busy} onClick={() => send(c)}>{ch === c ? t("resend") : t("sendCode")}</button>
        </div>
      ))}
      {ch && <div className="stack" style={{ marginTop: 12 }}><small className="muted">{t("codeHint")}</small><CodeInput value={code} onChange={setCode} disabled={busy} /><button className="btn gold wide" disabled={busy || code.length < 4} onClick={confirm}>{t("confirm")}</button></div>}
    </div>
  );
}

function EditInfo({ a, onClose }: { a: Acc; onClose: () => void }) {
  const t = useT();
  const { setAccount, say } = useApp();
  const [v, setV] = useState({ name: a.name, email: a.email || "", marketingConsent: !!a.marketingConsent });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function save() {
    setBusy(true); setErr("");
    try {
      const r = await api<Acc>("/api/customer/me", { method: "PATCH", body: { name: v.name, ...(v.email !== (a.email || "") ? { email: v.email } : {}), marketingConsent: v.marketingConsent } });
      setAccount({ ...a, ...r }); say(t("saved")); onClose();
    } catch (e) { setErr(errText(e, t)); } finally { setBusy(false); }
  }
  return (
    <Sheet title={t("editInfo")} onClose={onClose} tall={false} footer={<button className="btn gold wide" disabled={busy || v.name.trim().length < 2} onClick={save}>{busy ? <Spinner size={18} /> : t("save")}</button>}>
      <div className="stack">
        <label className="label">{t("name")}<div className="field"><input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div></label>
        <label className="label">{t("phone")}<div className="field"><input dir="ltr" value={a.phone} disabled /></div></label>
        <label className="label">{t("email")}<div className="field"><input dir="ltr" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></div>
          {v.email !== (a.email || "") && <span className="hint">{t("emailChangeNote")}</span>}</label>
        <label className="check"><input type="checkbox" checked={v.marketingConsent} onChange={(e) => setV({ ...v, marketingConsent: e.target.checked })} />{t("marketing")}</label>
        {err && <p className="err">{err}</p>}
      </div>
    </Sheet>
  );
}

function Privacy({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { settings, lang } = useApp();
  const pol = lang === "ar" ? settings.privacyPolicyAr : settings.privacyPolicyEn || settings.privacyPolicyAr;
  const terms = lang === "ar" ? settings.termsAr : settings.termsEn || settings.termsAr;
  return (
    <Sheet title={t("privacy")} onClose={onClose}>
      <div className="prose">{pol && <p>{pol}</p>}{terms && <><h3>{t("terms")}</h3><p>{terms}</p></>}</div>
    </Sheet>
  );
}

function Offers({ list, onClose }: { list: Offer[]; onClose: () => void }) {
  const t = useT();
  const { lang, open } = useApp();
  return (
    <Sheet title={t("offers")} onClose={onClose} tall={false}>
      {!list.length ? <p className="muted">{t("noOffers")}</p> : (
        <div className="stack">{list.map((o) => (
          <div key={o.id} className="offer big">
            <Icon name="gift" size={22} />
            <div className="grow"><b>{o.name}</b>{o.message && <small>{o.message}</small>}{o.end && <em>{t("validUntil")} {dayLabel(o.end, lang, { day: "numeric", month: "long" })}</em>}</div>
          </div>
        ))}<button className="btn gold wide" onClick={() => { onClose(); open({ kind: "book" }); }}>{t("bookNow")}</button></div>
      )}
    </Sheet>
  );
}

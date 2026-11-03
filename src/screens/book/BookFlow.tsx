import { useEffect, useMemo, useRef, useState } from "react";
import { AddressPicker, type Picked } from "../../components/AddressPicker";
import { AuthForm } from "../../components/AuthForm";
import { Icon } from "../../components/Icon";
import { Avatar, Empty, Sheet, Spinner, Steps } from "../../components/ui";
import { api, ApiError, media } from "../../lib/api";
import { addDays, bookingRef, dayLabel, dayNum, localDate, money, monthLabel, nextDays, shortDay, timeLabel } from "../../lib/format";
import { haptic } from "../../lib/platform";
import { branchBarbers, calendarLink, offers, serviceName } from "../../lib/salon";
import type { Booking, Service } from "../../lib/types";
import { useSlots, type BarberSlot } from "../../lib/useSlots";
import { errText, useApp, useT, type Flow } from "../../store/app";

type Step = "place" | "address" | "services" | "barber" | "time" | "first" | "account" | "confirm";
type HomeCfg = { enabled: boolean; perKmFee: number; maxKm: number; servicePrices: Record<string, number> };
type Quote = { ok: boolean; fee?: number; distanceKm?: number; error?: string };
const ANY = "any";

// Booking, at the salon or at home, as one flow: (place) → (address) →
// services → barber → time → (first visit?) → (sign in) → confirm → done.
// A time the server refuses (someone took it) sends the customer back to
// the times, refreshed; a network failure keeps everything as it was.
export function BookFlow({ start }: { start: Extract<Flow, { kind: "book" }> }) {
  const t = useT();
  const { closeFlow, branchId, branches, services, barbers, settings, account, bookings, lang, go, loadBookings } = useApp();
  const [mode, setMode] = useState<"salon" | "home" | undefined>(start.mode);
  const [cfg, setCfg] = useState<HomeCfg | null>(null);
  const [loc, setLoc] = useState<Picked | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [picked, setPicked] = useState<string[]>(start.serviceId ? [start.serviceId] : []);
  const [barberId, setBarberId] = useState(start.barberId || "");
  const [date, setDate] = useState(localDate());
  const [slot, setSlot] = useState<BarberSlot | null>(null);
  const [first, setFirst] = useState<boolean | null>(null);
  const [cat, setCat] = useState("all");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Booking | null>(null);
  const [at, setAt] = useState<Step>(start.mode ? (start.mode === "home" ? "address" : start.serviceId ? (start.barberId ? "time" : "barber") : "services") : "place");
  const body = useRef<HTMLDivElement>(null);
  const branch = branches.find((b) => b.id === (start.branchId || branchId))!;

  useEffect(() => { api<HomeCfg>("/api/home-visit/config").then(setCfg).catch(() => setCfg({ enabled: false, perKmFee: 0, maxKm: 0, servicePrices: {} })); }, []);
  useEffect(() => {
    if (!loc) { setQuote(null); return; }
    setQuote(null);
    const qs = new URLSearchParams({ branchId: branch.id, lat: String(loc.lat), lng: String(loc.lng) });
    api<Quote>(`/api/home-visit/quote?${qs}`).then(setQuote).catch((e) => setQuote({ ok: false, error: errText(e, t) }));
    // a new spot, not a new address text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc?.lat, loc?.lng]);

  const home = mode === "home";
  const staff = branchBarbers(barbers, branch.id);
  // at home: only services with a home price, at that price
  const menu: Service[] = useMemo(() => {
    const atBranch = services.filter((s) => staff.some((b) => offers(b, s.id)));
    if (!home) return atBranch;
    return atBranch.filter((s) => cfg?.servicePrices[s.id] != null).map((s) => ({ ...s, price: cfg!.servicePrices[s.id] }));
  }, [services, staff, home, cfg]);
  const chosen = menu.filter((s) => picked.includes(s.id));
  const able = staff.filter((b) => chosen.every((s) => offers(b, s.id)));
  const ids = barberId === ANY ? able.map((b) => b.id) : barberId ? [barberId] : [];
  const slots = useSlots(at === "time" || at === "confirm" ? date : "", ids, picked, branch.id, home, refresh);
  const needFirst = !home && !(bookings || []).some((b) => b.status === "completed");

  const steps: Step[] = [
    ...(start.mode ? [] : ["place" as Step]),
    ...(home ? ["address" as Step] : []),
    "services", "barber", "time",
    ...(needFirst ? ["first" as Step] : []),
    ...(account ? [] : ["account" as Step]),
    "confirm",
  ];
  const idx = steps.indexOf(at);
  const titles: Record<Step, string> = { place: t("where"), address: t("stepAddress"), services: t("stepServices"), barber: t("stepBarber"), time: t("stepTime"), first: t("stepFirst"), account: t("stepAccount"), confirm: t("stepConfirm") };
  const sub = chosen.reduce((a, s) => a + s.price, 0), mins = chosen.reduce((a, s) => a + s.duration, 0);
  const fee = home && quote?.ok ? quote.fee || 0 : 0;

  // a slot that vanished from a refreshed list is dropped
  useEffect(() => {
    if (slot && slots.status === "ready" && !slots.slots.some((s) => s.start === slot.start)) { setSlot(null); setErr(t("slotGone")); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);
  // the chosen barber must still offer every chosen service
  useEffect(() => { if (barberId && barberId !== ANY && !able.some((b) => b.id === barberId)) setBarberId(""); }, [able, barberId]);
  useEffect(() => { body.current?.closest(".sb")?.scrollTo(0, 0); }, [at]);

  const ok = (s: Step) => s === "place" ? !!mode : s === "address" ? !!loc && !!quote?.ok : s === "services" ? picked.length > 0 : s === "barber" ? !!barberId : s === "time" ? !!slot : s === "first" ? first !== null : s === "account" ? !!account : true;
  const nextStep = () => { if (!ok(at)) return; haptic(); setErr(""); setAt(steps[Math.min(idx + 1, steps.length - 1)]); };
  const prevStep = () => { setErr(""); setAt(steps[Math.max(idx - 1, 0)]); };
  const close = () => { if (done || !picked.length || window.confirm(t("leaveQ"))) closeFlow(); };

  async function submit() {
    if (!slot || busy) return;
    setBusy(true); setErr("");
    const notes = home && loc
      ? [lang === "ar" ? "زيارة منزلية" : "Home visit", `${t("stepAddress")}: ${loc.address || `${loc.lat}, ${loc.lng}`}`, `${t("travelFee")}: ${money(fee, settings.currency, "ar")}`].join("\n")
      : first === null ? "" : first ? "أول زيارة: نعم" : "أول زيارة: لا";
    try {
      const b = await api<Booking>("/api/customer/bookings", { body: {
        branchId: branch.id, barberId: slot.barberId, serviceIds: picked, start: slot.start, notes,
        ...(home && loc ? { homeVisit: { lat: loc.lat, lng: loc.lng, address: loc.address || `${loc.lat}, ${loc.lng}` } } : {}),
      } });
      haptic();
      setDone(b);
      void loadBookings();
    } catch (e) {
      setErr(errText(e, t));
      if (e instanceof ApiError) { setSlot(null); setRefresh((r) => r + 1); setAt("time"); }
    } finally { setBusy(false); }
  }

  if (done) return <Success b={done} branchName={branch.name} mapsUrl={branch.googleMapsUrl} onDone={() => { closeFlow(); go("bookings"); }} onClose={closeFlow} />;

  const footer = (
    <>
      <div className="grow sum">
        {picked.length ? <><small className="num">{chosen.length} · {mins} {t("min")}</small><b className="num">{money(sub + fee, settings.currency, lang)}</b></> : <small>{branch.name}</small>}
      </div>
      {idx > 0 && <button className="btn ghost" onClick={prevStep}>{t("back")}</button>}
      {at === "confirm"
        ? <button className="btn gold" disabled={busy || !slot} onClick={submit}>{busy ? <Spinner size={18} /> : t("confirmBooking")}</button>
        : at !== "account" && <button className="btn gold" disabled={!ok(at)} onClick={nextStep}>{t("next")}</button>}
    </>
  );

  return (
    <Sheet title={titles[at]} sub={home ? t("atHome") : branch.name} onClose={close} head={<Steps labels={steps.map((s) => titles[s])} at={idx} />} footer={footer}>
      <div ref={body} className="flow">
        {at === "place" && (
          <div className="stack">
            <button className={`choice big ${mode === "salon" ? "on" : ""}`} onClick={() => { setMode("salon"); setAt("services"); }}>
              <span className="ci"><Icon name="scissors" size={24} /></span><span><b>{t("atSalon")}</b><small>{branch.name}</small></span>
            </button>
            <button className={`choice big ${mode === "home" ? "on" : ""}`} disabled={cfg ? !cfg.enabled : false} onClick={() => { setMode("home"); setAt("address"); }}>
              <span className="ci"><Icon name="house" size={24} /></span><span><b>{t("atHome")}</b><small>{cfg && !cfg.enabled ? t("homeOff") : t("atHomeSub")}</small></span>
            </button>
          </div>
        )}

        {at === "address" && (cfg && !cfg.enabled ? <Empty icon="house" title={t("homeOff")} /> : (
          <>
            <AddressPicker value={loc} onChange={setLoc} />
            {loc && !quote && <p className="hint" style={{ marginTop: 10 }}><Spinner size={14} /> {t("loading")}</p>}
            {quote?.ok && <div className="quote"><span>{t("travelFee")}</span><b className="num">{money(quote.fee, settings.currency, lang)}</b><small className="num">{quote.distanceKm} {t("kmAway")}{cfg?.perKmFee ? ` · ${money(cfg.perKmFee, settings.currency, lang)} ${t("perKm")}` : ""}</small></div>}
            {quote && !quote.ok && <p className="err" style={{ marginTop: 10 }}>{quote.error}</p>}
          </>
        ))}

        {at === "services" && (
          <>
            {home && <p className="hint" style={{ marginBottom: 10 }}>{t("homeOnlyServices")}</p>}
            <div className="chips" style={{ marginBottom: 12 }}>
              {["all", ...new Set(menu.map((s) => s.category || ""))].filter((c) => c !== "").map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c === "all" ? t("all") : c}</button>)}
            </div>
            {!menu.length ? <Empty icon="scissors" title={t("noServices")} /> : (
              <div className="pick-list">{menu.filter((s) => cat === "all" || s.category === cat).map((s) => {
                const on = picked.includes(s.id);
                return (
                  <button key={s.id} className={`pick ${on ? "on" : ""}`} onClick={() => { haptic(); setPicked(on ? picked.filter((x) => x !== s.id) : [...picked, s.id]); setSlot(null); }} aria-pressed={on}>
                    <span className="grow"><b>{serviceName(s, lang)}</b><small className="num">{s.duration} {t("min")}</small></span>
                    <b className="num">{money(s.price, settings.currency, lang)}</b>
                    <span className="tick">{on && <Icon name="check" size={15} />}</span>
                  </button>
                );
              })}</div>
            )}
          </>
        )}

        {at === "barber" && (
          <div className="barber-grid">
            {able.length > 1 && (
              <button className={`bcard ${barberId === ANY ? "on" : ""}`} onClick={() => { setBarberId(ANY); setSlot(null); }}>
                <span className="avatar any"><Icon name="sparkle" size={26} /></span><b>{t("anyBarber")}</b><small>&nbsp;</small>
              </button>
            )}
            {able.map((b) => (
              <button key={b.id} className={`bcard ${barberId === b.id ? "on" : ""}`} onClick={() => { haptic(); setBarberId(b.id); setSlot(null); }}>
                <Avatar name={b.name} url={b.photoUrl} id={b.id} size={64} /><b>{b.name}</b><small>{b.title || ""}</small>
              </button>
            ))}
            {!able.length && <Empty icon="team" title={t("noTeam")} />}
          </div>
        )}

        {at === "time" && <TimePicker date={date} setDate={(d) => { setDate(d); setSlot(null); setErr(""); }} slots={slots} slot={slot} setSlot={(s) => { haptic(); setSlot(s); setErr(""); }} err={err} showBarber={barberId === ANY} />}

        {at === "first" && (
          <div className="stack">
            <p className="muted">{t("firstQ")}</p>
            <button className={`choice ${first === true ? "on" : ""}`} onClick={() => setFirst(true)}><span className="ci"><Icon name="sparkle" size={20} /></span><span><b>{t("firstYes")}</b><small>{t("firstYesSub")}</small></span></button>
            <button className={`choice ${first === false ? "on" : ""}`} onClick={() => setFirst(false)}><span className="ci"><Icon name="heart" size={20} /></span><span><b>{t("firstNo")}</b><small>{t("firstNoSub")}</small></span></button>
          </div>
        )}

        {at === "account" && <AuthForm onDone={() => setAt("confirm")} />}

        {at === "confirm" && slot && (
          <div className="stack">
            <div className="confirm-head">
              {home ? <span className="ci"><Icon name="house" size={22} /></span> : branch.galleryPhotos?.[0] ? <img src={media(branch.galleryPhotos[0].url)} alt="" /> : <span className="ci"><Icon name="scissors" size={22} /></span>}
              <div><b>{home ? t("atHome") : branch.name}</b><small>{home ? loc?.address : [branch.address, branch.city].filter(Boolean).join(" · ")}</small></div>
            </div>
            <div className="when">
              <Icon name="calendar" size={20} />
              <div><b>{dayLabel(date, lang)}</b><small className="num">{timeLabel(slot.start, lang)} – {timeLabel(slot.end, lang)}</small></div>
              {(() => { const b = staff.find((x) => x.id === slot.barberId); return b && <span className="who"><Avatar name={b.name} url={b.photoUrl} id={b.id} size={30} />{b.name}</span>; })()}
            </div>
            <div className="group">
              {chosen.map((s) => <div key={s.id} className="line"><span>{serviceName(s, lang)} <small className="muted num">· {s.duration} {t("min")}</small></span><b className="num">{money(s.price, settings.currency, lang)}</b></div>)}
              {home && <div className="line"><span>{t("travelFee")}</span><b className="num">{money(fee, settings.currency, lang)}</b></div>}
              <div className="line total"><span>{home ? t("estTotal") : t("total")}</span><b className="num">{money(sub + fee, settings.currency, lang)}</b></div>
            </div>
            {home && <p className="hint">{t("travelNote")}</p>}
            <div className="policy-box"><b>{t("policy")}</b><p>{settings.allowCustomerCancel !== false ? t("policyFree") : t("policyRestricted")}</p></div>
            {err && <p className="err">{err}</p>}
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** Day strip (two weeks, more via the date picker) and the free times,
 * split into morning / afternoon / evening. */
export function TimePicker({ date, setDate, slots, slot, setSlot, err, showBarber }: {
  date: string; setDate: (d: string) => void; slots: ReturnType<typeof useSlots>; slot: BarberSlot | null; setSlot: (s: BarberSlot) => void; err?: string; showBarber?: boolean;
}) {
  const t = useT();
  const { lang, barbers } = useApp();
  const picker = useRef<HTMLInputElement>(null);
  const days = nextDays(14);
  const strip = days.includes(date) ? days : [date, ...days.slice(0, 13)];
  // the salon's day can run past midnight: those hours come last, on their own
  const h = (x: BarberSlot) => new Date(x.start).getHours();
  const late = (x: BarberSlot) => localDate(new Date(x.start)) !== date;
  const parts: [string, BarberSlot[]][] = [
    [lang === "ar" ? "الصبح" : "Morning", slots.slots.filter((x) => !late(x) && h(x) < 12)],
    [lang === "ar" ? "الظهر" : "Afternoon", slots.slots.filter((x) => !late(x) && h(x) >= 12 && h(x) < 17)],
    [lang === "ar" ? "المسا" : "Evening", slots.slots.filter((x) => !late(x) && h(x) >= 17)],
    [lang === "ar" ? "بعد نص الليل" : "After midnight", slots.slots.filter(late)],
  ];
  return (
    <>
      <div className="month-row">
        <button className="month" onClick={() => { try { picker.current?.showPicker(); } catch { picker.current?.focus(); } }}>
          {monthLabel(date, lang)} <Icon name="chevron" size={14} />
          <input ref={picker} type="date" min={localDate()} max={addDays(localDate(), 365)} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} tabIndex={-1} />
        </button>
      </div>
      <div className="days">{strip.map((d) => (
        <button key={d} className={d === date ? "on" : ""} onClick={() => setDate(d)}>
          <small>{d === localDate() ? (lang === "ar" ? "اليوم" : "Today") : shortDay(d, lang)}</small><b className="num">{dayNum(d)}</b>
        </button>
      ))}</div>
      {err && <p className="err" style={{ marginBottom: 10 }}>{err}</p>}
      {slots.status === "loading" && !slots.slots.length && <div className="slots skel">{Array.from({ length: 8 }, (_, i) => <span key={i} />)}</div>}
      {slots.status === "error" && <p className="err">{slots.error || t("errNetwork")}</p>}
      {slots.status === "ready" && !slots.slots.length && <Empty icon="clock" title={t("noSlots")} text={t("noSlotsHint")} />}
      {slots.slots.length > 0 && parts.filter(([, l]) => l.length).map(([label, list]) => (
        <div key={label} className="slot-part">
          <small>{label}</small>
          <div className={`slots ${slots.status === "loading" ? "dim" : ""}`}>{list.map((s) => (
            <button key={s.start} className={slot?.start === s.start ? "on" : ""} onClick={() => setSlot(s)}>
              <b className="num">{timeLabel(s.start, lang).replace(/ (ص|م|AM|PM)$/, "")}<i>{timeLabel(s.start, lang).match(/(ص|م|AM|PM)$/)?.[0]}</i></b>
              {showBarber && <small>{barbers.find((b) => b.id === s.barberId)?.name.split(" ")[0]}</small>}
            </button>
          ))}</div>
        </div>
      ))}
    </>
  );
}

function Success({ b, branchName, mapsUrl, onDone, onClose }: { b: Booking; branchName: string; mapsUrl?: string; onDone: () => void; onClose: () => void }) {
  const t = useT();
  const { settings, lang } = useApp();
  const [rated, setRated] = useState(false);
  return (
    <Sheet title={t("booked")} onClose={onClose} footer={<button className="btn gold wide" onClick={onDone}>{t("toMyBookings")}</button>}>
      <div className="success">
        <div className="tickmark"><Icon name="check" size={40} /></div>
        <h3>{t("seeYou")}</h3>
        <div className="group">
          <div className="line"><span>{t("ref")}</span><b className="num">{bookingRef(b.id)}</b></div>
          <div className="line"><span>{b.homeVisit ? t("atHome") : t("branch")}</span><b>{b.homeVisit?.address || b.branch?.name || branchName}</b></div>
          <div className="line"><span>{t("services")}</span><b>{(b.services || []).map((s) => serviceName(s, lang)).join(" · ")}</b></div>
          <div className="line"><span>{t("barber")}</span><b className="row" style={{ gap: 6 }}>{b.barber?.photoUrl && <Avatar name={b.barber.name} url={b.barber.photoUrl} size={24} />}{b.barber?.name}</b></div>
          <div className="line"><span>{t("time")}</span><b className="num">{dayLabel(b.start, lang, { weekday: "short", day: "numeric", month: "short" })} · {timeLabel(b.start, lang)}</b></div>
          <div className="line total"><span>{t("total")}</span><b className="num">{money(b.total, settings.currency, lang)}</b></div>
        </div>
        <a className="btn ghost wide" href={calendarLink(b.start, b.end, "SHADI SALOON", b.homeVisit?.address || b.branch?.name || branchName)} target="_blank" rel="noopener"><Icon name="calendar" size={18} />{t("addCalendar")}</a>
        {mapsUrl && !rated && (
          <div className="card google">
            <small>{t("rateGoogle")}</small>
            <div className="stars">{[1, 2, 3, 4, 5].map((n) => <button key={n} style={{ fontSize: 28 }} onClick={() => { window.open(mapsUrl, "_blank", "noopener"); setRated(true); }}>★</button>)}</div>
            <button className="link" onClick={() => setRated(true)}>{t("notNow")}</button>
          </div>
        )}
      </div>
    </Sheet>
  );
}

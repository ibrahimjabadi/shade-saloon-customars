import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Avatar, Empty, Loading, Sheet, Spinner, Stars } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { dayLabel, localDate, money, timeLabel, whenLabel } from "../lib/format";
import { haptic } from "../lib/platform";
import { bookingState, serviceName } from "../lib/salon";
import type { Booking } from "../lib/types";
import { useSlots, type BarberSlot } from "../lib/useSlots";
import { errText, useApp, useT } from "../store/app";
import { TimePicker } from "./book/BookFlow";

const status = bookingState;
const isUpcoming = (b: Booking) => bookingState(b) === "upcoming";

// The customer's visits: upcoming (reschedule / cancel) and past (rate,
// book the same again).
export function Bookings() {
  const t = useT();
  const { account, bookings, bookingsError, loadBookings, go } = useApp();
  const [view, setView] = useState<"up" | "past">("up");
  useEffect(() => { if (account) void loadBookings(); }, [account, loadBookings]);

  if (!account) return (
    <>
      <div className="page-head"><h1>{t("tabBookings")}</h1></div>
      <Empty icon="calendar" title={t("signInToSee")}><button className="btn gold" onClick={() => go("account")}>{t("signIn")}</button></Empty>
    </>
  );
  const up = (bookings || []).filter(isUpcoming).sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const past = (bookings || []).filter((b) => !isUpcoming(b)).sort((a, b) => +new Date(b.start) - +new Date(a.start));
  const list = view === "up" ? up : past;

  return (
    <>
      <div className="page-head"><h1>{t("tabBookings")}</h1></div>
      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={view === "up" ? "on" : ""} onClick={() => setView("up")}>{t("upcoming")} {up.length > 0 && <span className="num">({up.length})</span>}</button>
        <button className={view === "past" ? "on" : ""} onClick={() => setView("past")}>{t("past")}</button>
      </div>
      {bookings === null && !bookingsError ? <Loading /> : bookingsError ? (
        <Empty icon="globe" title={errText(new Error(bookingsError), t)}><button className="btn ghost" onClick={loadBookings}>{t("retry")}</button></Empty>
      ) : !list.length ? (
        view === "up" ? <Empty icon="calendar" title={t("noUpcoming")}><button className="btn gold" onClick={() => go("book")}>{t("bookFirst")}</button></Empty> : <Empty icon="clock" title={t("noPast")} />
      ) : (
        <div className="stack">{list.map((b) => <BookingCard key={b.id} b={b} />)}</div>
      )}
    </>
  );
}

function BookingCard({ b }: { b: Booking }) {
  const t = useT();
  const { settings, open, loadBookings, say, lang, loadUnread } = useApp();
  const [busy, setBusy] = useState(false);
  const st = status(b);
  const upcoming = isUpcoming(b);
  async function cancel() {
    if (!window.confirm(t("cancelQ"))) return;
    setBusy(true);
    try { await api(`/api/customer/bookings/${encodeURIComponent(b.id)}/cancel`, { body: {} }); say(t("cancelled")); await loadBookings(); void loadUnread(); }
    catch (e) { say(errText(e, t), true); } finally { setBusy(false); }
  }
  const pill = st === "completed" ? "ok" : st === "cancelled" || st === "no_show" ? "bad" : st === "past" ? "mute" : "gold";
  return (
    <article className={`bk ${upcoming ? "up" : ""}`}>
      <div className="bk-top">
        <div className="bk-date"><b className="num">{new Date(b.start).getDate()}</b><small>{dayLabel(b.start, lang, { month: "short" })}</small></div>
        <div className="grow" style={{ minWidth: 0 }}>
          <b className="bk-when">{upcoming ? whenLabel(b.start, lang) : `${dayLabel(b.start, lang, { weekday: "long" })} · ${timeLabel(b.start, lang)}`}</b>
          <p className="bk-svc">{(b.services || []).map((s) => serviceName(s, lang)).join(" · ") || "—"}</p>
          <p className="bk-where">{b.homeVisit ? <><Icon name="house" size={13} /> {b.homeVisit.address}</> : b.branch?.name}</p>
        </div>
        <span className={`pill ${pill}`}>{t(`st_${st}` as "st_upcoming") || st}</span>
      </div>
      <div className="bk-mid">
        {b.barber?.name && <span className="who"><Avatar name={b.barber.name} url={b.barber.photoUrl} id={b.barber.id} size={26} />{b.barber.name}</span>}
        <b className="num">{money(b.total, settings.currency, lang)}</b>
      </div>
      {upcoming && (settings.allowCustomerReschedule !== false || settings.allowCustomerCancel !== false) && (
        <div className="bk-acts">
          {settings.allowCustomerReschedule !== false && <button className="btn sm soft" onClick={() => open({ kind: "reschedule", booking: b })}><Icon name="clock" size={15} />{t("reschedule")}</button>}
          {settings.allowCustomerCancel !== false && <button className="btn sm bad" disabled={busy} onClick={cancel}>{busy ? <Spinner size={14} /> : t("cancelBooking")}</button>}
        </div>
      )}
      {!upcoming && (
        <div className="bk-acts">
          {st === "completed" && (b.rated ? <span className="muted small">{t("rated")}</span> : <button className="btn sm soft" onClick={() => open({ kind: "review", booking: b })}><Icon name="star" size={15} />{t("rate")}</button>)}
          {!b.homeVisit && <button className="btn sm ghost" onClick={() => open({ kind: "book", mode: "salon", barberId: b.barberId, serviceId: b.serviceIds?.[0], branchId: b.branchId })}><Icon name="refresh" size={15} />{t("bookAgain")}</button>}
        </div>
      )}
    </article>
  );
}

/** New time for a visit: same barber, same services (what the server
 * allows). A refused time refreshes the list. */
export function Reschedule({ booking }: { booking: Booking }) {
  const t = useT();
  const { closeFlow, loadBookings, say, lang } = useApp();
  const [date, setDate] = useState(localDate(new Date(Math.max(Date.now(), new Date(booking.start).getTime()))));
  const [slot, setSlot] = useState<BarberSlot | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const slots = useSlots(date, booking.barberId ? [booking.barberId] : [], booking.serviceIds || [], booking.branchId || "", !!booking.homeVisit, refresh);
  const same = (s: BarberSlot) => s.start === booking.start;
  async function save() {
    if (!slot || busy) return;
    setBusy(true); setErr("");
    try {
      await api(`/api/customer/bookings/${encodeURIComponent(booking.id)}/reschedule`, { method: "PATCH", body: { start: slot.start } });
      haptic(); say(t("rescheduled")); closeFlow(); void loadBookings();
    } catch (e) {
      setErr(errText(e, t));
      if (e instanceof ApiError) { setSlot(null); setRefresh((r) => r + 1); }
    } finally { setBusy(false); }
  }
  return (
    <Sheet title={t("rescheduleTitle")} sub={`${t("now")}: ${whenLabel(booking.start, lang)}`} onClose={closeFlow}
      footer={<button className="btn gold wide" disabled={!slot || busy || (slot && same(slot))} onClick={save}>{busy ? <Spinner size={18} /> : slot ? `${t("confirmNewTime")} · ${timeLabel(slot.start, lang)}` : t("confirmNewTime")}</button>}>
      <p className="hint" style={{ marginBottom: 12 }}>{t("rescheduleSame")}</p>
      <TimePicker date={date} setDate={(d) => { setDate(d); setSlot(null); setErr(""); }} slots={slots} slot={slot} setSlot={(s) => { setSlot(s); setErr(""); }} err={err} />
    </Sheet>
  );
}

/** Rate a completed visit (once). */
export function Review({ booking }: { booking: Booking }) {
  const t = useT();
  const { closeFlow, loadBookings, say } = useApp();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function send() {
    if (!score || busy) return;
    setBusy(true); setErr("");
    try {
      await api(`/api/customer/bookings/${encodeURIComponent(booking.id)}/rate`, { body: { score, comment } });
      say(t("thanksRating")); closeFlow(); void loadBookings();
    } catch (e) { setErr(errText(e, t)); } finally { setBusy(false); }
  }
  return (
    <Sheet title={t("rateTitle")} onClose={closeFlow} tall={false} footer={<button className="btn gold wide" disabled={!score || busy} onClick={send}>{busy ? <Spinner size={18} /> : t("sendRating")}</button>}>
      <div className="review">
        <Avatar name={booking.barber?.name} url={booking.barber?.photoUrl} id={booking.barber?.id} size={76} />
        <b>{booking.barber?.name}</b>
        <Stars value={score} onChange={(v) => { haptic(); setScore(v); }} size={38} />
        <label className="label" style={{ width: "100%" }}>{t("rateComment")}<div className="field area"><textarea maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} /></div></label>
        {err && <p className="err">{err}</p>}
      </div>
    </Sheet>
  );
}

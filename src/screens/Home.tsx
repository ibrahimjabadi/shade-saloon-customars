import { useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { Avatar, Empty, Sheet } from "../components/ui";
import { api, media } from "../lib/api";
import { dayLabel, money, whenLabel } from "../lib/format";
import {
  AMENITIES,
  bookingState,
  branchBarbers,
  branchServices,
  clock12,
  DAY_KEYS,
  openNow,
  serviceName,
  weekHours,
} from "../lib/salon";
import type { Booking, Offer } from "../lib/types";
import { useApp, useT } from "../store/app";
import { ProfileSheet } from "./Explore";

type HTab = "services" | "team" | "photos" | "info";

// The branch's front door: greeting, the customer's next visit, offers,
// the branch itself (open now?, book, home visit, call, directions), then
// its services, team, photos and info.
export function Home() {
  const t = useT();
  const { settings, branches, branchId, services, barbers, account, bookings, loadBookings, open, lang } = useApp();
  const branch = branches.find((b) => b.id === branchId);
  const [tab, setTab] = useState<HTab>("services");
  const [pickBranch, setPickBranch] = useState(false);
  const [person, setPerson] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const theme = settings.customerPortalTheme || {};

  useEffect(() => {
    if (account && bookings === null) void loadBookings();
  }, [account, bookings, loadBookings]);
  useEffect(() => {
    if (account)
      api<Offer[]>("/api/customer/offers")
        .then(setOffers)
        .catch(() => {});
    else setOffers([]);
  }, [account]);

  const hours = useMemo(() => (branch ? weekHours(branch, settings) : {}), [branch, settings]);
  if (!branch) return <Empty icon="branch" title="—" />;
  const status = openNow(hours);
  const next = nextVisit(bookings);
  const staff = branchBarbers(barbers, branch.id);
  const list = branchServices(services, barbers, branch.id);
  const cover = branch.coverPhotoUrl || branch.galleryPhotos?.[0]?.url;
  const tabs = (
    [
      ["services", t("services"), theme.showServicesTab !== false],
      ["team", t("team"), theme.showStaffTab !== false],
      ["photos", t("photos"), theme.showPhotosTab !== false],
      ["info", t("info"), theme.showInfoTab !== false],
    ] as [HTab, string, boolean][]
  ).filter((x) => x[2]);
  const cur = tabs.some((x) => x[0] === tab) ? tab : tabs[0]?.[0];
  const cta = (lang === "ar" ? theme.ctaLabelAr : theme.ctaLabelEn) || t("bookNow");
  const multi = branches.length > 1 && settings.showCustomerBranches !== false;

  return (
    <>
      <div className="hello">
        <small>{dayLabel(new Date(), lang)}</small>
        <h1>{account ? `${t("hello")}، ${account.name.split(" ")[0]}` : t("guestHello")}</h1>
      </div>

      {next && <NextVisit b={next} />}

      {offers.length > 0 && (
        <div className="offers">
          {offers.map((o) => (
            <div key={o.id} className="offer">
              <Icon name="gift" size={20} />
              <div>
                <b>{o.name}</b>
                {o.message && <small>{o.message}</small>}
                {o.end && (
                  <em>
                    {t("validUntil")} {dayLabel(o.end, lang, { day: "numeric", month: "long" })}
                  </em>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <section
        className={`hero ${cover ? "has-photo" : ""}`}
        style={
          cover
            ? {
                backgroundImage: `linear-gradient(180deg,rgba(10,10,11,.15),rgba(10,10,11,.92)),url('${media(cover)}')`,
              }
            : undefined
        }
      >
        <div className="hero-top">
          <span className={`pill ${status.open ? "ok" : "mute"}`}>
            {status.open
              ? `${t("openNow")}${status.until ? ` · ${t("closesAt")} ${clock12(status.until, lang)}` : ""}`
              : `${t("closedNow")}${status.next ? ` · ${t("opensAt")} ${clock12(status.next, lang)}` : ""}`}
          </span>
          {multi && (
            <button className="pill gold nodot" onClick={() => setPickBranch(true)}>
              <Icon name="pin" size={13} />
              {t("changeBranch")}
            </button>
          )}
        </div>
        <h2>{branch.name}</h2>
        {(branch.address || branch.city) && <p>{[branch.address, branch.city].filter(Boolean).join(" · ")}</p>}
        <div className="hero-acts">
          <button className="btn gold" onClick={() => open({ kind: "book", mode: "salon" })}>
            <Icon name="calendar" size={18} />
            {cta}
          </button>
          {branch.phone && (
            <a className="btn ghost sq" href={`tel:${branch.phone}`} aria-label={t("call")}>
              <Icon name="phone" size={18} />
            </a>
          )}
          {branch.googleMapsUrl && (
            <a
              className="btn ghost sq"
              href={branch.googleMapsUrl}
              target="_blank"
              rel="noopener"
              aria-label={t("directions")}
            >
              <Icon name="nav" size={18} />
            </a>
          )}
        </div>
      </section>

      <button className="promo" onClick={() => open({ kind: "book", mode: "home" })}>
        <span className="pi">
          <Icon name="house" size={22} />
        </span>
        <span className="grow">
          <b>{t("homeVisitPitch")}</b>
          <small>{t("homeVisitPitchSub")}</small>
        </span>
        <Icon name="chevron" size={18} />
      </button>

      {tabs.length > 0 && (
        <div className="seg htabs">
          {tabs.map(([id, label]) => (
            <button key={id} className={cur === id ? "on" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {cur === "services" &&
        (list.length ? <Services list={list} /> : <Empty icon="scissors" title={t("noServices")} />)}
      {cur === "team" &&
        (staff.length ? (
          <div className="team-grid">
            {staff.map((b) => (
              <button key={b.id} className="tcard" onClick={() => setPerson(b.id)}>
                <Avatar name={b.name} url={b.photoUrl} id={b.id} size={72} />
                <b>{b.name}</b>
                <small>{b.title || ""}</small>
              </button>
            ))}
          </div>
        ) : (
          <Empty icon="team" title={t("noTeam")} />
        ))}
      {cur === "photos" &&
        (branch.galleryPhotos?.length ? (
          <div className="photo-grid">
            {branch.galleryPhotos.map((p, i) => (
              <button key={i} onClick={() => setPhoto(p.url)}>
                <img src={media(p.url)} alt={p.caption || ""} loading="lazy" />
              </button>
            ))}
          </div>
        ) : (
          <Empty icon="star" title={t("noPhotos")} />
        ))}
      {cur === "info" && (
        <div className="stack">
          {(lang === "ar" ? branch.descriptionAr || branch.description : branch.description) && (
            <div className="card">
              <b className="ctitle">{t("about")}</b>
              <p className="muted">{lang === "ar" ? branch.descriptionAr || branch.description : branch.description}</p>
            </div>
          )}
          <div className="card">
            <b className="ctitle">{t("hours")}</b>
            <div className="hours">
              {DAY_KEYS.map((k, i) => {
                const d = hours[k];
                return (
                  <div key={k} className={i === new Date().getDay() ? "today" : ""}>
                    <span>{dayLabel(`2026-11-0${i + 1}`, lang, { weekday: "long" })}</span>
                    <span className="num">
                      {!d || d.closed ? t("closed") : `${clock12(d.open, lang)} – ${clock12(d.close, lang)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {!!branch.amenities?.length && (
            <div className="card">
              <b className="ctitle">{t("amenities")}</b>
              <div className="amen">
                {branch.amenities
                  .filter((a) => AMENITIES[a])
                  .map((a) => (
                    <span key={a}>
                      <Icon name={AMENITIES[a][0]} size={16} />
                      {lang === "ar" ? AMENITIES[a][1] : AMENITIES[a][2]}
                    </span>
                  ))}
              </div>
            </div>
          )}
          {Object.values(theme.social || {}).some(Boolean) && (
            <div className="card">
              <b className="ctitle">{t("followUs")}</b>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {Object.entries(theme.social || {})
                  .filter(([, u]) => u)
                  .map(([k, u]) => (
                    <a key={k} className="btn ghost sm" href={u} target="_blank" rel="noopener">
                      <Icon name="link" size={15} />
                      {k[0].toUpperCase() + k.slice(1)}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {pickBranch && <BranchPicker onClose={() => setPickBranch(false)} />}
      {person && <ProfileSheet type="barber" id={person} onClose={() => setPerson(null)} />}
      {photo && (
        <div className="lightbox" onClick={() => setPhoto(null)}>
          <img src={media(photo)} alt="" />
        </div>
      )}
    </>
  );
}

function nextVisit(list: Booking[] | null) {
  const now = Date.now();
  return (list || [])
    .filter((b) => bookingState(b) === "upcoming" && new Date(b.start).getTime() > now)
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0];
}

function NextVisit({ b }: { b: Booking }) {
  const t = useT();
  const { settings, open, lang } = useApp();
  return (
    <div className="next">
      <small>{t("nextVisit")}</small>
      <b>{whenLabel(b.start, lang)}</b>
      <p>
        {(b.services || []).map((s) => serviceName(s, lang)).join(" · ")}
        {b.barber?.name ? ` · ${b.barber.name}` : ""}
      </p>
      {b.homeVisit ? (
        <p className="muted">
          <Icon name="house" size={13} /> {b.homeVisit.address}
        </p>
      ) : (
        b.branch?.name && <p className="muted">{b.branch.name}</p>
      )}
      {settings.allowCustomerReschedule !== false && (
        <button className="btn sm soft" onClick={() => open({ kind: "reschedule", booking: b })}>
          {t("reschedule")}
        </button>
      )}
    </div>
  );
}

function Services({ list }: { list: ReturnType<typeof branchServices> }) {
  const t = useT();
  const { settings, open, lang } = useApp();
  const groups = useMemo(() => {
    const m = new Map<string, typeof list>();
    list.forEach((s) => m.set(s.category || t("services"), [...(m.get(s.category || t("services")) || []), s]));
    return [...m.entries()];
  }, [list, t]);
  return (
    <>
      {groups.map(([cat, items]) => (
        <div key={cat} className="svc-group">
          <div className="sec-title">
            {cat}
            <small className="num">{items.length}</small>
          </div>
          <div className="group">
            {items.map((s) => (
              <div key={s.id} className="svc">
                <div className="grow">
                  <b>{serviceName(s, lang)}</b>
                  <small className="num">
                    {s.duration} {t("min")}
                  </small>
                </div>
                <b className="num price">{money(s.price, settings.currency, lang)}</b>
                <button className="btn sm soft" onClick={() => open({ kind: "book", mode: "salon", serviceId: s.id })}>
                  {t("bookThis")}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/** All branches: open now, address, switch. */
export function BranchPicker({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { branches, branchId, setBranch, settings, lang, say } = useApp();
  return (
    <Sheet title={t("branchesTitle")} onClose={onClose} tall={false}>
      <div className="stack">
        {branches.map((b) => {
          const st = openNow(weekHours(b, settings));
          return (
            <button
              key={b.id}
              className={`branch-row ${b.id === branchId ? "on" : ""}`}
              onClick={() => {
                setBranch(b.id);
                onClose();
                if (b.id !== branchId) say(b.name);
              }}
            >
              <span className="bi">
                <Icon name="branch" size={20} />
              </span>
              <span className="grow">
                <b>{b.name}</b>
                <small>{[b.address, b.city].filter(Boolean).join(" · ") || "—"}</small>
              </span>
              <span className={`pill ${st.open ? "ok" : "mute"}`}>
                {st.open ? t("openNow") : `${t("opensAt")} ${clock12(st.next, lang)}`}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

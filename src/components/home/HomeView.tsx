import { useAppStore, type HomeTab } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { serviceName } from "../../utils/booking";
import { formatMoney } from "../../utils/money";
import { OpenStatusBadge, HoursTable } from "./BusinessHours";
import { AmenitiesGrid } from "./amenities";
import { StaffLightbox } from "./StaffLightbox";
import { useEffect, useState } from "react";
import type { Barber, Booking, Service } from "../../api/types";
import { branchBarbers, branchServices } from "../../utils/branchCatalog";
import { resolveMediaUrl } from "../../utils/media";
import { avatarColorFor } from "../../utils/avatarColor";

function nextUpcomingBooking(bookings: Booking[] | null, now: number): Booking | null {
  if (!bookings) return null;
  const upcoming = bookings.filter((b) => {
    const status = b.status || (new Date(b.start).getTime() < now ? "completed" : "upcoming");
    return status === "upcoming" && new Date(b.start).getTime() > now;
  });
  upcoming.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return upcoming[0] || null;
}

function NextAppointmentCard({ booking }: { booking: Booking }) {
  const { tr, lang } = useTranslation();
  const cancelBooking = useAppStore((s) => s.cancelBooking);
  const openReschedule = useAppStore((s) => s.openReschedule);
  const svcNames = (booking.services || []).map((s) => s.nameAr || s.name).join("، ");
  const dateLabel = booking.startLabel || new Date(booking.start).toLocaleString(lang);
  return (
    <div className="card-accent" style={{ marginBottom: 14 }}>
      <div className="card-accent-decor-1" aria-hidden="true" />
      <div className="card-accent-decor-2" aria-hidden="true" />
      <div className="card-accent-label">{tr("nextAppointmentLabel")}</div>
      <div className="card-accent-title">{svcNames || tr("services")}</div>
      <div className="card-accent-meta">
        <span>{dateLabel}</span>
        {booking.barber?.name && <span>{booking.barber.name}</span>}
      </div>
      {booking.branch?.name && <div className="card-accent-sub">{booking.branch.name}</div>}
      <div className="card-accent-actions">
        <button className="btn secondary card-accent-edit" onClick={() => openReschedule(booking.id)}>
          {tr("rescheduleBooking")}
        </button>
        <button className="btn danger" style={{ width: "auto" }} onClick={() => void cancelBooking(booking.id)}>
          {tr("cancelBooking")}
        </button>
      </div>
    </div>
  );
}

function BranchSwitcher() {
  const branches = useAppStore((s) => s.branches);
  const branchId = useAppStore((s) => s.branchId);
  const switchBranch = useAppStore((s) => s.switchBranch);
  const showBranches = useAppStore((s) => s.settings?.showCustomerBranches !== false);
  if (branches.length <= 1 || !showBranches) return null;
  return (
    <div className="branch-switcher">
      {branches.map((br) => (
        <button
          key={br.id}
          className={`branch-switch-chip ${br.id === branchId ? "active" : ""}`}
          onClick={() => switchBranch(br.id)}
        >
          {br.name}
        </button>
      ))}
    </div>
  );
}

function ServicesPanel({ services }: { services: Service[] }) {
  const { tr, lang } = useTranslation();
  const currency = useAppStore((s) => s.settings?.currency);
  const selectedIds = useAppStore((s) => s.booking?.selectedServices || []);
  const openBooking = useAppStore((s) => s.openBooking);

  if (!services.length) return <p className="muted">{tr("noServices")}</p>;

  const byCategory = new Map<string, Service[]>();
  services.forEach((s) => {
    const cat = s.category || tr("services");
    byCategory.set(cat, [...(byCategory.get(cat) || []), s]);
  });

  return (
    <>
      {Array.from(byCategory.entries()).map(([cat, list]) => (
        <div className="service-category" key={cat}>
          <h3>{cat}</h3>
          <div className="grid">
            {list.map((s) => {
              const selected = selectedIds.includes(s.id);
              return (
                <div className="service-row" key={s.id}>
                  <div>
                    <strong>{serviceName(s, lang)}</strong>
                    <div className="meta">
                      {s.duration} {tr("min")} · {formatMoney(s.price, currency, lang)}
                    </div>
                  </div>
                  <button className={`service-book-btn ${selected ? "added" : ""}`} onClick={() => openBooking(s.id)}>
                    {selected ? `✓ ${tr("added")}` : tr("book")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function PhotosPanel({ photos }: { photos: { url: string; caption?: string }[] | undefined }) {
  const { tr } = useTranslation();
  if (!photos?.length) return <p className="muted">{tr("noPhotos")}</p>;
  return (
    <div className="gallery-grid">
      {photos.map((p, i) => (
        <div className="gallery-item" key={i}>
          <img src={resolveMediaUrl(p.url)} alt={p.caption || ""} loading="lazy" />
        </div>
      ))}
    </div>
  );
}

function StaffPanel({ staff, onOpen }: { staff: Barber[]; onOpen: (id: string) => void }) {
  const { tr } = useTranslation();
  if (!staff.length) return <p className="muted">{tr("noStaff")}</p>;
  return (
    <div className="staff-grid">
      {staff.map((s) => (
        <div className="staff-card" key={s.id} onClick={() => onOpen(s.id)}>
          <div
            className="staff-photo"
            style={
              s.photoUrl
                ? { backgroundImage: `url('${resolveMediaUrl(s.photoUrl)}')` }
                : { backgroundColor: avatarColorFor(s.id), color: "#fff" }
            }
          >
            {s.photoUrl ? "" : (s.name || "?").trim()[0] || "?"}
          </div>
          <strong>{s.name}</strong>
          <span className="muted">{s.title || ""}</span>
        </div>
      ))}
    </div>
  );
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  tiktok: "TikTok",
};

function SocialLinks({ social }: { social?: import("../../api/types").CustomerPortalTheme["social"] }) {
  const { tr } = useTranslation();
  const entries = Object.entries(social || {}).filter(([, url]) => url);
  if (!entries.length) return null;
  return (
    <>
      <h3>{tr("followUs")}</h3>
      <div className="contact-actions">
        {entries.map(([key, url]) => (
          <a key={key} className="btn secondary" href={url} target="_blank" rel="noopener">
            {SOCIAL_LABELS[key] || key}
          </a>
        ))}
      </div>
    </>
  );
}

function InfoPanel({
  description,
  hasHours,
  hasAmenities,
  hours,
  timezone,
  amenities,
  phone,
  mapsUrl,
  social,
}: {
  description?: string;
  hasHours: boolean;
  hasAmenities: boolean;
  hours?: import("../../api/types").BusinessHours;
  timezone?: string;
  amenities?: string[];
  phone?: string;
  mapsUrl?: string;
  social?: import("../../api/types").CustomerPortalTheme["social"];
}) {
  const { tr, lang } = useTranslation();
  const hasSocial = Object.values(social || {}).some(Boolean);
  const nothing = !description && !hasHours && !hasAmenities && !phone && !mapsUrl && !hasSocial;
  return (
    <>
      {description && (
        <>
          <h3>{tr("about")}</h3>
          <p className="muted">{description}</p>
        </>
      )}
      {hasHours && (
        <>
          <h3>{tr("workingHours")}</h3>
          <HoursTable hours={hours} timezone={timezone} />
        </>
      )}
      {hasAmenities && (
        <>
          <h3>{tr("amenities")}</h3>
          <AmenitiesGrid list={amenities} lang={lang} />
        </>
      )}
      <div className="contact-actions">
        {phone && (
          <a className="btn secondary" href={`tel:${phone}`}>
            {tr("callUs")}
          </a>
        )}
        {mapsUrl && (
          <a className="btn secondary" href={mapsUrl} target="_blank" rel="noopener">
            {tr("getDirections")}
          </a>
        )}
      </div>
      <SocialLinks social={social} />
      {nothing && <p className="muted">{tr("noPhotos")}</p>}
    </>
  );
}

export function HomeView() {
  const { tr, lang } = useTranslation();
  const branches = useAppStore((s) => s.branches);
  const branchId = useAppStore((s) => s.branchId);
  const services = useAppStore((s) => s.services);
  const barbers = useAppStore((s) => s.barbers);
  const homeTab = useAppStore((s) => s.homeTab);
  const setHomeTab = useAppStore((s) => s.setHomeTab);
  const openBooking = useAppStore((s) => s.openBooking);
  const openHomeVisit = useAppStore((s) => s.openHomeVisit);
  const portalTheme = useAppStore((s) => s.settings?.customerPortalTheme);
  const account = useAppStore((s) => s.account);
  const myBookings = useAppStore((s) => s.myBookings);
  const loadMyBookings = useAppStore((s) => s.loadMyBookings);
  const [staffLightboxId, setStaffLightboxId] = useState<string | null>(null);

  // My Bookings is no longer its own bottom tab, so Home is now the place
  // that needs the list loaded (for the Next Appointment card below) —
  // mirrors the same "only if not already loaded" guard BookingsView used.
  useEffect(() => {
    if (account && myBookings === null) void loadMyBookings();
  }, [account, myBookings, loadMyBookings]);

  const branch = branches.find((b) => b.id === branchId);
  if (!branch) return <div className="empty-state">{tr("notFound")}</div>;

  const upcoming = account ? nextUpcomingBooking(myBookings, Date.now()) : null;

  const desc = lang === "ar" ? branch.descriptionAr || branch.description : branch.description;
  const hasHours = !!branch.businessHours && typeof branch.businessHours === "object";
  const hasAmenities = Array.isArray(branch.amenities) && branch.amenities.length > 0;
  const staff = branchBarbers(barbers, branch.id);
  const servicesForBranch = branchServices(services, barbers, branch.id);

  // Section visibility is admin-configurable (Settings > Customer portal);
  // undefined/missing means "on" (a fresh install with no config touched
  // shows everything, same as before this feature existed).
  const allTabs: { id: HomeTab; label: string; show: boolean }[] = [
    { id: "services" as HomeTab, label: tr("services"), show: portalTheme?.showServicesTab !== false },
    { id: "photos" as HomeTab, label: tr("photos"), show: portalTheme?.showPhotosTab !== false },
    { id: "staff" as HomeTab, label: tr("staff"), show: portalTheme?.showStaffTab !== false },
    { id: "info" as HomeTab, label: tr("info"), show: portalTheme?.showInfoTab !== false },
  ];
  const tabs = allTabs.filter((t) => t.show);
  const activeTab = tabs.some((t) => t.id === homeTab) ? homeTab : tabs[0]?.id;
  const bookNowLabel = (lang === "ar" ? portalTheme?.ctaLabelAr : portalTheme?.ctaLabelEn) || tr("bookNow");

  return (
    <>
      {account?.name && (
        <div className="home-greeting">
          <div className="section-label">{tr("greeting")}</div>
          <h1>{account.name}</h1>
        </div>
      )}
      {upcoming && <NextAppointmentCard booking={upcoming} />}
      <BranchSwitcher />
      <div
        className={`home-hero${branch.galleryPhotos?.[0] ? " has-photo" : ""}`}
        style={
          branch.galleryPhotos?.[0]
            ? {
                backgroundImage: `linear-gradient(180deg,rgba(10,10,11,.35),rgba(10,10,11,.96)),url('${resolveMediaUrl(branch.galleryPhotos[0].url)}')`,
              }
            : undefined
        }
      >
        <h1>{branch.name}</h1>
        <p>{branch.address || branch.city || ""}</p>
        {hasHours && <OpenStatusBadge hours={branch.businessHours} timezone={branch.timezone} />}
        <div className="home-hero-actions">
          <button className="btn gold" onClick={() => openBooking()}>
            {bookNowLabel}
          </button>
          <button className="btn secondary" onClick={openHomeVisit}>
            {tr("homeVisitTab")}
          </button>
          {branch.phone && (
            <a className="btn secondary" href={`tel:${branch.phone}`}>
              {tr("callUs")}
            </a>
          )}
        </div>
      </div>

      <div className="home-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`home-tab ${t.id === activeTab ? "active" : ""}`}
            onClick={() => setHomeTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "services" && <ServicesPanel services={servicesForBranch} />}
        {activeTab === "photos" && <PhotosPanel photos={branch.galleryPhotos} />}
        {activeTab === "staff" && <StaffPanel staff={staff} onOpen={setStaffLightboxId} />}
        {activeTab === "info" && (
          <InfoPanel
            description={desc}
            hasHours={hasHours}
            hasAmenities={hasAmenities}
            hours={branch.businessHours}
            timezone={branch.timezone}
            amenities={branch.amenities}
            phone={branch.phone}
            mapsUrl={branch.googleMapsUrl}
            social={portalTheme?.social}
          />
        )}
      </div>

      {staffLightboxId && (
        <StaffLightbox
          staff={staff.find((s) => s.id === staffLightboxId) || null}
          onClose={() => setStaffLightboxId(null)}
        />
      )}
    </>
  );
}

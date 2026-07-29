import { useAppStore, type HomeTab } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { serviceName } from "../../utils/booking";
import { formatMoney } from "../../utils/money";
import { OpenStatusBadge, HoursTable } from "./BusinessHours";
import { AmenitiesGrid } from "./amenities";
import { StaffLightbox } from "./StaffLightbox";
import { useState } from "react";
import type { Service, StaffMember } from "../../api/types";

function BranchSwitcher() {
  const branches = useAppStore((s) => s.branches);
  const branchId = useAppStore((s) => s.branchId);
  const switchBranch = useAppStore((s) => s.switchBranch);
  if (branches.length <= 1) return null;
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
          <img src={p.url} alt={p.caption || ""} loading="lazy" />
        </div>
      ))}
    </div>
  );
}

function StaffPanel({ staff, onOpen }: { staff: StaffMember[] | undefined; onOpen: (id: string) => void }) {
  const { tr } = useTranslation();
  if (!staff?.length) return <p className="muted">{tr("noStaff")}</p>;
  return (
    <div className="staff-grid">
      {staff.map((s) => (
        <div className="staff-card" key={s.id} onClick={() => onOpen(s.id)}>
          <div
            className="staff-photo"
            style={s.photoUrl ? { backgroundImage: `url('${s.photoUrl}')` } : undefined}
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

function InfoPanel({
  description,
  hasHours,
  hasAmenities,
  hours,
  timezone,
  amenities,
  phone,
  mapsUrl,
}: {
  description?: string;
  hasHours: boolean;
  hasAmenities: boolean;
  hours?: import("../../api/types").BusinessHours;
  timezone?: string;
  amenities?: string[];
  phone?: string;
  mapsUrl?: string;
}) {
  const { tr, lang } = useTranslation();
  const nothing = !description && !hasHours && !hasAmenities && !phone && !mapsUrl;
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
      {nothing && <p className="muted">{tr("noPhotos")}</p>}
    </>
  );
}

export function HomeView() {
  const { tr, lang } = useTranslation();
  const branches = useAppStore((s) => s.branches);
  const branchId = useAppStore((s) => s.branchId);
  const services = useAppStore((s) => s.services);
  const homeTab = useAppStore((s) => s.homeTab);
  const setHomeTab = useAppStore((s) => s.setHomeTab);
  const openBooking = useAppStore((s) => s.openBooking);
  const [staffLightboxId, setStaffLightboxId] = useState<string | null>(null);

  const branch = branches.find((b) => b.id === branchId);
  if (!branch) return <div className="empty-state">{tr("notFound")}</div>;

  const desc = lang === "ar" ? branch.descriptionAr || branch.description : branch.description;
  const hasHours = !!branch.businessHours && typeof branch.businessHours === "object";
  const hasAmenities = Array.isArray(branch.amenities) && branch.amenities.length > 0;
  const branchServices = branch.services || services.filter((s) => !s.branchId || s.branchId === branch.id);

  const tabs: { id: HomeTab; label: string }[] = [
    { id: "services", label: tr("services") },
    { id: "photos", label: tr("photos") },
    { id: "staff", label: tr("staff") },
    { id: "info", label: tr("info") },
  ];

  return (
    <>
      <BranchSwitcher />
      <div
        className={`home-hero${branch.galleryPhotos?.[0] ? " has-photo" : ""}`}
        style={
          branch.galleryPhotos?.[0]
            ? {
                backgroundImage: `linear-gradient(180deg,rgba(10,10,11,.35),rgba(10,10,11,.96)),url('${branch.galleryPhotos[0].url}')`,
              }
            : undefined
        }
      >
        <h1>{branch.name}</h1>
        <p>{branch.address || branch.city || ""}</p>
        {hasHours && <OpenStatusBadge hours={branch.businessHours} timezone={branch.timezone} />}
        <div className="home-hero-actions">
          <button className="btn gold" onClick={() => openBooking()}>
            {tr("bookNow")}
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
            className={`home-tab ${t.id === homeTab ? "active" : ""}`}
            onClick={() => setHomeTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {homeTab === "services" && <ServicesPanel services={branchServices} />}
        {homeTab === "photos" && <PhotosPanel photos={branch.galleryPhotos} />}
        {homeTab === "staff" && <StaffPanel staff={branch.staff} onOpen={setStaffLightboxId} />}
        {homeTab === "info" && (
          <InfoPanel
            description={desc}
            hasHours={hasHours}
            hasAmenities={hasAmenities}
            hours={branch.businessHours}
            timezone={branch.timezone}
            amenities={branch.amenities}
            phone={branch.phone}
            mapsUrl={branch.googleMapsUrl}
          />
        )}
      </div>

      {staffLightboxId && (
        <StaffLightbox
          staff={(branch.staff || []).find((s) => s.id === staffLightboxId) || null}
          onClose={() => setStaffLightboxId(null)}
        />
      )}
    </>
  );
}

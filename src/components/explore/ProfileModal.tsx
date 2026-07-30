import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { favoriteKey, type ProfileType } from "../../utils/explorePosts";
import type { GalleryPhoto } from "../../api/types";
import { resolveMediaUrl } from "../../utils/media";

function useOwner(type: ProfileType, id: string) {
  const branches = useAppStore((s) => s.branches);
  const barbers = useAppStore((s) => s.barbers);
  if (type === "branch") {
    const branch = branches.find((b) => b.id === id);
    if (!branch) return null;
    return {
      name: branch.name,
      avatarUrl: resolveMediaUrl(branch.galleryPhotos?.[0]?.url),
      bio: branch.descriptionAr || branch.description,
      photos: branch.galleryPhotos || [],
      branchId: branch.id,
    };
  }
  const barber = barbers.find((b) => b.id === id);
  if (!barber) return null;
  return {
    name: barber.name,
    avatarUrl: resolveMediaUrl(barber.photoUrl),
    bio: barber.title,
    photos: barber.portfolioPhotos || [],
    branchId: barber.branchId,
  };
}

export function ProfileModal({ type, id, onClose }: { type: ProfileType; id: string; onClose: () => void }) {
  const { tr, lang } = useTranslation();
  const owner = useOwner(type, id);
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const switchBranch = useAppStore((s) => s.switchBranch);
  const openBooking = useAppStore((s) => s.openBooking);
  const setTab = useAppStore((s) => s.setTab);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  if (!owner) return null;
  const key = favoriteKey(type, id);
  const isFavorite = favorites.includes(key);

  function handleBook() {
    if (!owner) return;
    switchBranch(owner.branchId);
    setTab("home");
    openBooking(undefined, type === "barber" ? id : undefined);
    onClose();
  }

  return createPortal(
    <div
      className="year-modal"
      role="dialog"
      aria-modal="true"
      aria-label={owner.name}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="year-panel" style={{ width: "min(520px,96vw)" }}>
        <div className="year-top">
          <h2 style={{ fontSize: 16 }}>{owner.name}</h2>
          <button ref={closeBtnRef} aria-label={lang === "ar" ? "إغلاق" : "Close"} onClick={onClose}>
            ×
          </button>
        </div>

        <div className="profile-header">
          <div className="profile-avatar" style={owner.avatarUrl ? { backgroundImage: `url('${owner.avatarUrl}')` } : undefined}>
            {owner.avatarUrl ? "" : owner.name.trim()[0] || "?"}
          </div>
          <strong style={{ fontSize: 17 }}>{owner.name}</strong>
          <span className="profile-type-chip">{type === "branch" ? tr("branchLabel") : tr("barberLabel")}</span>
          {owner.bio && <p className="muted" style={{ margin: "4px 0 0", maxWidth: 340 }}>{owner.bio}</p>}
          <span className="muted" style={{ fontSize: 12.5 }}>
            {owner.photos.length} {tr("postsCount")}
          </span>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className={`favorite-btn ${isFavorite ? "active" : ""}`} onClick={() => toggleFavorite(key)}>
              {isFavorite ? `★ ${tr("following")}` : `☆ ${tr("follow")}`}
            </button>
            <button className="btn gold" style={{ width: "auto" }} onClick={handleBook}>
              {tr("bookWithThem")}
            </button>
          </div>
        </div>

        {owner.photos.length ? (
          <div className="explore-grid">
            {owner.photos.map((p: GalleryPhoto, i: number) => (
              <div className="explore-tile" key={i} style={{ cursor: "default" }}>
                <img src={resolveMediaUrl(p.url)} alt={p.caption || ""} loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ textAlign: "center" }}>{tr("noPhotos")}</p>
        )}
      </div>
    </div>,
    document.body
  );
}

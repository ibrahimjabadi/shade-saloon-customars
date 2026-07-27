import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { StaffMember } from "../../api/types";
import { useTranslation } from "../../hooks/useTranslation";

export function StaffLightbox({ staff, onClose }: { staff: StaffMember | null; onClose: () => void }) {
  const { tr, lang } = useTranslation();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  if (!staff) return null;
  const photos = staff.portfolioPhotos || [];

  return createPortal(
    <div
      className="year-modal"
      role="dialog"
      aria-modal="true"
      aria-label={staff.name || ""}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="year-panel">
        <div className="year-top">
          <h2>{staff.name}</h2>
          <button ref={closeBtnRef} aria-label={lang === "ar" ? "إغلاق" : "Close"} onClick={onClose}>
            ×
          </button>
        </div>
        {photos.length ? (
          <div className="gallery-grid">
            {photos.map((p, i) => (
              <div className="gallery-item" key={i}>
                <img src={p.url} alt="" />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">{tr("noPhotos")}</p>
        )}
      </div>
    </div>,
    document.body
  );
}

import { useEffect, useRef } from "react";
import { useAppStore } from "../../store/appStore";
import { useTranslation } from "../../hooks/useTranslation";
import { avatarColorFor } from "../../utils/avatarColor";
import { resolveMediaUrl } from "../../utils/media";
import { displayError } from "../../utils/errorDisplay";
import type { TranslationKey } from "../../i18n/translations";

const SCORE_LABEL_KEYS: TranslationKey[] = [
  "reviewScore1",
  "reviewScore2",
  "reviewScore3",
  "reviewScore4",
  "reviewScore5",
];

/** Customer satisfaction rating (POST /api/customer/bookings/:id/rate) — the
 * backend has had this endpoint (and the booking's `rated` flag) ready for a
 * while; nothing on the frontend called it until now. Same overlay shell as
 * RescheduleOverlay (`.booking-overlay`/-head/-body/-footer), registered the
 * same way in App.tsx and useGlobalOverlayEffects.ts. */
export function ReviewOverlay() {
  const { tr, lang } = useTranslation();
  const review = useAppStore((s) => s.review);
  const closeReview = useAppStore((s) => s.closeReview);
  const setReviewScore = useAppStore((s) => s.setReviewScore);
  const setReviewComment = useAppStore((s) => s.setReviewComment);
  const submitReview = useAppStore((s) => s.submitReview);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Same "focus once, on first mount" pattern as RescheduleOverlay — picking
  // a star or typing a comment afterward must not yank focus back here.
  useEffect(() => {
    closeBtnRef.current?.focus({ preventScroll: true });
  }, []);

  if (!review) return null;

  const closeLabel = lang === "ar" ? "إغلاق" : "Close";

  if (review.success) {
    return (
      <div className="booking-overlay" role="dialog" aria-modal="true" aria-label={tr("reviewSuccessTitle")}>
        <div className="booking-head">
          <h2>{tr("reviewTitle")}</h2>
          <button ref={closeBtnRef} className="booking-close" aria-label={closeLabel} onClick={closeReview}>
            ×
          </button>
        </div>
        <div className="booking-body">
          <div className="success-card">
            <div className="review-success-icon">⭐</div>
            <h3 style={{ margin: 0 }}>{tr("reviewSuccessTitle")}</h3>
            <p className="muted">{tr("reviewSuccessBody")}</p>
            <button className="btn gold" onClick={closeReview}>
              {tr("reviewBackToBookings")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-overlay" role="dialog" aria-modal="true" aria-label={tr("reviewTitle")}>
      <div className="booking-head">
        <h2>{tr("reviewTitle")}</h2>
        <button ref={closeBtnRef} className="booking-close" aria-label={closeLabel} onClick={closeReview}>
          ×
        </button>
      </div>
      <div className="booking-body">
        <div className="success-card">
          <span
            className="review-avatar"
            style={
              review.barberPhotoUrl
                ? { backgroundImage: `url('${resolveMediaUrl(review.barberPhotoUrl)}')` }
                : { backgroundColor: avatarColorFor(review.barberId || review.bookingId), color: "#fff" }
            }
          >
            {review.barberPhotoUrl ? "" : (review.barberName || "?").trim()[0] || "?"}
          </span>
          <h3 style={{ margin: 0 }}>{tr("reviewTitle")}</h3>
          {review.barberName && (
            <p className="muted" style={{ margin: 0 }}>
              {tr("reviewSubtitlePrefix")} {review.barberName}
            </p>
          )}
        </div>

        <div className="review-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`review-star ${review.score >= n ? "filled" : ""}`}
              aria-label={String(n)}
              onClick={() => setReviewScore(n)}
            >
              ★
            </button>
          ))}
        </div>
        {review.score > 0 && <p className="review-score-label">{tr(SCORE_LABEL_KEYS[review.score - 1])}</p>}

        <textarea
          className="review-comment"
          placeholder={tr("reviewCommentPlaceholder")}
          value={review.comment}
          onChange={(e) => setReviewComment(e.target.value)}
        />
        {review.error && (
          <div className="muted" style={{ marginTop: 10 }}>
            {displayError(review.error, tr)}
          </div>
        )}
      </div>
      <div className="booking-footer">
        <div />
        <button
          className="btn gold"
          style={{ width: "auto" }}
          disabled={review.score < 1 || review.submitting}
          onClick={() => void submitReview()}
        >
          {review.submitting ? tr("loading") : tr("reviewSubmit")}
        </button>
      </div>
    </div>
  );
}

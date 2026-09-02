import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { IconStar } from "../shell/icons";

/** Shown under the success screen only when the branch this booking was
 * made at actually has a Google Maps link on file (googleMapsUrl) --
 * BookingOverlay/SuccessScreen never render this at all otherwise, so
 * there's no dead "rate us" card pointing nowhere. All 5 stars do the same
 * thing (this isn't a real 1-5 rating widget, just a tap-to-leave-a-review
 * nudge like Fresha's own App Store prompt) -- tapping any of them opens
 * the branch's real Google review link in a new tab. */
export function GoogleReviewPrompt({ googleMapsUrl }: { googleMapsUrl: string }) {
  const { tr } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function rate() {
    window.open(googleMapsUrl, "_blank", "noopener");
    setDismissed(true);
  }

  return (
    <div className="card google-review-card">
      <div className="muted">{tr("rateOnGoogle")}</div>
      <div className="google-review-stars">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} className="google-review-star" onClick={rate} aria-label={tr("tapStarToRate")}>
            <IconStar />
          </button>
        ))}
      </div>
      <button className="btn ghost" onClick={() => setDismissed(true)}>
        {tr("notNow")}
      </button>
    </div>
  );
}

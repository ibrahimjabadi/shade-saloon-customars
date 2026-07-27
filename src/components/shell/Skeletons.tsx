import { useTranslation } from "../../hooks/useTranslation";

export function SkeletonHome() {
  const { tr } = useTranslation();
  return (
    <>
      <div role="status" aria-live="polite">
        <span className="sr-only">{tr("loading")}</span>
      </div>
      <div aria-hidden="true">
        <div className="skel-hero skel" />
        <div className="skel-tabs">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skel" key={i} />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="skel-row" key={i}>
            <div style={{ flex: 1 }}>
              <div className="skel skel-line w-60" />
              <div className="skel skel-line w-40" />
            </div>
            <div className="skel skel-btn" />
          </div>
        ))}
      </div>
    </>
  );
}

export function SkeletonBookingCards({ count }: { count: number }) {
  const { tr } = useTranslation();
  return (
    <>
      <div role="status" aria-live="polite">
        <span className="sr-only">{tr("loading")}</span>
      </div>
      <div aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <div className="skel-card" key={i}>
            <div className="skel skel-line" style={{ width: "40%" }} />
            <div className="skel skel-line" style={{ width: "70%" }} />
            <div className="skel skel-line" style={{ width: "50%" }} />
          </div>
        ))}
      </div>
    </>
  );
}

export function SkeletonSlotGrid({ count }: { count: number }) {
  const { tr } = useTranslation();
  return (
    <>
      <div role="status" aria-live="polite">
        <span className="sr-only">{tr("loadingSlots")}</span>
      </div>
      <div className="skel-slot-grid" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <div className="skel" key={i} />
        ))}
      </div>
    </>
  );
}

/** Circular step indicator (spec section 9) — replaces the old thin-dot
 * progress bar. Reads the same `stepsList`/`step` values BookingOverlay
 * already computes; purely presentational, no new state. */
export function StepIndicator({ steps, current, labels }: { steps: number[]; current: number; labels: string[] }) {
  const pos = steps.indexOf(current);
  return (
    <div className="step-indicator">
      <div className="step-indicator-row">
        {steps.map((_, i) => (
          <div className="step-indicator-item" key={i} style={{ display: "contents" }}>
            <div className={`step-circle ${i < pos ? "done" : i === pos ? "active" : ""}`}>{i < pos ? "✓" : i + 1}</div>
            {i < steps.length - 1 && <div className={`step-connector ${i < pos ? "done" : ""}`} />}
          </div>
        ))}
      </div>
      <div className="step-indicator-labels">
        {labels.map((label, i) => (
          <span className={`step-label ${i === pos ? "active" : ""}`} key={i}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

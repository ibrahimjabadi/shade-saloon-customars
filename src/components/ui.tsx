import { useEffect, useRef, type ReactNode } from "react";
import { media } from "../lib/api";
import { initial } from "../lib/format";
import { useApp, useT } from "../store/app";
import { Icon } from "./Icon";

/** A full-screen flow on a phone (slides up), a centred window on a
 * computer. Esc / the back gesture's close button call onClose. */
export function Sheet({ title, sub, onClose, children, footer, head, tall = true }: {
  title: ReactNode; sub?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; head?: ReactNode; tall?: boolean;
}) {
  const t = useT();
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.classList.add("locked");
    return () => { window.removeEventListener("keydown", k); document.body.classList.remove("locked"); };
  }, [onClose]);
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true">
      <div className="scrim" onClick={onClose} />
      <section className={`sheet ${tall ? "tall" : ""}`}>
        <div className="grab" aria-hidden="true" />
        <header className="sh">
          <div className="grow" style={{ minWidth: 0 }}><h2>{title}</h2>{sub && <small>{sub}</small>}</div>
          <button className="icon-btn" aria-label={t("close")} onClick={onClose}><Icon name="x" size={18} /></button>
        </header>
        {head}
        <div className="sb" ref={body}>{children}</div>
        {footer && <footer className="sf">{footer}</footer>}
      </section>
    </div>
  );
}

export function Empty({ icon = "calendar", title, text, children }: { icon?: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ei"><Icon name={icon} size={26} /></div>
      <b>{title}</b>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Spinner({ size = 22 }: { size?: number }) {
  return <span className="spin" style={{ width: size, height: size }} />;
}
export function Loading() {
  return <div className="loading"><Spinner /></div>;
}

export function Avatar({ name, url, size = 44, id }: { name?: string; url?: string; size?: number; id?: string }) {
  const hue = [...(id || name || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4, ...(url ? {} : { background: `hsl(${hue} 22% 22%)` }) }}>
      {url ? <img src={media(url)} alt="" loading="lazy" /> : initial(name)}
    </span>
  );
}

export function Stars({ value, onChange, size = 30 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="stars" role={onChange ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} className={n <= value ? "on" : ""} aria-label={`${n}`} onClick={() => onChange?.(n)} style={{ fontSize: size }}>★</button>
      ))}
    </div>
  );
}

/** Small toast at the bottom (store.say). */
export function Toast() {
  const toast = useApp((s) => s.toast);
  return <div className={`toast ${toast ? "on" : ""} ${toast?.bad ? "bad" : ""}`} role="status">{toast && <><Icon name={toast.bad ? "x" : "check"} size={16} />{toast.msg}</>}</div>;
}

/** The 6-box sign-in / verification code input. */
export function CodeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <label className="code" onClick={() => ref.current?.focus()}>
      <input ref={ref} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))} aria-label="code" />
      {Array.from({ length: 6 }, (_, i) => <span key={i} className={`num ${i === value.length ? "cur" : ""}`}>{value[i] || ""}</span>)}
    </label>
  );
}

/** Step dots for the booking flows. */
export function Steps({ labels, at }: { labels: string[]; at: number }) {
  return (
    <div className="steps" aria-label={labels[at]}>
      {labels.map((l, i) => <span key={i} className={i < at ? "done" : i === at ? "on" : ""} title={l} />)}
    </div>
  );
}

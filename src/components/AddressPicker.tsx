import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { useApp, useT } from "../store/app";
import { Icon } from "./Icon";
import { Spinner } from "./ui";

export interface Picked { lat: number; lng: number; address: string | null }

const CENTER: [number, number] = [31.9539, 35.9106]; // Amman
const pin = L.divIcon({
  className: "map-pin",
  html: `<svg viewBox="0 0 24 24" width="38" height="38"><path d="M12 22s7.5-7.8 7.5-13.2A7.5 7.5 0 1 0 4.5 8.8C4.5 14.2 12 22 12 22Z" fill="#C9A961" stroke="#16130C" stroke-width="1"/><circle cx="12" cy="9" r="2.8" fill="#16130C"/></svg>`,
  iconSize: [38, 38], iconAnchor: [19, 36],
});

async function addressOf(lat: number, lng: number, lang: string) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${lang}`);
    const d = await r.json();
    return typeof d?.display_name === "string" ? d.display_name : null;
  } catch { return null; }
}

/** Pick where the barber should come: "use my location", tap the map, or
 * drag the pin. Reports coordinates at once and the written address when
 * it arrives. */
export function AddressPicker({ value, onChange }: { value: Picked | null; onChange: (p: Picked) => void }) {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState("");
  const latest = useRef(onChange);
  latest.current = onChange;

  async function place(lat: number, lng: number, center: boolean) {
    if (!map.current) return;
    if (!marker.current) {
      marker.current = L.marker([lat, lng], { icon: pin, draggable: true }).addTo(map.current);
      marker.current.on("dragend", () => { const p = marker.current!.getLatLng(); void place(p.lat, p.lng, false); });
    } else marker.current.setLatLng([lat, lng]);
    if (center) map.current.setView([lat, lng], 16);
    latest.current({ lat, lng, address: null });
    latest.current({ lat, lng, address: await addressOf(lat, lng, lang) });
  }

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(value ? [value.lat, value.lng] : CENTER, value ? 16 : 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => void place(e.latlng.lat, e.latlng.lng, false));
    map.current = m;
    if (value) void place(value.lat, value.lng, false);
    setTimeout(() => m.invalidateSize(), 250); // the sheet was still sliding in
    return () => { m.remove(); map.current = null; marker.current = null; };
    // once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function mine() {
    if (!("geolocation" in navigator)) return setErr(t("locError"));
    setLocating(true); setErr("");
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocating(false); void place(p.coords.latitude, p.coords.longitude, true); },
      () => { setLocating(false); setErr(t("locError")); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="stack">
      <button type="button" className="btn soft wide" onClick={mine} disabled={locating}>{locating ? <><Spinner size={16} />{t("locating")}</> : <><Icon name="nav" size={17} />{t("useMyLocation")}</>}</button>
      <div ref={el} className="map" />
      <p className="hint">{t("mapHint")}</p>
      {err && <p className="err">{err}</p>}
      {value && <div className="addr"><Icon name="pin" size={18} /><span>{value.address || t("resolving")}</span></div>}
    </div>
  );
}

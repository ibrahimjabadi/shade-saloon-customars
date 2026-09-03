import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "../../hooks/useTranslation";

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string | null;
}

// Amman, Jordan — reasonable default center before the customer picks a
// real point or grants geolocation. This app's phone validation is already
// Jordan-specific (see utils/validators.ts), so this matches the market.
const DEFAULT_CENTER: [number, number] = [31.9539, 35.9106];

// Leaflet's default marker images resolve to relative paths that break once
// bundled by Vite. A DivIcon sidesteps that entirely and lets the pin match
// the app's own accent color instead of Leaflet's default blue teardrop.
const pinIcon = L.divIcon({
  className: "address-pin",
  html: `<svg viewBox="0 0 24 24" width="34" height="34" fill="var(--accent)" stroke="#fff" stroke-width="1"><path d="M12 22s7.5-7.8 7.5-13.2A7.5 7.5 0 1 0 4.5 8.8C4.5 14.2 12 22 12 22Z"/><circle cx="12" cy="8.6" r="2.8" fill="#fff"/></svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

/** Reverse geocoding via OSM Nominatim — free, no API key, fine for this
 * app's traffic level. A production deployment with heavy volume should
 * move to a paid provider or a self-hosted Nominatim instance instead, per
 * Nominatim's usage policy (this call is best-effort and non-blocking: the
 * lat/lng is always the real source of truth sent to the backend, this text
 * is only a human-readable confirmation shown to the customer). */
async function reverseGeocode(lat: number, lng: number, lang: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${lang}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.display_name === "string" ? data.display_name : null;
  } catch {
    return null;
  }
}

export function AddressPicker({
  value,
  onChange,
}: {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
}) {
  const { tr, lang } = useTranslation();
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  async function placeMarker(lat: number, lng: number, recenter: boolean) {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLatLng();
        void placeMarker(pos.lat, pos.lng, false);
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (recenter) map.setView([lat, lng], 15);
    onChange({ lat, lng, address: null });
    const address = await reverseGeocode(lat, lng, lang);
    onChange({ lat, lng, address });
  }

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current, { zoomControl: true }).setView(
      value ? [value.lat, value.lng] : DEFAULT_CENTER,
      value ? 15 : 12
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => void placeMarker(e.latlng.lat, e.latlng.lng, false));
    mapRef.current = map;
    if (value) void placeMarker(value.lat, value.lng, false);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoError(lang === "ar" ? "لا يدعم المتصفح تحديد الموقع" : "Geolocation isn't supported by this browser");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        void placeMarker(pos.coords.latitude, pos.coords.longitude, true);
      },
      () => {
        setLocating(false);
        setGeoError(
          lang === "ar"
            ? "تعذّر الوصول إلى موقعك — تأكد من السماح بالوصول إلى الموقع، أو حدّد المكان يدويًا على الخريطة"
            : "Couldn't access your location — check location permission, or tap the map to set it manually"
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="grid">
      <button type="button" className="btn secondary" onClick={useMyLocation} disabled={locating}>
        {locating ? tr("loading") : lang === "ar" ? "📍 استخدم موقعي الحالي" : "📍 Use my current location"}
      </button>
      <div ref={mapElRef} className="address-map" />
      {geoError && <p className="muted" style={{ color: "var(--danger)" }}>{geoError}</p>}
      <p className="muted">
        {lang === "ar" ? "أو اضغط في أي مكان على الخريطة لتحديد موقعك بدقة." : "Or tap anywhere on the map to place your location precisely."}
      </p>
      {value && (
        <div className="item" style={{ cursor: "default" }}>
          <strong>{lang === "ar" ? "الموقع المحدد" : "Selected location"}</strong>
          <div className="meta">{value.address || (lang === "ar" ? "جاري تحديد العنوان..." : "Resolving address...")}</div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

const CARTO_VOYAGER = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

const PIN_ICON = L.divIcon({
  className: "",
  html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.35))">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z" fill="#1a3a42"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
});

// Same Nominatim geocoding + in-memory cache as the website's LocationMap —
// any address/mapQuery string resolves to a pin without needing lat/lng
// stored on every business. Progressively drops the leading (most specific)
// comma segment on a miss, since farm/building names often aren't indexed.
const geocodeCache = new Map();

async function geocodeOnce(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  return data.length > 0 ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
}

async function geocode(query) {
  if (geocodeCache.has(query)) return geocodeCache.get(query);
  const segments = query.split(",").map((s) => s.trim());
  let result = null;
  for (let i = 0; i < segments.length && !result; i++) {
    result = await geocodeOnce(segments.slice(i).join(", "));
  }
  geocodeCache.set(query, result);
  return result;
}

// Small embedded map for detail screens — every Eat & Drink/Shop/Services/
// Stay business has an address but not necessarily stored coordinates, so
// this geocodes on the fly rather than requiring lat/lng on every listing.
export default function MiniMap({ query, lat, lng, height = 180 }) {
  const [pos, setPos] = useState(lat && lng ? { lat, lng } : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (lat && lng) { setPos({ lat, lng }); return; }
    if (!query) return;
    let cancelled = false;
    setPos(null);
    setFailed(false);
    geocode(query).then((r) => {
      if (cancelled) return;
      if (r) setPos(r);
      else setFailed(true);
    });
    return () => { cancelled = true; };
  }, [query, lat, lng]);

  if (failed) return null;
  if (!pos) {
    return (
      <div className="rounded-2xl flex items-center justify-center" style={{ height, backgroundColor: "rgba(28,46,56,0.05)" }}>
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--teal-deep)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ height, boxShadow: "0 10px 26px -14px rgba(28,46,56,0.45)" }}>
      <MapContainer
        center={[pos.lat, pos.lng]}
        zoom={15}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url={CARTO_VOYAGER} maxZoom={20} />
        <Marker position={[pos.lat, pos.lng]} icon={PIN_ICON} />
      </MapContainer>
    </div>
  );
}

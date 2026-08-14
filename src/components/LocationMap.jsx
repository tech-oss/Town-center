import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const CARTO_VOYAGER = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

// Custom pin matching TradersMap brand colours
const PIN_ICON = L.divIcon({
  className: "",
  html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.35))">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z" fill="#1a3a42"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -40],
});

// In-memory cache so repeated renders don't re-geocode and avoid Nominatim rate limits
const geocodeCache = new Map();

async function geocodeOnce(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  return data.length > 0 ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
}

// Some real addresses (farms, private lanes, building names) aren't indexed
// as a full string in Nominatim and return zero results even though the
// street/postcode alone resolves fine. Rather than showing "Map unavailable"
// for those, progressively drop the leading comma-separated segment (the
// most specific part, e.g. a farm/building name) and retry.
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

export default function LocationMap({ query, lat, lng, heading = "Location", note, rounded = true, width = "100%", widthClassName, aspectClassName = "aspect-[16/9] md:aspect-[21/9]" }) {
  const [pos, setPos] = useState(lat && lng ? { lat, lng } : null);
  const [error, setError] = useState(false);
  const markerRef = useRef(null);

  // When the target changes, reset state during render (no extra paint). Hardcoded
  // coords resolve immediately; otherwise the effect below geocodes the query.
  const [seenTarget, setSeenTarget] = useState(`${query}|${lat}|${lng}`);
  const target = `${query}|${lat}|${lng}`;
  if (target !== seenTarget) {
    setSeenTarget(target);
    setPos(lat && lng ? { lat, lng } : null);
    setError(false);
  }

  useEffect(() => {
    // Hardcoded coords skip geocoding entirely (handled at render-time above).
    if (lat && lng) return;
    if (!query) return;
    let alive = true;
    geocode(query)
      .then((p) => { if (alive) (p ? setPos(p) : setError(true)); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [query, lat, lng]);

  return (
    <div>
      {heading && (
        <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#000000" }}>{heading}</h2>
      )}
      {heading && note && (
        <p className="text-base mb-6" style={{ color: "#000000" }}>{note}</p>
      )}
      <div
        className={`relative overflow-hidden ${aspectClassName} ${rounded ? "rounded-3xl" : ""} ${widthClassName || ""}`}
        style={{ width: widthClassName ? undefined : width, marginLeft: "auto", marginRight: "auto", boxShadow: "0 14px 50px -26px rgba(28,46,56,0.4)", isolation: "isolate", zIndex: 0 }}
      >
        {pos ? (
          <MapContainer
            center={[pos.lat, pos.lng]}
            zoom={15}
            scrollWheelZoom={false}
            attributionControl={false}
            style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
          >
            <TileLayer url={CARTO_VOYAGER} maxZoom={20} />
            <Marker
              position={[pos.lat, pos.lng]}
              icon={PIN_ICON}
              ref={markerRef}
              eventHandlers={{
                add: (e) => e.target.openPopup(),
              }}
            >
              {note && (
                <Popup closeButton={false} autoClose={false} closeOnClick={false} className="location-tile-popup">
                  {note}
                </Popup>
              )}
            </Marker>
          </MapContainer>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ background: "var(--sand)", color: "#000000" }}>
            Map unavailable
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--sand)" }}>
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--forest)", borderTopColor: "transparent" }} />
          </div>
        )}
      </div>
    </div>
  );
}

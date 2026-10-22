import { useEffect, useState } from "react";
import MapBase from "../../components/MapBase";
import { MapContainer, Marker } from "react-leaflet";
import L from "leaflet";
import { geocodePlace } from "../../lib/geocode";


const PIN_ICON = L.divIcon({
  className: "",
  html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.35))">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z" fill="#1a3a42"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
});

// The same lookup as the website's LocationMap — any address/mapQuery string
// resolves to a pin without needing lat/lng stored on every business: the
// postcode first, then the address text (lib/geocode.js).
const geocode = geocodePlace;

// Small embedded map for detail screens — every Eat & Drink/Shop/Services/
// Stay business has an address but not necessarily stored coordinates, so
// this geocodes on the fly rather than requiring lat/lng on every listing.
// Fully interactive (drag/pinch-zoom/zoom buttons) rather than a static
// picture, so the user can explore the area around the pin.
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
        dragging
        doubleClickZoom
        touchZoom
        zoomControl
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <MapBase />
        <Marker position={[pos.lat, pos.lng]} icon={PIN_ICON} />
      </MapContainer>
    </div>
  );
}

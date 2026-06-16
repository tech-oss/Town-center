import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { brandGrid } from "../Data/content";
import { card } from "../utils/design";

// Maidenhead town centre
const CENTRE = { lat: 51.5225, lng: -0.7208 };
const EIGHT_MILES_M = 12875;

function haversineM(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function makeBusinessPin(color = "#1a3a42") {
  return L.divIcon({
    className: "",
    html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -40],
  });
}

function makeUserPin() {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="background:#1a6fdb;color:#fff;font-size:9px;font-weight:700;letter-spacing:0.06em;padding:3px 7px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25)">YOU ARE HERE</div>
      <div style="width:14px;height:14px;background:#1a6fdb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(26,111,219,0.3)"></div>
    </div>`,
    iconSize: [90, 46],
    iconAnchor: [45, 46],
  });
}

// Recenter map when CENTRE changes (no-op here but good pattern)
function MapController({ activeBrand }) {
  const map = useMap();
  useEffect(() => {
    if (activeBrand) {
      map.flyTo([activeBrand.lat, activeBrand.lng], 16, { duration: 0.8 });
    } else {
      map.flyTo([CENTRE.lat, CENTRE.lng], 15, { duration: 0.8 });
    }
  }, [activeBrand, map]);
  return null;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "food-drink", label: "Food & Drink" },
  { key: "shopping", label: "Shopping" },
  { key: "services", label: "Services" },
  { key: "health-beauty", label: "Health & Beauty" },
];

const businessPin = makeBusinessPin();
const activePinColor = makeBusinessPin("#2f8c8c");
const userPin = makeUserPin();

export default function TradersMap() {
  const [filter, setFilter] = useState("all");
  const [userPos, setUserPos] = useState(null); // null = unknown, false = denied/far
  const [activeBrand, setActiveBrand] = useState(null);
  const markersRef = useRef({});

  // Geolocation — only show marker if within 8 miles
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (haversineM(p, CENTRE) <= EIGHT_MILES_M) {
          setUserPos(p);
        } else {
          setUserPos(false);
        }
      },
      () => setUserPos(false),
      { timeout: 8000 }
    );
  }, []);

  const filtered =
    filter === "all"
      ? brandGrid.brands
      : brandGrid.brands.filter((b) => b.section === filter);

  return (
    <section className="py-24 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>
            {brandGrid.eyebrow}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>
            {brandGrid.heading}
          </h2>
          <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: "var(--ink)", opacity: 0.72 }}>
            {brandGrid.subheading}
          </p>
        </div>

        {/* Card container */}
        <div
          className="overflow-hidden"
          style={{ borderRadius: card.radius, boxShadow: card.shadow, background: "#fff" }}
        >
          {/* Filter chips */}
          <div
            className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-none"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setActiveBrand(null); }}
                className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 whitespace-nowrap"
                style={
                  filter === f.key
                    ? { backgroundColor: "var(--forest)", color: "#fff" }
                    : { backgroundColor: "rgba(0,0,0,0.05)", color: "var(--forest)" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Map + Directory */}
          <div className="flex flex-col md:flex-row" style={{ minHeight: "420px" }}>
            {/* Map */}
            <div className="relative flex-1 min-h-[300px] md:min-h-0">
              <MapContainer
                center={[CENTRE.lat, CENTRE.lng]}
                zoom={15}
                zoomControl={false}
                scrollWheelZoom={false}
                style={{ width: "100%", height: "100%", minHeight: "300px" }}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <MapController activeBrand={activeBrand} />

                {/* Business pins */}
                {filtered.map((b) => (
                  <Marker
                    key={b.id}
                    position={[b.lat, b.lng]}
                    icon={activeBrand?.id === b.id ? activePinColor : businessPin}
                    eventHandlers={{ click: () => setActiveBrand(b) }}
                    ref={(r) => { if (r) markersRef.current[b.id] = r; }}
                  >
                    <Popup offset={[0, -32]}>
                      <div className="flex items-center gap-2 py-0.5">
                        <img src={b.logo} alt={b.name} className="w-8 h-8 object-contain rounded" />
                        <div>
                          <p className="font-bold text-sm leading-tight" style={{ color: "var(--forest)" }}>{b.name}</p>
                          <p className="text-xs" style={{ color: "var(--ink)", opacity: 0.6 }}>{b.category}</p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* You Are Here */}
                {userPos && (
                  <Marker position={[userPos.lat, userPos.lng]} icon={userPin} />
                )}
              </MapContainer>
            </div>

            {/* Directory list */}
            <div
              className="w-full md:w-72 lg:w-80 flex-shrink-0 overflow-y-auto"
              style={{ borderLeft: "1px solid rgba(0,0,0,0.07)", maxHeight: "420px" }}
            >
              {filtered.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: "var(--ink)", opacity: 0.5 }}>
                  No traders in this category yet.
                </p>
              ) : (
                filtered.map((b) => (
                  <Link
                    key={b.id}
                    to={b.to}
                    onClick={() => setActiveBrand(b)}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-[rgba(0,0,0,0.03)]"
                    style={{
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      backgroundColor: activeBrand?.id === b.id ? "rgba(47,140,140,0.07)" : undefined,
                    }}
                  >
                    {/* Logo */}
                    <div
                      className="shrink-0 w-11 h-11 rounded-lg bg-white flex items-center justify-center overflow-hidden"
                      style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                    >
                      <img src={b.logo} alt={b.name} className="w-9 h-9 object-contain" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate" style={{ color: "var(--forest)" }}>
                        {b.name}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--ink)", opacity: 0.55 }}>
                        {b.category}
                      </p>
                    </div>
                    {/* Chevron */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-30">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {brandGrid.ctas.map((cta) => (
            <Link
              key={cta.href}
              to={cta.href}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--sage)" }}
            >
              {cta.label} <span>→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

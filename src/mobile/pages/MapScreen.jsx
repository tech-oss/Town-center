import { useRef, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import MobileShell from "../components/MobileShell";
import { mapPins, mapFilters, PIN_COLORS, MAP_CENTRE } from "../data/mobileMock";

const CARTO_VOYAGER = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

function makePin(type, active) {
  const fill = PIN_COLORS[type] ?? PIN_COLORS.default;
  const w = active ? 34 : 26, h = active ? 44 : 34;
  return L.divIcon({
    className: "",
    html: `<svg width="${w}" height="${h}" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.4))">
      ${active ? `<circle cx="14" cy="14" r="17" fill="${fill}" fill-opacity="0.2"/>` : ""}
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z" fill="${fill}"/>
      <circle cx="14" cy="14" r="6" fill="#fff"/>
    </svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

function makeUserPin() {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:#1a6fdb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(26,111,219,0.3)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function LocateControl({ onLocate }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const handle = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }; onLocate(p); map.flyTo([p.lat, p.lng], 16, { duration: 0.8 }); setLocating(false); },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }, [map, onLocate]);
  return (
    <button onClick={handle} className="absolute bottom-4 right-4 w-11 h-11 rounded-full flex items-center justify-center z-[1000]" style={{ backgroundColor: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }} aria-label="Locate me">
      {locating ? (
        <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--forest)", borderTopColor: "transparent" }} />
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
      )}
    </button>
  );
}

export default function MapScreen() {
  const [userPos, setUserPos] = useState(null);
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(null);
  const mapRef = useRef(null);

  const pins = useMemo(() => (filter === "all" ? mapPins : mapPins.filter((p) => p.type === filter)), [filter]);

  return (
    <MobileShell noPadding>
      <div className="flex flex-col h-full">
        <div className="px-5 pt-5 pb-3">
          <h1 className="section-heading text-2xl font-bold mb-1" style={{ color: "#000000" }}>Map</h1>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>Find places, attractions and useful information around town.</p>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-5 pb-3">
          {mapFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setActive(null); }}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
              style={filter === f.key
                ? { backgroundColor: "var(--leaf)", color: "#ffffff" }
                : { backgroundColor: "rgba(28,46,56,0.06)", color: "rgba(0,0,0,0.65)" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="relative flex-1" style={{ minHeight: 0 }}>
          <MapContainer
            center={[MAP_CENTRE.lat, MAP_CENTRE.lng]}
            zoom={15}
            scrollWheelZoom
            attributionControl={false}
            style={{ width: "100%", height: "100%" }}
            ref={mapRef}
          >
            <TileLayer url={CARTO_VOYAGER} maxZoom={20} />
            {pins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={makePin(pin.type, active?.id === pin.id)}
                eventHandlers={{ click: () => setActive(pin) }}
              />
            ))}
            {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={makeUserPin()} />}
            <LocateControl onLocate={setUserPos} />
          </MapContainer>

          {/* Selected place bottom sheet */}
          {active && (
            <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-2xl bg-white p-3 flex items-center gap-3" style={{ boxShadow: "0 8px 28px -6px rgba(0,0,0,0.45)" }}>
              <div className="w-2 h-12 rounded-full shrink-0" style={{ backgroundColor: PIN_COLORS[active.type] }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{active.name}</p>
                <p className="text-xs" style={{ color: "#000000" }}>{active.category}</p>
              </div>
              {active.to ? (
                <Link to={active.to} className="text-xs font-bold px-3 py-2 rounded-xl shrink-0" style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}>
                  View
                </Link>
              ) : (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${active.lat},${active.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold px-3 py-2 rounded-xl shrink-0"
                  style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
                >
                  Directions
                </a>
              )}
              <button onClick={() => setActive(null)} className="text-lg leading-none px-1 shrink-0" style={{ color: "#000000" }} aria-label="Close">✕</button>
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import MobileShell from "../components/MobileShell";
import { ListSearch } from "../components/ListSearch";
import { brandGrid } from "../../Data/content";
import { MAP_CENTRE } from "../data/mobileMock";

const CARTO_VOYAGER = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

// Same category filters — and the same underlying trader dataset — the
// website's Traders map uses (components/TradersMap.jsx).
const FILTERS = [
  { key: "all", label: "All", sections: null },
  { key: "eat-drink", label: "Eat & Drink", sections: ["food-drink"] },
  { key: "shop", label: "Shop", sections: ["shopping"] },
  { key: "services", label: "Services", sections: ["services", "health-beauty"] },
  { key: "see-do", label: "See & Do", sections: ["see-do"] },
  { key: "stay", label: "Stay", sections: ["stay"] },
];

const SECTION_COLORS = {
  "food-drink": "#52C7B6",
  shopping: "#F2A65A",
  services: "#1F9BB5",
  "health-beauty": "#1F9BB5",
  "see-do": "#2FA4A4",
  stay: "#8E6FC4",
};

const colorFor = (section) => SECTION_COLORS[section] ?? "#52C7B6";

// The website's trader links are web routes — map them onto the app's own
// native detail screens so the map never leaves the app.
function mobileHref(to) {
  if (!to) return null;
  let m = to.match(/^\/(?:eat-drink|shop|see-do|services)\/place\/([^/?#]+)/);
  if (m) return `/mobile/place/${m[1]}`;
  m = to.match(/^\/live\/stay\/(hotels|accommodation)\/([^/?#]+)/);
  if (m) return `/mobile/stay/${m[1]}/${m[2]}`;
  return null;
}

// A selected pin uses a distinct highlight colour rather than just a scaled
// version of its own category colour, so it reads unmistakably as "this one"
// against the teal/orange/purple category pins around it.
const SELECTED_COLOR = "#E63946";

// (section, active) fully determines a pin's appearance, so icons are cached
// by that pair rather than rebuilt on every render. Passing react-leaflet's
// Marker a fresh L.divIcon instance each time — even one that renders
// identically — makes it call the underlying marker's setIcon(), which was
// visibly juddering every pin on the map whenever any single pin's active
// state changed elsewhere (e.g. selecting a different search result).
const pinIconCache = new Map();

function makePin(section, active) {
  const key = `${section}|${active}`;
  if (pinIconCache.has(key)) return pinIconCache.get(key);

  const fill = active ? SELECTED_COLOR : colorFor(section);
  const w = active ? 46 : 26, h = active ? 60 : 34;
  const icon = L.divIcon({
    className: "",
    html: `<svg width="${w}" height="${h}" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));${active ? "animation:pinPulse 1.4s ease-out infinite;" : ""}">
      ${active ? `<circle cx="14" cy="14" r="20" fill="${fill}" fill-opacity="0.22"/>` : ""}
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z" fill="${fill}" stroke="#fff" stroke-width="${active ? 1.5 : 0}"/>
      <circle cx="14" cy="14" r="${active ? 7 : 6}" fill="#fff"/>
    </svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
  pinIconCache.set(key, icon);
  return icon;
}

const userPinIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#1a6fdb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(26,111,219,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

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

// Recentres the map when a search result is chosen. Must run in an effect
// gated on the target's identity — calling map.flyTo() directly in the
// render body re-issued it on every re-render (e.g. the active-pin state
// change right after selection), restarting the in-flight animation and
// making the whole map and every pin visibly judder.
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 17, { duration: 0.7 });
  }, [map, target?.id, target?.lat, target?.lng]);
  return null;
}

export default function MapScreen() {
  const [userPos, setUserPos] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const mapRef = useRef(null);

  const withCoords = useMemo(
    () => brandGrid.brands.filter((b) => typeof b.lat === "number" && typeof b.lng === "number"),
    []
  );

  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const pins = useMemo(
    () => (activeFilter.sections === null
      ? withCoords
      : withCoords.filter((b) => activeFilter.sections.includes(b.section))),
    [withCoords, activeFilter]
  );

  // Typeahead over the currently-filtered pins.
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pins
      .filter((b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q))
      .slice(0, 6);
  }, [pins, query]);

  const directionsUrl = (b) => {
    const from = userPos ? `&origin=${userPos.lat},${userPos.lng}` : "";
    return `https://www.google.com/maps/dir/?api=1${from}&destination=${b.lat},${b.lng}`;
  };

  function choose(b) {
    setActive(b);
    setFlyTarget({ lat: b.lat, lng: b.lng, id: b.id });
    setQuery("");
  }

  return (
    <MobileShell title="Map" onBack backFallback="/mobile/home" noPadding>
      <div className="flex flex-col h-full">
        <div className="px-5 pt-4 pb-3">
          <p className="text-sm font-medium" style={{ color: "#000000" }}>Find places, attractions and useful information around town.</p>
        </div>

        {/* Search over the map's businesses */}
        <div className="px-5 pb-3 relative z-[1100]">
          <ListSearch value={query} onChange={setQuery} placeholder="Search businesses on the map…" />
          {suggestions.length > 0 && (
            <div className="absolute left-5 right-5 mt-1.5 rounded-2xl overflow-hidden bg-white" style={{ boxShadow: "0 14px 34px -12px rgba(28,46,56,0.55)" }}>
              {suggestions.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => choose(b)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left active:bg-black/[0.04]"
                  style={i < suggestions.length - 1 ? { borderBottom: "1px solid rgba(28,46,56,0.08)" } : undefined}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorFor(b.section) }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold truncate" style={{ color: "#000000" }}>{b.name}</span>
                    <span className="block text-[11px] font-medium truncate" style={{ color: "#000000", opacity: 0.7 }}>{b.category}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category filters — same set as the website's traders map */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none px-5 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setActive(null); }}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs whitespace-nowrap"
              style={filter === f.key
                ? { backgroundColor: "var(--forest)", color: "#ffffff", fontWeight: 800 }
                : { backgroundColor: "rgba(28,46,56,0.06)", color: "#000000", fontWeight: 600 }}
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
            {pins.map((b) => (
              <Marker
                key={b.id}
                position={[b.lat, b.lng]}
                icon={makePin(b.section, active?.id === b.id)}
                eventHandlers={{ click: () => setActive(b) }}
              />
            ))}
            {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={userPinIcon} />}
            <FlyTo target={flyTarget} />
            <LocateControl onLocate={setUserPos} />
          </MapContainer>

          {/* Selected place sheet — details, directions and a link through to
              the business's own page when it has one. */}
          {active && (
            <div className="absolute left-3 right-3 bottom-3 z-[1000] rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 10px 30px -6px rgba(28,46,56,0.55)" }}>
              <div className="flex items-center gap-3 p-3">
                <div className="w-2 h-12 rounded-full shrink-0" style={{ backgroundColor: colorFor(active.section) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{active.name}</p>
                  <p className="text-xs font-medium truncate" style={{ color: "#000000", opacity: 0.75 }}>
                    {active.category}{active.address ? ` · ${active.address}` : ""}
                  </p>
                </div>
                <button onClick={() => setActive(null)} className="text-lg leading-none px-1 shrink-0" style={{ color: "#000000" }} aria-label="Close">✕</button>
              </div>
              <div className="flex gap-2 px-3 pb-3">
                <a
                  href={directionsUrl(active)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl"
                  style={{ backgroundColor: "var(--teal-deep)", color: "#ffffff" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  Directions
                </a>
                {mobileHref(active.to) && (
                  <Link
                    to={mobileHref(active.to)}
                    className="flex-1 text-center text-xs font-bold py-2.5 rounded-xl"
                    style={{ backgroundColor: "var(--forest)", color: "#ffffff" }}
                  >
                    View Details
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

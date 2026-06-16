import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { brandGrid } from "../Data/content";
import { card } from "../utils/design";

const CENTRE = { lat: 51.5220, lng: -0.7208 };
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

function makePin(active = false) {
  const fill = active ? "#2f8c8c" : "#1a3a42";
  const ring = active ? 'stroke="#2f8c8c" stroke-width="3" stroke-opacity="0.25"' : "";
  return L.divIcon({
    className: "",
    html: `<svg width="${active ? 36 : 28}" height="${active ? 48 : 38}" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
      ${active ? `<circle cx="14" cy="14" r="18" fill="${fill}" fill-opacity="0.15" ${ring}/>` : ""}
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z" fill="${fill}"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>`,
    iconSize: active ? [36, 48] : [28, 38],
    iconAnchor: active ? [18, 48] : [14, 38],
    popupAnchor: [0, active ? -50 : -40],
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

function popupHtml(b) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:4px 2px;min-width:148px;text-align:center;">
      <img src="${b.logo}" alt="${b.name}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;border:1px solid rgba(0,0,0,0.08);background:#fafafa"/>
      <div>
        <div style="font-weight:700;font-size:13px;color:#1a3a42;line-height:1.3">${b.name}</div>
        <div style="font-size:11px;color:#666;margin-top:2px">${b.category}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;width:100%">
        <a href="${b.to}" style="display:block;background:#1a3a42;color:#fff;font-size:11px;font-weight:600;padding:5px 10px;border-radius:20px;text-decoration:none;text-align:center">Read more →</a>
        <button data-nav-id="${b.id}" style="display:block;background:transparent;border:1.5px solid #1a3a42;color:#1a3a42;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;cursor:pointer;width:100%;text-align:center">Get Directions</button>
      </div>
    </div>`;
}

// Inner map component — has access to the Leaflet map instance
function ClusteredMarkers({ brands, activeBrand, onSelectBrand, userPos, onNavigate, clusterRef, markersRef }) {
  const map = useMap();
  const userMarkerRef = useRef(null);

  // Rebuild cluster whenever brands or active selection changes
  useEffect(() => {
    if (clusterRef.current) map.removeLayer(clusterRef.current);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction(c) {
        const n = c.getChildCount();
        return L.divIcon({
          html: `<div style="background:#1a3a42;color:#fff;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,0.3);border:2px solid #fff">${n}</div>`,
          className: "",
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });
      },
    });

    markersRef.current = {};

    brands.forEach((b) => {
      const isActive = activeBrand?.id === b.id;
      const marker = L.marker([b.lat, b.lng], { icon: makePin(isActive) });

      marker.bindPopup(popupHtml(b), { maxWidth: 190, minWidth: 160, closeButton: true });

      marker.on("click", () => {
        onSelectBrand(b);
      });

      marker.on("popupopen", () => {
        // Wire the Get Directions button inside the popup
        setTimeout(() => {
          const btn = document.querySelector(`[data-nav-id="${b.id}"]`);
          if (btn) btn.onclick = (e) => { e.preventDefault(); onNavigate(b); };
        }, 50);
      });

      cluster.addLayer(marker);
      markersRef.current[b.id] = marker;
    });

    cluster.addTo(map);
    clusterRef.current = cluster;

    return () => { if (clusterRef.current) map.removeLayer(clusterRef.current); };
  }, [brands, activeBrand, map, onSelectBrand, onNavigate, clusterRef, markersRef]);

  // User location marker
  useEffect(() => {
    if (userMarkerRef.current) { map.removeLayer(userMarkerRef.current); userMarkerRef.current = null; }
    if (userPos) {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: makeUserPin() }).addTo(map);
    }
    return () => { if (userMarkerRef.current) map.removeLayer(userMarkerRef.current); };
  }, [userPos, map]);

  return null;
}

// ── Filter chips data ──────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all", label: "All" },
  { key: "food-drink", label: "Food & Drink" },
  { key: "shopping", label: "Shopping" },
  { key: "services", label: "Services" },
  { key: "health-beauty", label: "Health & Beauty" },
];

// ── Selected business detail card (pinned to top of list) ─────────────────────
function SelectedCard({ brand, onClose, onNavigate }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-4"
      style={{
        background: "linear-gradient(135deg, #1a3a42 0%, #2f8c8c 100%)",
        borderBottom: "2px solid rgba(47,140,140,0.4)",
      }}
    >
      {/* Logo */}
      <div className="shrink-0 w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden" style={{ border: "2px solid rgba(255,255,255,0.2)" }}>
        <img src={brand.logo} alt={brand.name} className="w-10 h-10 object-contain" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-white leading-snug truncate">{brand.name}</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{brand.category}</p>
        <div className="flex gap-2 mt-2">
          <Link
            to={brand.to}
            className="text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff" }}
          >
            Read more →
          </Link>
          <button
            onClick={() => onNavigate(brand)}
            className="text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            Directions
          </button>
        </div>
      </div>

      {/* Close */}
      <button onClick={onClose} className="shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function TradersMap() {
  const [filter, setFilter] = useState("all");
  const [userPos, setUserPos] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);
  const mapRef = useRef(null); // Leaflet map instance
  const clusterRef = useRef(null);
  const markersRef = useRef({});

  // Geolocation — only mark user if within 8 miles of Maidenhead centre
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(haversineM(p, CENTRE) <= EIGHT_MILES_M ? p : false);
      },
      () => setUserPos(false),
      { timeout: 8000 }
    );
  }, []);

  const filtered = filter === "all"
    ? brandGrid.brands
    : brandGrid.brands.filter((b) => b.section === filter);

  // Get directions — always opens Google Maps; uses current location as origin if available
  const handleNavigate = useCallback((b) => {
    const dest = `${b.lat},${b.lng}`;
    const base = "https://www.google.com/maps/dir/?api=1";
    const origin = userPos ? `&origin=${userPos.lat},${userPos.lng}` : "";
    window.open(`${base}${origin}&destination=${dest}&travelmode=walking`, "_blank");
  }, [userPos]);

  // Select a brand: update state, fly map, expand cluster, open popup
  const handleSelectBrand = useCallback((b) => {
    setActiveBrand(b);

    const map = mapRef.current;
    const cluster = clusterRef.current;
    const marker = markersRef.current[b.id];
    if (!map || !cluster || !marker) return;

    // zoomToShowLayer expands any enclosing cluster, then fires the callback
    cluster.zoomToShowLayer(marker, () => {
      map.flyTo([b.lat, b.lng], 17, { duration: 0.7 });
      setTimeout(() => marker.openPopup(), 400);
    });
  }, []);

  function handleDeselect() {
    setActiveBrand(null);
    // Close any open popup
    mapRef.current?.closePopup();
  }

  // Sorted list: active brand always first, rest in original order
  const sortedFiltered = activeBrand
    ? [activeBrand, ...filtered.filter((b) => b.id !== activeBrand.id)]
    : filtered;

  return (
    <section className="py-24 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
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

        {/* Card */}
        <div className="overflow-hidden" style={{ borderRadius: card.radius, boxShadow: card.shadow, background: "#fff" }}>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-none" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); handleDeselect(); }}
                className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 whitespace-nowrap"
                style={filter === f.key
                  ? { backgroundColor: "var(--forest)", color: "#fff" }
                  : { backgroundColor: "rgba(0,0,0,0.05)", color: "var(--forest)" }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Map + Directory */}
          <div className="flex flex-col md:flex-row" style={{ minHeight: "460px" }}>

            {/* Map — isolation:isolate prevents Leaflet z-indexes bleeding above fixed header */}
            <div className="relative flex-1 min-h-[320px] md:min-h-0" style={{ zIndex: 0, isolation: "isolate" }}>
              <MapContainer
                center={[CENTRE.lat, CENTRE.lng]}
                zoom={15}
                scrollWheelZoom={false}
                attributionControl={false}
                style={{ width: "100%", height: "100%", minHeight: "320px" }}
                ref={mapRef}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <ClusteredMarkers
                  brands={filtered}
                  activeBrand={activeBrand}
                  onSelectBrand={handleSelectBrand}
                  userPos={userPos}
                  onNavigate={handleNavigate}
                  clusterRef={clusterRef}
                  markersRef={markersRef}
                />
              </MapContainer>
            </div>

            {/* Directory panel */}
            <div className="w-full md:w-72 lg:w-80 flex-shrink-0 flex flex-col" style={{ borderLeft: "1px solid rgba(0,0,0,0.07)", maxHeight: "460px" }}>

              {/* Selected business card — pinned to top */}
              {activeBrand && (
                <SelectedCard
                  brand={activeBrand}
                  onClose={handleDeselect}
                  onNavigate={handleNavigate}
                />
              )}

              {/* Scrollable list */}
              <div className="overflow-y-auto flex-1">
                {filtered.length === 0 ? (
                  <p className="text-sm text-center py-10" style={{ color: "var(--ink)", opacity: 0.5 }}>
                    No traders in this category yet.
                  </p>
                ) : (
                  sortedFiltered.map((b) => {
                    const isActive = activeBrand?.id === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => handleSelectBrand(b)}
                        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors duration-150"
                        style={{
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                          backgroundColor: isActive ? "rgba(47,140,140,0.08)" : undefined,
                        }}
                      >
                        {/* Logo with teal ring when active */}
                        <div
                          className="shrink-0 w-11 h-11 rounded-lg bg-white flex items-center justify-center overflow-hidden"
                          style={{
                            border: isActive ? "2px solid #2f8c8c" : "1px solid rgba(0,0,0,0.08)",
                            boxShadow: isActive ? "0 0 0 3px rgba(47,140,140,0.15)" : undefined,
                          }}
                        >
                          <img src={b.logo} alt={b.name} className="w-9 h-9 object-contain" />
                        </div>

                        {/* Name + category */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-sm leading-snug truncate"
                            style={{ color: isActive ? "#2f8c8c" : "var(--forest)" }}
                          >
                            {b.name}
                            {isActive && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#2f8c8c" }}>● Selected</span>}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--ink)", opacity: 0.55 }}>
                            {b.category}
                          </p>
                        </div>

                        {/* Chevron / active check */}
                        {isActive ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ color: "#2f8c8c" }}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-30"><path d="M9 18l6-6-6-6"/></svg>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
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

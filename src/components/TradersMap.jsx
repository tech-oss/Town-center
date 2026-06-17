import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { brandGrid } from "../Data/content";
import { card } from "../utils/design";

const CENTRE = { lat: 51.5235, lng: -0.7125 };
const EIGHT_MILES_M = 12875;
const DETAIL_ZOOM = 17;

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
  return L.divIcon({
    className: "",
    html: `<svg width="${active ? 38 : 28}" height="${active ? 50 : 38}" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.35))">
      ${active ? `<circle cx="14" cy="14" r="17" fill="${fill}" fill-opacity="0.18"/>` : ""}
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z" fill="${fill}"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>`,
    iconSize: active ? [38, 50] : [28, 38],
    iconAnchor: active ? [19, 50] : [14, 38],
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
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:4px 2px;min-width:152px;text-align:center;">
      <img src="${b.logo}" alt="${b.name}" style="width:52px;height:52px;object-fit:contain;border-radius:10px;border:1px solid rgba(0,0,0,0.08);background:#fafafa"/>
      <div>
        <div style="font-weight:700;font-size:13px;color:#1a3a42;line-height:1.3">${b.name}</div>
        <div style="font-size:11px;color:#666;margin-top:2px">${b.category}</div>
        ${b.address ? `<div style="font-size:10px;color:#999;margin-top:3px;line-height:1.3">${b.address}</div>` : ""}
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;width:100%">
        ${b.to ? `<button data-read-id="${b.id}" style="display:block;background:#1a3a42;color:#fff;font-size:11px;font-weight:600;padding:5px 10px;border-radius:20px;border:none;cursor:pointer;text-align:center;width:100%">Read more →</button>` : ""}
        <button data-nav-id="${b.id}" style="display:block;background:transparent;border:1.5px solid #1a3a42;color:#1a3a42;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;cursor:pointer;width:100%;text-align:center">Get Directions</button>
      </div>
    </div>`;
}

// ── Map controller — owns the cluster, the active highlight pin and the popup ──
function MapLayer({ brands, activeBrand, onSelectBrand, onReadMore, onNavigate, onDeselect, userPos, apiRef }) {
  const map = useMap();
  const clusterRef = useRef(null);
  const highlightRef = useRef(null);   // dedicated, always-on-top pin for the selection
  const userMarkerRef = useRef(null);
  const popupRef = useRef(null);

  // Latest callbacks via refs so marker handlers never go stale (no rebuilds)
  const selectRef = useRef(onSelectBrand);
  const readRef = useRef(onReadMore);
  const navRef = useRef(onNavigate);
  const deselectRef = useRef(onDeselect);
  selectRef.current = onSelectBrand;
  readRef.current = onReadMore;
  navRef.current = onNavigate;
  deselectRef.current = onDeselect;

  const brandKey = brands.map((b) => b.id).join(",");

  // Build the cluster + base markers ONCE per brand-set (filter change only)
  useEffect(() => {
    if (clusterRef.current) map.removeLayer(clusterRef.current);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 45,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
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

    brands.forEach((b) => {
      const marker = L.marker([b.lat, b.lng], { icon: makePin(false) });
      marker.on("click", () => selectRef.current(b));
      cluster.addLayer(marker);
    });

    cluster.addTo(map);
    clusterRef.current = cluster;

    return () => { if (clusterRef.current) map.removeLayer(clusterRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandKey, map]);

  // Expose an imperative API to the parent for selecting a business
  useEffect(() => {
    apiRef.current = {
      focus(b) {
        // 1. Clear any previous popup + highlight (kills stale cards).
        //    Null the ref BEFORE closing so the popupclose handler doesn't
        //    mistake this programmatic close for a user dismissal (which would
        //    deselect and cancel the new selection).
        const prevPopup = popupRef.current;
        popupRef.current = null;
        if (prevPopup) map.closePopup(prevPopup);
        if (highlightRef.current) { map.removeLayer(highlightRef.current); highlightRef.current = null; }

        // 2. Recentre on the business (instant = reliable + predictable)
        map.setView([b.lat, b.lng], DETAIL_ZOOM, { animate: false });

        // 3. Drop a dedicated highlight pin ABOVE everything (visible even if
        //    the underlying clustered marker is collapsed into a number badge)
        highlightRef.current = L.marker([b.lat, b.lng], {
          icon: makePin(true),
          zIndexOffset: 1000,
          interactive: true,
        }).addTo(map);
        highlightRef.current.on("click", () => selectRef.current(b));

        // 4. Open a standalone popup at the exact coordinates. Because it is
        //    bound to a latlng (not a marker), it ALWAYS shows the right card
        //    in the right place, regardless of clustering.
        const popup = L.popup({
          offset: [0, -46],
          closeButton: true,
          autoPan: true,
          autoPanPadding: [30, 30],
          className: "trader-popup",
        })
          .setLatLng([b.lat, b.lng])
          .setContent(popupHtml(b));
        map.openPopup(popup);
        popupRef.current = popup;

        // 5. Wire the popup's buttons once its DOM exists
        const el = popup.getElement();
        if (el) {
          const readBtn = el.querySelector(`[data-read-id="${b.id}"]`);
          const navBtn = el.querySelector(`[data-nav-id="${b.id}"]`);
          if (readBtn) readBtn.onclick = (e) => { e.preventDefault(); readRef.current(b); };
          if (navBtn) navBtn.onclick = (e) => { e.preventDefault(); navRef.current(b); };
        }
      },
      clear() {
        const prevPopup = popupRef.current;
        popupRef.current = null;
        if (prevPopup) map.closePopup(prevPopup);
        if (highlightRef.current) { map.removeLayer(highlightRef.current); highlightRef.current = null; }
      },
    };
  }, [map, apiRef]);

  // When the popup is closed via its X, deselect everything
  useEffect(() => {
    const onClose = (e) => {
      if (popupRef.current && e.popup === popupRef.current) {
        popupRef.current = null;
        if (highlightRef.current) { map.removeLayer(highlightRef.current); highlightRef.current = null; }
        deselectRef.current();
      }
    };
    map.on("popupclose", onClose);
    return () => map.off("popupclose", onClose);
  }, [map]);

  // Re-focus whenever the active business changes (covers list + map taps)
  useEffect(() => {
    if (activeBrand) apiRef.current?.focus(activeBrand);
    else apiRef.current?.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrand?.id]);

  // User-location marker
  useEffect(() => {
    if (userMarkerRef.current) { map.removeLayer(userMarkerRef.current); userMarkerRef.current = null; }
    if (userPos) userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: makeUserPin() }).addTo(map);
    return () => { if (userMarkerRef.current) map.removeLayer(userMarkerRef.current); };
  }, [userPos, map]);

  return null;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "food-drink", label: "Food & Drink" },
  { key: "shopping", label: "Shopping" },
  { key: "services", label: "Services" },
  { key: "health-beauty", label: "Health & Beauty" },
];

export default function TradersMap() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [userPos, setUserPos] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const apiRef = useRef(null); // imperative map API from MapLayer

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

  // Search across ALL brands regardless of category chip
  const q = searchQuery.trim().toLowerCase();
  const searchActive = q.length > 0;
  const searchResults = searchActive
    ? brandGrid.brands.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      )
    : null;

  const handleNavigate = useCallback((b) => {
    const origin = userPos ? `&origin=${userPos.lat},${userPos.lng}` : "";
    window.open(`https://www.google.com/maps/dir/?api=1${origin}&destination=${b.lat},${b.lng}&travelmode=walking`, "_blank");
  }, [userPos]);

  const handleReadMore = useCallback((b) => { navigate(b.to); }, [navigate]);

  // Select: update state. MapLayer's effect re-focuses the map. If the same
  // brand is tapped again, re-focus directly (effect won't re-run for same id).
  const handleSelect = useCallback((b) => {
    setActiveBrand((prev) => {
      if (prev?.id === b.id) { apiRef.current?.focus(b); return prev; }
      return b;
    });
  }, []);

  const handleDeselect = useCallback(() => setActiveBrand(null), []);

  const sortedFiltered = activeBrand
    ? [activeBrand, ...filtered.filter((b) => b.id !== activeBrand.id)]
    : filtered;

  // The list shown in the directory panel
  const directoryList = searchActive ? searchResults : sortedFiltered;

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === "Enter" && searchResults && searchResults.length > 0) {
      const top = searchResults[0];
      setSearchQuery("");
      handleSelect(top);
    }
    if (e.key === "Escape") setSearchQuery("");
  }, [searchResults, handleSelect]);

  return (
    <section className="py-24 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>{brandGrid.eyebrow}</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>{brandGrid.heading}</h2>
          <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: "var(--ink)", opacity: 0.72 }}>{brandGrid.subheading}</p>
        </div>

        <div className="overflow-hidden" style={{ borderRadius: card.radius, boxShadow: card.shadow, background: "#fff" }}>
          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-none" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); handleDeselect(); }}
                className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 whitespace-nowrap"
                style={filter === f.key ? { backgroundColor: "var(--forest)", color: "#fff" } : { backgroundColor: "rgba(0,0,0,0.05)", color: "var(--forest)" }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Map + Directory */}
          <div className="flex flex-col md:flex-row" style={{ minHeight: "460px" }}>
            <div className="relative flex-1 min-h-[320px] md:min-h-0" style={{ zIndex: 0, isolation: "isolate" }}>
              <MapContainer center={[CENTRE.lat, CENTRE.lng]} zoom={14} scrollWheelZoom={false} attributionControl={false} style={{ width: "100%", height: "100%", minHeight: "320px" }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={20} />
                <MapLayer
                  brands={filtered}
                  activeBrand={activeBrand}
                  onSelectBrand={handleSelect}
                  onReadMore={handleReadMore}
                  onNavigate={handleNavigate}
                  onDeselect={handleDeselect}
                  userPos={userPos}
                  apiRef={apiRef}
                />
              </MapContainer>
            </div>

            {/* Directory */}
            <div className="w-full md:w-72 lg:w-80 flex-shrink-0 flex flex-col" style={{ borderLeft: "1px solid rgba(0,0,0,0.07)", maxHeight: "460px" }}>
              {/* Search bar */}
              <div className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--forest)", opacity: 0.5, flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search businesses…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--forest)", minWidth: 0 }}
                  />
                  {searchActive && (
                    <button onClick={() => setSearchQuery("")} style={{ color: "var(--forest)", opacity: 0.4, flexShrink: 0, lineHeight: 1, fontSize: 16 }}>✕</button>
                  )}
                </div>
                {searchActive && (
                  <p className="text-[11px] mt-1.5 px-1" style={{ color: "var(--ink)", opacity: 0.5 }}>
                    {searchResults.length === 0 ? "No results" : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} — press Enter to select top match`}
                  </p>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {directoryList.length === 0 ? (
                  <p className="text-sm text-center py-10" style={{ color: "var(--ink)", opacity: 0.5 }}>{searchActive ? "No businesses match your search." : "No traders in this category yet."}</p>
                ) : (
                  directoryList.map((b) => {
                    const isActive = activeBrand?.id === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => handleSelect(b)}
                        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors duration-150 hover:bg-[rgba(0,0,0,0.03)]"
                        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", backgroundColor: isActive ? "rgba(47,140,140,0.08)" : undefined }}
                      >
                        <div className="shrink-0 w-11 h-11 rounded-lg bg-white flex items-center justify-center overflow-hidden" style={{ border: isActive ? "2px solid #2f8c8c" : "1px solid rgba(0,0,0,0.08)", boxShadow: isActive ? "0 0 0 3px rgba(47,140,140,0.15)" : undefined }}>
                          <img src={b.logo} alt={b.name} className="w-9 h-9 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-snug truncate" style={{ color: isActive ? "#2f8c8c" : "var(--forest)" }}>
                            {b.name}
                            {isActive && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#2f8c8c" }}>● Selected</span>}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--ink)", opacity: 0.55 }}>{b.category}</p>
                        </div>
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

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {brandGrid.ctas.map((cta) => (
            <Link key={cta.href} to={cta.href} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5" style={{ backgroundColor: "var(--sage)" }}>
              {cta.label} <span>→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

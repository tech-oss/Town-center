import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { brandGrid } from "../Data/content";
import { itemBySlug } from "../Data/pages";
import { categoryColor } from "../lib/categoryColors";

const CENTRE = { lat: 51.5235, lng: -0.7125 };
const EIGHT_MILES_M = 12875;
const DETAIL_ZOOM = 17;

// Shared with the mobile map and both Offers "Business Type" filters so a
// colour always means the same category everywhere.
const colorForSection = categoryColor;

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

// Metres → short imperial label, matching the reference ("0.1 mi").
function milesLabel(metres) {
  const mi = metres / 1609.344;
  if (mi < 0.1) return "< 0.1 mi";
  return `${mi.toFixed(1)} mi`;
}

function makePin(active = false, section = null) {
  const fill = colorForSection(section);
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

  // Latest callbacks via refs so marker handlers never go stale (no rebuilds).
  const selectRef = useRef(onSelectBrand);
  const readRef = useRef(onReadMore);
  const navRef = useRef(onNavigate);
  const deselectRef = useRef(onDeselect);
  useEffect(() => {
    selectRef.current = onSelectBrand;
    readRef.current = onReadMore;
    navRef.current = onNavigate;
    deselectRef.current = onDeselect;
  });

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
      const marker = L.marker([b.lat, b.lng], { icon: makePin(false, b.section) });
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
        const prevPopup = popupRef.current;
        popupRef.current = null;
        if (prevPopup) map.closePopup(prevPopup);
        if (highlightRef.current) { map.removeLayer(highlightRef.current); highlightRef.current = null; }

        map.setView([b.lat, b.lng], DETAIL_ZOOM, { animate: false });

        highlightRef.current = L.marker([b.lat, b.lng], {
          icon: makePin(true, b.section),
          zIndexOffset: 1000,
          interactive: true,
        }).addTo(map);
        highlightRef.current.on("click", () => selectRef.current(b));

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

// ── Tabs mirror the site header: All / Eat & Drink / Shop & Services / See & Do.
// `sections` lists which trader data-sections roll up into each tab.
const FILTERS = [
  { key: "all",       label: "All",              sections: null },
  { key: "eat-drink", label: "Eat & Drink",      sections: ["food-drink"] },
  { key: "shop",      label: "Shop",             sections: ["shopping"] },
  { key: "services",  label: "Services",         sections: ["services", "health-beauty"] },
  { key: "see-do",    label: "See & Do",         sections: ["see-do"] },
  { key: "stay",      label: "Stay",             sections: ["stay"] },
];

const PinIcon = (props) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.3" />
  </svg>
);

// ── One directory row — thumbnail, name, category · distance, address ─────────
function TraderRow({ b, isActive, distance, onSelect, onDirections }) {
  const thumb = b.image ?? b.logo;
  return (
    <li>
      <div
        onClick={() => onSelect(b)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(b); } }}
        className="group flex items-center gap-3.5 px-4 sm:px-5 py-3.5 cursor-pointer transition-colors duration-150 hover:bg-[rgba(47,164,164,0.06)] focus:outline-none focus-visible:bg-[rgba(47,164,164,0.09)]"
        style={{
          borderBottom: "1px solid rgba(0,0,0,0.055)",
          backgroundColor: isActive ? "rgba(47,140,140,0.09)" : undefined,
        }}
      >
        {/* Thumbnail — a real photo where we have one, otherwise the logo on a
            soft tint so every row keeps the same visual weight */}
        <div
          className="shrink-0 w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center"
          style={{
            background: b.image ? "#e9f4f4" : "#f4fafa",
            border: isActive ? "2px solid #2f8c8c" : "1px solid rgba(0,0,0,0.07)",
            boxShadow: isActive ? "0 0 0 3px rgba(47,140,140,0.15)" : undefined,
          }}
        >
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className={b.image ? "w-full h-full object-cover" : "w-9 h-9 object-contain"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-sm leading-snug truncate"
            style={{ color: isActive ? "#2f8c8c" : "var(--forest)" }}
          >
            {b.name}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(0,0,0,0.62)" }}>
            {b.category}
            <span className="mx-1.5" style={{ color: "rgba(0,0,0,0.28)" }}>•</span>
            <span style={{ color: "var(--leaf)", fontWeight: 600 }}>{distance}</span>
          </p>
          {(b.address || b.tagline) && (
            <p className="text-[11px] mt-1 flex items-center gap-1 truncate" style={{ color: "rgba(0,0,0,0.5)" }}>
              <PinIcon className="shrink-0" style={{ color: "rgba(0,0,0,0.35)" }} />
              <span className="truncate">{b.address ?? b.tagline}</span>
            </p>
          )}
        </div>

        {/* Directions — the one action on the row (no bookmark, per the brief) */}
        <button
          onClick={(e) => { e.stopPropagation(); onDirections(b); }}
          aria-label={`Directions to ${b.name}`}
          title="Get directions"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105"
          style={{ background: "rgba(28,46,56,0.06)", color: "var(--forest)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l19-9-9 19-2-8-8-2z" />
          </svg>
        </button>
      </div>
    </li>
  );
}

// ── Resolving richer detail for a selected trader ────────────────────────────
// Traders that own a detail page (/section/place/:slug) can borrow its real
// content — description, gallery, hours, phone. The bulk of the directory has
// no such page, so every field below is optional and the card simply drops the
// rows it has no data for.
//
// The seeded detail pages ship deliberate placeholders for contact fields;
// these sentinels are filtered out rather than shown, so nobody rings a dead
// number or follows a dead link. Replace them with real values in
// src/Data/pages.js and they'll appear automatically.
const PLACEHOLDER_VALUES = new Set([
  "01628 000 000",
  "www.maidenhead.example",
  "The Colonnade, High Street, Maidenhead SL6 1QJ",
  "—",
]);

const real = (v) => (v && !PLACEHOLDER_VALUES.has(v) ? v : null);

function placeFor(brand) {
  const slug = brand?.to?.includes("/place/") ? brand.to.split("/place/")[1].split(/[?#]/)[0] : null;
  return slug ? itemBySlug[slug] ?? null : null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Returns the hours entry covering today, purely by reading the published
// schedule — no "open right now" inference, which we have no live data for.
function todaysHours(hours) {
  if (!hours?.length) return null;
  const today = new Date().getDay();
  for (const h of hours) {
    const [from, to] = h.day.split(/[–—-]/).map((s) => s.trim());
    const a = DAYS.indexOf(from);
    if (a === -1) continue;
    const b = to ? DAYS.indexOf(to) : a;
    if (b === -1) continue;
    const inRange = a <= b ? today >= a && today <= b : today >= a || today <= b;
    if (inRange) return h;
  }
  return null;
}

// ── Small building blocks for the detail card ────────────────────────────────
function ActionButton({ icon, label, onClick, href, active }) {
  const cls = "flex flex-col items-center gap-1.5 flex-1 min-w-0 py-1 transition-opacity duration-150 hover:opacity-60";
  const style = { color: active ? "var(--leaf)" : "var(--forest)" };
  const inner = (
    <>
      {icon}
      <span className="text-[11px] font-medium leading-none truncate w-full text-center">{label}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cls} style={style}>
        {inner}
      </a>
    );
  }
  return <button onClick={onClick} className={cls} style={style}>{inner}</button>;
}

function DetailRow({ icon, children }) {
  return (
    <div className="flex items-start gap-2.5 py-3 px-4 min-w-0">
      <span className="shrink-0 mt-0.5" style={{ color: "var(--leaf)" }}>{icon}</span>
      <div className="min-w-0 text-xs leading-relaxed" style={{ color: "var(--forest)" }}>{children}</div>
    </div>
  );
}

const IconClock = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" strokeLinecap="round" /></svg>;
const IconPhone = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const IconMapPin = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" strokeLinejoin="round" /><circle cx="12" cy="9.5" r="2.3" /></svg>;

// ── Selected-trader card — replaces the list while a business is active ──────
function TraderDetail({ b, place, distance, index, total, onBack, onPrev, onNext, onDirections }) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const hero = place?.image ?? b.image ?? b.logo;
  const description = place?.description ?? b.tagline ?? null;
  const address = real(place?.address) ?? b.address ?? null;
  const phone = real(place?.phone);
  const hours = place?.hours ?? null;
  const today = todaysHours(hours);
  const gallery = (place?.gallery ?? []).filter((g) => g !== hero);
  const detailHref = b.to?.includes("/place/") || b.to?.includes("/live/stay/") ? b.to : null;

  const share = useCallback(async () => {
    const url = detailHref ? `${window.location.origin}${detailHref}` : window.location.href;
    const data = { title: b.name, text: `${b.name} — ${b.category}, Maidenhead`, url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* dismissed or unavailable */ }
  }, [b, detailHref]);

  return (
    <>
      {/* Header — back + position within the current list */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-65"
          style={{ color: "var(--forest)" }}
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
          Back to results
        </button>
        {index > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] mr-1 tabular-nums" style={{ color: "rgba(0,0,0,0.5)" }}>{index} of {total}</span>
            <button onClick={onPrev} aria-label="Previous business" className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(28,46,56,0.08)]" style={{ color: "var(--forest)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={onNext} aria-label="Next business" className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(28,46,56,0.08)]" style={{ color: "var(--forest)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-visible lg:overflow-y-auto lg:overscroll-contain">
        {/* Hero */}
        <div className="relative w-full aspect-[16/9] overflow-hidden" style={{ background: "#e9f4f4" }}>
          <img src={hero} alt={b.name} className={b.image || place?.image ? "w-full h-full object-cover" : "w-full h-full object-contain p-8"} />
        </div>

        {/* Identity — logo tucked over the hero, as in the reference */}
        <div className="px-4 sm:px-5">
          <div className="flex items-start gap-3.5 -mt-7 relative">
            <div
              className="shrink-0 w-14 h-14 rounded-xl bg-white flex items-center justify-center overflow-hidden"
              style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 6px 18px -6px rgba(13,42,51,0.35)" }}
            >
              <img src={b.logo} alt="" className="w-10 h-10 object-contain" />
            </div>
            <div className="flex-1 min-w-0 pt-8">
              <div className="min-w-0">
                <h3 className="text-xl leading-tight truncate" style={{ fontFamily: "var(--font-heading)", fontWeight: 400, color: "var(--forest)" }}>
                  {b.name}
                </h3>
                <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(0,0,0,0.6)" }}>{b.category}</p>
              </div>
              {(address || distance) && (
                <p className="text-[11px] mt-1.5 flex items-center gap-1.5 min-w-0" style={{ color: "rgba(0,0,0,0.55)" }}>
                  <PinIcon className="shrink-0" style={{ color: "rgba(0,0,0,0.4)" }} />
                  <span className="truncate">{address}</span>
                  {address && <span style={{ color: "rgba(0,0,0,0.28)" }}>•</span>}
                  <span className="shrink-0" style={{ color: "var(--leaf)", fontWeight: 600 }}>{distance}</span>
                </p>
              )}
            </div>
          </div>

          {description && (
            <p className="text-xs leading-relaxed mt-4" style={{ color: "rgba(0,0,0,0.72)" }}>{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-stretch gap-1 px-3 sm:px-4 mt-4 py-3 mx-1" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <ActionButton
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>}
            label="Directions"
            onClick={() => onDirections(b)}
          />
          {phone && <ActionButton icon={IconPhone} label="Call" href={`tel:${phone.replace(/\s+/g, "")}`} />}
          <ActionButton
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" /></svg>}
            label={copied ? "Copied" : "Share"}
            active={copied}
            onClick={share}
          />
        </div>

        {/* Facts — two columns, mirroring the reference */}
        {(today || hours || phone || address) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 px-1 py-1">
            {(today || hours) && (
              <DetailRow icon={IconClock}>
                {today ? (
                  <>
                    <button
                      onClick={() => setHoursOpen((o) => !o)}
                      aria-expanded={hoursOpen}
                      className="flex items-center gap-1.5 font-semibold transition-opacity hover:opacity-70"
                      style={{ color: "var(--leaf)" }}
                    >
                      Open today
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${hoursOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                    <div style={{ color: "rgba(0,0,0,0.7)" }}>{today.time}</div>
                    {hoursOpen && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {hours.map((h) => (
                          <li key={h.day} className="flex justify-between gap-3" style={{ color: h === today ? "var(--forest)" : "rgba(0,0,0,0.55)", fontWeight: h === today ? 600 : 400 }}>
                            <span>{h.day}</span><span>{h.time}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <span style={{ color: "rgba(0,0,0,0.6)" }}>Opening hours vary</span>
                )}
              </DetailRow>
            )}
            {phone && (
              <DetailRow icon={IconPhone}>
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="transition-opacity hover:opacity-70">{phone}</a>
              </DetailRow>
            )}
            {address && <DetailRow icon={IconMapPin}>{address}</DetailRow>}
          </div>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="px-4 sm:px-5 pt-2 pb-5">
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(0, 3).map((src) => (
                <div key={src} className="aspect-square rounded-lg overflow-hidden" style={{ background: "#e9f4f4" }}>
                  <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
              {gallery.length > 3 &&
                (detailHref ? (
                  <Link to={detailHref} className="relative aspect-square rounded-lg overflow-hidden block group/g">
                    <img src={gallery[3]} alt="" loading="lazy" className="w-full h-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white transition-opacity group-hover/g:opacity-90" style={{ background: "rgba(13,42,51,0.68)" }}>
                      +{gallery.length - 3}
                    </span>
                  </Link>
                ) : (
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={gallery[3]} alt="" loading="lazy" className="w-full h-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white" style={{ background: "rgba(13,42,51,0.68)" }}>
                      +{gallery.length - 3}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer — through to the full profile where one exists */}
      {detailHref && (
        <Link
          to={detailHref}
          className="group flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold shrink-0 transition-colors duration-150 hover:bg-[rgba(47,164,164,0.07)]"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)", color: "var(--forest)" }}
        >
          View full profile
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>
      )}
    </>
  );
}

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

  // Distances are measured from the visitor when we know where they are,
  // otherwise from the town centre.
  const origin = userPos || CENTRE;

  const activeFilter = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const filtered = useMemo(() => {
    const list =
      activeFilter.sections === null
        ? brandGrid.brands
        : brandGrid.brands.filter((b) => activeFilter.sections.includes(b.section));
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [activeFilter]);

  // Free-text search runs within the selected tab.
  const q = searchQuery.trim().toLowerCase();
  const searchActive = q.length > 0;
  const results = useMemo(() => {
    if (!searchActive) return filtered;
    return filtered
      .filter((b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q))
      .sort((a, b) => {
        const an = a.name.toLowerCase();
        const bn = b.name.toLowerCase();
        if (an === q && bn !== q) return -1;
        if (bn === q && an !== q) return 1;
        const aStarts = an.startsWith(q);
        const bStarts = bn.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;
        return an.localeCompare(bn);
      });
  }, [filtered, q, searchActive]);

  const handleNavigate = useCallback((b) => {
    const from = userPos ? `&origin=${userPos.lat},${userPos.lng}` : "";
    window.open(`https://www.google.com/maps/dir/?api=1${from}&destination=${b.lat},${b.lng}&travelmode=walking`, "_blank");
  }, [userPos]);

  const handleReadMore = useCallback((b) => { if (b.to) navigate(b.to); }, [navigate]);

  const handleSelect = useCallback((b) => {
    setActiveBrand((prev) => {
      if (prev?.id === b.id) { apiRef.current?.focus(b); return prev; }
      return b;
    });
  }, []);

  const handleDeselect = useCallback(() => setActiveBrand(null), []);

  // Position of the selection within the list the visitor is currently browsing,
  // powering the "n of N" counter and the prev/next arrows.
  const activeIndex = activeBrand ? results.findIndex((x) => x.id === activeBrand.id) : -1;
  const step = useCallback(
    (dir) => {
      if (activeIndex < 0 || results.length === 0) return;
      handleSelect(results[(activeIndex + dir + results.length) % results.length]);
    },
    [activeIndex, results, handleSelect]
  );

  // The list only renders while nothing is selected (a selection shows the
  // detail card instead), so it simply mirrors the current results —
  // alphabetical within the active tab, or search matches.
  const directoryList = results;

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === "Enter" && results.length > 0) {
      setSearchQuery("");
      handleSelect(results[0]);
    }
    if (e.key === "Escape") setSearchQuery("");
  }, [results, handleSelect]);

  return (
    <section
      className="py-14 md:py-16 overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* ── Heading ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 text-center mb-8">
        <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>
          {brandGrid.eyebrow}
        </p>
        <h2 className="home-section-title text-3xl md:text-5xl mb-4 leading-tight" style={{ color: "#000000" }}>
          {brandGrid.heading}
        </h2>
        <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: "#000000" }}>
          {brandGrid.subheading}
        </p>
      </div>

      {/* ── Tabs — mirroring the header nav ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 mb-8">
        <div
          className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none sm:justify-center -mx-1 px-1 py-1"
          role="tablist"
          aria-label="Filter traders by category"
        >
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={on}
                onClick={() => { setFilter(f.key); handleDeselect(); setSearchQuery(""); }}
                className="shrink-0 inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
                style={
                  on
                    ? { backgroundColor: "var(--forest)", color: "#fff", boxShadow: "0 6px 16px -6px rgba(28,46,56,0.5)" }
                    : { backgroundColor: "rgba(255,255,255,0.85)", color: "var(--forest)", border: "1px solid rgba(28,46,56,0.12)" }
                }
              >
                {f.sections && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorForSection(f.sections[0]) }} />}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Full-bleed map with the directory panel floating over it ──
           The map runs the full width of the viewport. It's framed the same
           way as the panel and the site's cards — a hairline in the brand
           navy plus a soft, colour-matched shadow — rather than a flat black
           rule, so it reads as a premium feature of the page instead of a
           box dropped on top of it. */}
      <div className="relative w-full">
        <div
          data-immersive
          className="relative h-[380px] sm:h-[460px] lg:h-[660px] w-full"
          style={{
            zIndex: 0,
            isolation: "isolate",
            boxSizing: "border-box",
            border: "1px solid rgba(28,46,56,0.16)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5), 0 20px 48px -18px rgba(13,42,51,0.32)",
          }}
        >
          <MapContainer
            center={[CENTRE.lat, CENTRE.lng]}
            zoom={14}
            scrollWheelZoom={false}
            attributionControl={false}
            style={{ width: "100%", height: "100%", background: "var(--sand)" }}
          >
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

        {/* Panel — floats over the map from lg up, stacks beneath it on mobile */}
        <div className="relative lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:items-center lg:pr-8 xl:pr-12 lg:pointer-events-none" style={{ zIndex: 500 }}>
          {/* Height and scrolling differ by breakpoint on purpose. On desktop the
              panel is a fixed-height floating card that scrolls internally. On
              touch, nesting a scroller inside the page scroller traps the
              gesture — so an open detail card grows to its natural height and
              lets the page do all the scrolling, while the (necessarily bounded)
              list chains its overscroll to the page instead of dead-ending. */}
          <div
            className={`mx-auto lg:mx-0 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-2xl lg:w-[430px] xl:w-[460px] lg:max-w-none -mt-10 lg:mt-0 lg:pointer-events-auto flex flex-col overflow-hidden ${
              activeBrand ? "max-h-none" : "max-h-[70vh]"
            } lg:max-h-[min(600px,calc(100vh-8rem))]`}
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 24px 60px -20px rgba(13,42,51,0.35), 0 4px 14px rgba(13,42,51,0.08)",
            }}
          >
            {activeBrand ? (
              <TraderDetail
                b={activeBrand}
                place={placeFor(activeBrand)}
                distance={milesLabel(haversineM(origin, activeBrand))}
                index={activeIndex + 1}
                total={results.length}
                onBack={handleDeselect}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
                onDirections={handleNavigate}
              />
            ) : (
            <>
            {/* Search */}
            <div className="px-4 sm:px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-shadow duration-150"
                style={{ background: "rgba(28,46,56,0.055)", border: "1px solid rgba(28,46,56,0.08)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--forest)", flexShrink: 0, opacity: 0.55 }}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search for a business"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  aria-label="Search for a business"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
                  style={{ color: "var(--forest)", minWidth: 0 }}
                />
                {searchActive && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="shrink-0 leading-none transition-opacity hover:opacity-60"
                    style={{ color: "var(--forest)", fontSize: 15 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1 min-h-0 overscroll-auto lg:overscroll-contain">
              {directoryList.length === 0 ? (
                <p className="text-sm text-center py-12 px-6" style={{ color: "rgba(0,0,0,0.55)" }}>
                  {searchActive
                    ? `No businesses match “${searchQuery.trim()}”.`
                    : "No traders in this category yet."}
                </p>
              ) : (
                <ul>
                  {directoryList.map((b) => (
                    <TraderRow
                      key={b.id}
                      b={b}
                      isActive={activeBrand?.id === b.id}
                      distance={milesLabel(haversineM(origin, b))}
                      onSelect={handleSelect}
                      onDirections={handleNavigate}
                    />
                  ))}
                </ul>
              )}
            </div>
            </>
            )}
          </div>
        </div>
      </div>

      {/* ── Section CTAs ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 mt-12 lg:mt-14 flex flex-col sm:flex-row gap-3 justify-center">
        {brandGrid.ctas.map((cta) => (
          <Link
            key={cta.href}
            to={cta.href}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--forest)" }}
          >
            {cta.label} <span>→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { fmtPrice } from "../Data/live";
import { getProperties, getBuildings } from "../api";
import useFetch from "../hooks/useFetch";
import { card } from "../utils/design";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";

// Three featured listings shown in the spotlight section (any selection for now)
const FEATURED_SLUGS = ["ws-penthouse-9", "ws-2bed-apt-4", "bp-studio-1"];

// ─── Filter data ──────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "any",        label: "Any" },
  { value: "house",      label: "Houses" },
  { value: "flat",       label: "Flats / Apartments" },
  { value: "bungalow",   label: "Bungalows" },
  { value: "land",       label: "Land" },
  { value: "commercial", label: "Commercial Property" },
  { value: "other",      label: "Other" },
];

const SALE_PRICES = [
  50000, 75000, 100000, 125000, 150000, 175000, 200000, 225000, 250000,
  275000, 300000, 325000, 350000, 375000, 400000, 425000, 450000, 475000,
  500000, 550000, 600000, 650000, 700000, 750000, 800000, 850000, 900000,
  950000, 1000000, 1100000, 1200000, 1300000, 1400000, 1500000, 1750000,
  2000000, 2500000, 3000000, 4000000, 5000000,
];

const RENT_PRICES = [
  500, 600, 700, 750, 800, 850, 900, 950, 1000, 1100, 1200, 1250, 1300,
  1400, 1500, 1600, 1700, 1750, 1800, 1900, 2000, 2250, 2500, 2750, 3000,
  3500, 4000, 4500, 5000, 6000, 7500, 10000,
];

const BED_OPTIONS = [
  { value: "studio", label: "Studio" },
  { value: "1",      label: "1" },
  { value: "2",      label: "2" },
  { value: "3",      label: "3" },
  { value: "4",      label: "4" },
  { value: "5",      label: "5+" },
];

function fmtPriceOpt(n) {
  if (n >= 1000000) return `£${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}m`;
  if (n >= 1000) return `£${(n / 1000).toLocaleString()}k`;
  return `£${n.toLocaleString()}`;
}

// ─── Property card ────────────────────────────────────────────────────────────

export function PropertyCard({ p }) {
  return (
    <Link
      to={`/live/property/${p.slug}`}
      className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
      style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={p.image} alt={`${p.bedLabel} at ${p.building}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: p.status === "rent" ? "var(--teal-deep)" : "var(--forest)", color: "#fff" }}>
          {p.status === "rent" ? "To Rent" : "For Sale"}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-5">
        <p className="text-xl font-bold" style={{ color: "var(--forest)" }}>{fmtPrice(p.price, p.status)}</p>
        <p className="text-sm font-semibold" style={{ color: "var(--leaf)" }}>{p.bedLabel} · {p.building}</p>
        <p className="text-xs" style={{ color: "var(--ink)", opacity: 0.6 }}>{p.location}</p>
        <div className="flex items-center gap-4 mt-2 text-xs font-medium" style={{ color: "var(--ink)", opacity: 0.75 }}>
          <span>🛏 {p.beds === 0 ? "Studio" : p.beds === 99 ? "PH" : p.beds}</span>
          <span>🛁 {p.baths}</span>
          <span>📐 {p.sqft} sq ft</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Shared select style ──────────────────────────────────────────────────────

const selCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none appearance-none";
const selStyle = { backgroundColor: "#fff", border: "1px solid rgba(28,46,56,0.15)", color: "var(--ink)" };

function Sel({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>{label}</span>}
      <div className="relative">
        <select className={selCls} style={selStyle} value={value} onChange={(e) => onChange(e.target.value)}>
          {children}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PropertySearch({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const { data: allProperties, loading: loadingProperties, error } = useFetch(getProperties, []);
  const { data: buildings, loading: loadingBuildings } = useFetch(getBuildings, []);

  const isOverview = mode === "overview";
  const status = mode === "rent" ? "rent" : "sale";
  const priceTiers = status === "rent" ? RENT_PRICES : SALE_PRICES;
  const isRent = status === "rent";

  // Filter state
  const [propType,     setPropType]     = useState("any");
  const [priceMin,     setPriceMin]     = useState("any");
  const [priceMax,     setPriceMax]     = useState("any");
  const [bedsMin,      setBedsMin]      = useState("any");
  const [bedsMax,      setBedsMax]      = useState("any");
  const [sort,         setSort]         = useState("price-asc");

  // Numeric helpers
  function bedNum(v) {
    if (v === "any") return null;
    if (v === "studio") return 0;
    if (v === "5") return 5; // 5 means 5+
    return Number(v);
  }

  const results = useMemo(() => {
    let list = (allProperties ?? []).filter((p) => (isOverview ? true : p.status === status));
    if (propType !== "any") list = list.filter((p) => p.propertyType === propType);
    if (priceMin !== "any") list = list.filter((p) => p.price >= Number(priceMin));
    if (priceMax !== "any") list = list.filter((p) => p.price <= Number(priceMax));
    const bMin = bedNum(bedsMin);
    const bMax = bedNum(bedsMax);
    if (bMin !== null) list = list.filter((p) => (bedsMin === "5" ? p.beds >= 5 : p.beds >= bMin));
    if (bMax !== null) list = list.filter((p) => (bedsMax === "5" ? p.beds >= 5 : p.beds <= bMax));
    list = [...list].sort((a, b) => (sort === "price-asc" ? a.price - b.price : b.price - a.price));
    return list;
  }, [allProperties, propType, priceMin, priceMax, bedsMin, bedsMax, sort, status, isOverview]);

  const title = isOverview ? "Properties Overview" : isRent ? "Properties For Rent" : "Properties For Sale";
  const intro = isOverview
    ? "Browse every available home across our Maidenhead developments, or filter to find the perfect fit."
    : isRent
    ? "Modern properties to rent across Maidenhead's most sought-after riverside developments."
    : "Brand-new and resale properties for sale across Maidenhead's leading developments.";

  if (loadingProperties || loadingBuildings) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* Hero */}
      <section className="relative h-[36vh] min-h-[260px] w-full overflow-hidden">
        <img src={buildings[0].hero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.4) 0%, rgba(28,46,56,0.82) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-10">
          <nav className="mb-3 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--mint)" }}>
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to="/live" className="hover:text-white">Live</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">{title}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{title}</h1>
        </div>
      </section>

      {/* Sale / Rent tabs */}
      {!isOverview && (
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-8">
          <div className="inline-flex rounded-full p-1" style={{ backgroundColor: "#fff", boxShadow: "0 4px 16px -10px rgba(28,46,56,0.3)" }}>
            {[["sale", "For Sale", "/live/for-sale"], ["rent", "For Rent", "/live/for-rent"]].map(([key, label, to]) => (
              <button
                key={key}
                onClick={() => navigate(to)}
                className="px-6 py-2 rounded-full text-sm font-semibold transition-colors"
                style={status === key ? { backgroundColor: "var(--forest)", color: "#fff" } : { color: "var(--forest)" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pt-6">
        <p className="text-base leading-relaxed max-w-3xl mb-5" style={{ color: "var(--ink)", opacity: 0.8 }}>{intro}</p>

        <div className="rounded-3xl p-5 md:p-7 flex flex-col gap-5" style={{ backgroundColor: "#fff", boxShadow: "0 10px 40px -24px rgba(28,46,56,0.3)" }}>

          {/* Row 1: Property type · Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Sel label="Property type" value={propType} onChange={setPropType}>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Sel>

            <Sel label="Sort by" value={sort} onChange={setSort}>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </Sel>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(28,46,56,0.07)" }} />

          {/* Row 2: Price range */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--leaf)" }}>
              Price range ({isRent ? "£ pcm" : "£"})
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <select className={selCls} style={selStyle} value={priceMin} onChange={(e) => setPriceMin(e.target.value)}>
                  <option value="any">No min</option>
                  {priceTiers.map((p) => (
                    <option key={p} value={p}>{fmtPriceOpt(p)}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <span className="text-sm font-medium shrink-0" style={{ color: "var(--ink)", opacity: 0.4 }}>—</span>
              <div className="flex-1 relative">
                <select className={selCls} style={selStyle} value={priceMax} onChange={(e) => setPriceMax(e.target.value)}>
                  <option value="any">No max</option>
                  {priceTiers.map((p) => (
                    <option key={p} value={p}>{fmtPriceOpt(p)}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Row 3: Bedrooms */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--leaf)" }}>
              No. of bedrooms
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <select className={selCls} style={selStyle} value={bedsMin} onChange={(e) => setBedsMin(e.target.value)}>
                  <option value="any">No min</option>
                  {BED_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <span className="text-sm font-medium shrink-0" style={{ color: "var(--ink)", opacity: 0.4 }}>—</span>
              <div className="flex-1 relative">
                <select className={selCls} style={selStyle} value={bedsMax} onChange={(e) => setBedsMax(e.target.value)}>
                  <option value="any">No max</option>
                  {BED_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <p className="text-sm font-semibold mb-6" style={{ color: "var(--forest)" }}>
          {results.length} {results.length === 1 ? "home" : "homes"} available
        </p>
        {results.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {results.map((p) => <PropertyCard key={p.slug} p={p} />)}
          </div>
        ) : (
          <p className="text-center py-12 text-sm" style={{ color: "var(--forest)", opacity: 0.6 }}>
            No homes match your filters right now — try widening your search.
          </p>
        )}
      </section>

      {/* Featured listings — spotlight (mirrors the homepage In the Spotlight) */}
      <FeaturedProperties />
    </div>
  );
}

// ─── Featured properties spotlight (1 large + 2 compact, like the homepage) ───
export function FeaturedProperties() {
  const { data: properties } = useFetch(getProperties, []);
  const featured = FEATURED_SLUGS
    .map((slug) => (properties ?? []).find((p) => p.slug === slug))
    .filter(Boolean);
  // Empty while the request is in flight; the section simply appears once ready.
  if (featured.length === 0) return null;
  const [hero, ...rest] = featured;

  const statusBadge = (p) => (
    <span className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: p.status === "rent" ? "var(--teal-deep)" : "var(--forest)", color: "#fff" }}>
      {p.status === "rent" ? "To Rent" : "For Sale"}
    </span>
  );

  return (
    <section
      className="relative py-20 px-6 md:px-12 mt-4 overflow-hidden"
      style={{ background: "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(150,215,211,0.22) 0%, transparent 70%), linear-gradient(135deg, #16252E 0%, #245C63 50%, #2F8C8C 100%)" }}
    >
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--mint)" }}>Featured Homes</p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white">In the Spotlight</h2>
          </div>
          <Link to="/live/overview" className="group inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-white/80 underline decoration-white/40 underline-offset-4">
            View all properties
            <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
          </Link>
        </div>

        {/* Asymmetric grid: 1 large + 2 compact */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
          {/* Large featured card */}
          <Link
            to={`/live/property/${hero.slug}`}
            className="group relative overflow-hidden flex flex-col min-h-[340px] transition-all duration-300 hover:-translate-y-1"
            style={{ borderRadius: card.radius, boxShadow: card.shadow }}
          >
            <img src={hero.image} alt={`${hero.bedLabel} at ${hero.building}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
            {statusBadge(hero)}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(13,42,51,0.92) 0%, rgba(13,42,51,0.55) 45%, transparent 75%)" }} />
            <div className="relative z-10 mt-auto p-6 flex flex-col gap-1.5">
              <p className="text-2xl font-bold text-white" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.4)" }}>{fmtPrice(hero.price, hero.status)}</p>
              <p className="text-base font-semibold" style={{ color: "var(--sage)" }}>{hero.bedLabel} · {hero.building}</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>{hero.location}</p>
              <div className="flex items-center gap-4 mt-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span>🛏 {hero.beds === 0 ? "Studio" : hero.beds === 99 ? "PH" : hero.beds}</span>
                <span>🛁 {hero.baths}</span>
                <span>📐 {hero.sqft} sq ft</span>
              </div>
            </div>
          </Link>

          {/* Two compact cards */}
          <div className="flex flex-col gap-5">
            {rest.map((p) => (
              <Link
                key={p.slug}
                to={`/live/property/${p.slug}`}
                className="group flex flex-row overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white"
                style={{ borderRadius: card.radius, boxShadow: card.shadow }}
              >
                <div className="relative shrink-0 w-32 overflow-hidden" style={{ aspectRatio: "1/1" }}>
                  <img src={p.image} alt={`${p.bedLabel} at ${p.building}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                </div>
                <div className="flex flex-col flex-1 p-4 gap-1 justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wide w-fit px-2 py-0.5 rounded-full" style={{ backgroundColor: p.status === "rent" ? "rgba(30,95,95,0.12)" : "rgba(47,140,140,0.13)", color: "var(--teal-deep, #1e5f5f)" }}>
                    {p.status === "rent" ? "To Rent" : "For Sale"}
                  </span>
                  <p className="text-lg font-bold mt-0.5" style={{ color: "var(--forest)" }}>{fmtPrice(p.price, p.status)}</p>
                  <p className="text-sm font-semibold leading-snug" style={{ color: "var(--leaf)" }}>{p.bedLabel} · {p.building}</p>
                  <p className="text-xs" style={{ color: "var(--ink)", opacity: 0.6 }}>{p.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { properties, buildings, bedroomOptions, salePrices, rentPrices, fmtPrice } from "../Data/live";

// Small card used in listings + building pages
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
          <span>🛏 {p.beds === 0 ? "Studio" : p.beds === 99 ? "PH" : p.beds} </span>
          <span>🛁 {p.baths}</span>
          <span>📐 {p.sqft} sq ft</span>
        </div>
      </div>
    </Link>
  );
}

export default function PropertySearch({ mode }) {
  // mode: "sale" | "rent" | "overview"
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const isOverview = mode === "overview";
  const status = mode === "rent" ? "rent" : "sale";
  const priceTiers = status === "rent" ? rentPrices : salePrices;

  const [building, setBuilding] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [priceFrom, setPriceFrom] = useState("any");
  const [priceTo, setPriceTo] = useState("any");
  const [sort, setSort] = useState("price-asc");

  const results = useMemo(() => {
    let list = properties.filter((p) => (isOverview ? true : p.status === status));
    if (building !== "all") list = list.filter((p) => p.buildingSlug === building);
    if (bedrooms !== "all") list = list.filter((p) => String(p.beds) === bedrooms);
    if (priceFrom !== "any") list = list.filter((p) => p.price >= Number(priceFrom));
    if (priceTo !== "any") list = list.filter((p) => p.price <= Number(priceTo));
    list = [...list].sort((a, b) => (sort === "price-asc" ? a.price - b.price : b.price - a.price));
    return list;
  }, [building, bedrooms, priceFrom, priceTo, sort, status, isOverview]);

  const title = isOverview ? "Properties Overview" : status === "rent" ? "Properties For Rent" : "Properties For Sale";
  const intro = isOverview
    ? "Browse every available home across our Maidenhead developments, or filter to find the perfect fit."
    : status === "rent"
    ? "Modern properties to rent across Maidenhead's most sought-after riverside developments."
    : "Brand-new and resale properties for sale across Maidenhead's leading developments.";

  const selectCls = "w-full rounded-xl px-4 py-3 text-sm outline-none";
  const selectStyle = { backgroundColor: "#fff", border: "1px solid rgba(28,46,56,0.15)", color: "var(--ink)" };

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

      {/* Tabs (Sale / Rent) */}
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

      {/* Filters */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pt-6">
        <p className="text-base leading-relaxed max-w-3xl mb-6" style={{ color: "var(--ink)", opacity: 0.8 }}>{intro}</p>
        <div className="rounded-3xl p-5 md:p-6 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4" style={{ backgroundColor: "#fff", boxShadow: "0 10px 40px -24px rgba(28,46,56,0.3)" }}>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--leaf)" }}>Building</label>
            <select className={selectCls} style={selectStyle} value={building} onChange={(e) => setBuilding(e.target.value)}>
              <option value="all">All buildings</option>
              {buildings.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--leaf)" }}>Bedrooms</label>
            <select className={selectCls} style={selectStyle} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
              {bedroomOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--leaf)" }}>Price from</label>
            <select className={selectCls} style={selectStyle} value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)}>
              <option value="any">Any</option>
              {priceTiers.map((p) => <option key={p} value={p}>{fmtPrice(p, status)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--leaf)" }}>Price to</label>
            <select className={selectCls} style={selectStyle} value={priceTo} onChange={(e) => setPriceTo(e.target.value)}>
              <option value="any">Any</option>
              {priceTiers.map((p) => <option key={p} value={p}>{fmtPrice(p, status)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--leaf)" }}>Sort by</label>
            <select className={selectCls} style={selectStyle} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <p className="text-sm font-semibold mb-6" style={{ color: "var(--forest)" }}>{results.length} {results.length === 1 ? "home" : "homes"} available</p>
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

      {/* Enquire CTA */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pb-20">
        <div className="rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6" style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Can't find the right home?</h2>
            <p className="text-white/80 max-w-xl">Speak to the Maidenhead Residential team and we'll help you find the perfect property.</p>
          </div>
          <Link to="/live/enquire" className="shrink-0 text-center px-7 py-3.5 rounded-full font-semibold transition-transform hover:scale-105" style={{ backgroundColor: "var(--sage)", color: "var(--forest)" }}>
            Enquire Now
          </Link>
        </div>
      </section>
    </div>
  );
}

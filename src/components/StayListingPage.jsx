import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { card, pill } from "../utils/design";
import { getHotels, getAccommodations } from "../api";
import useFetch from "../hooks/useFetch";
import useTapReveal from "../hooks/useTapReveal";
import CategoryFilterBar from "./CategoryFilterBar";
import Loading from "./ui/Loading";
import { featuredHotels, featuredAccommodations } from "../Data/featuredStay";
import { POSTCODE_COORDS, RADIUS_OPTIONS, milesBetween } from "../lib/postcodeDistance";

// ── Featured Hotels / Featured Accommodation — the same "In the Spotlight"
// hover-reveal card, alternating layout, and typography as the homepage's
// Featured Stories section (see FeatureBlocks.jsx), reused here so the two
// featured runs read as one consistent design language across the site. ──
function FeaturedStayCard({ item, basePath, tag, align }) {
  const reversed = align === "right";
  const { revealed, onImageClick } = useTapReveal();
  const to = `${basePath}/${item.slug}`;
  return (
    <div className={`flex flex-col ${reversed ? "md:flex-row-reverse" : "md:flex-row"} md:items-center gap-6 md:gap-12 w-full`}>
      <Link
        to={to}
        onClick={onImageClick}
        className={`spotlight-card group/img shrink-0 block w-full md:w-[30vw] ${revealed ? "is-revealed" : ""}`}
      >
        <div className="relative w-full overflow-hidden aspect-[6/4]" style={{ backgroundColor: "#1a1a1a" }}>
          <img src={item.image} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
          <img src={item.image} alt={item.name} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
        </div>
      </Link>

      <div className={`flex-1 min-w-0 px-6 md:px-0 ${reversed ? "md:text-right" : ""}`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.02em] mb-3" style={{ color: "var(--leaf)" }}>
          {tag}
        </p>
        <h3 className="text-2xl md:text-3xl leading-snug mb-4" style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "#000000" }}>
          {item.name}
        </h3>
        <p className="text-sm md:text-base leading-relaxed" style={{ color: "#000000" }}>
          {item.tagline}
        </p>
        <Link
          to={to}
          className={`group/more inline-flex items-center gap-1.5 text-sm font-semibold mt-5 ${reversed ? "md:flex-row-reverse" : ""}`}
          style={{ color: "#000000" }}
        >
          Read more
          <span className="transition-transform duration-200 group-hover/more:translate-x-1">→</span>
        </Link>
      </div>
    </div>
  );
}

function FeaturedStay({ kind, basePath }) {
  const isHotels = kind === "hotels";
  const items = isHotels ? featuredHotels : featuredAccommodations;
  if (items.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto mb-14 md:mb-20">
      <div className="mb-10 md:mb-12">
        <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>
          Handpicked
        </p>
        <h2 className="hero-title uppercase text-2xl md:text-4xl leading-tight" style={{ color: "#000000" }}>
          {isHotels ? "FEATURED HOTELS" : "FEATURED ACCOMMODATION"}
        </h2>
        <div className="mt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.14)" }} />
      </div>
      <div className="flex flex-col gap-y-12">
        {items.map((item, i) => (
          <FeaturedStayCard
            key={item.slug}
            item={item}
            basePath={basePath}
            tag={isHotels ? `${item.stars}-Star Hotel` : item.type}
            align={i % 2 === 1 ? "right" : "left"}
          />
        ))}
      </div>
    </section>
  );
}

const HERO_IMAGES = {
  hotels: "/images/live/hotels-hero.jpg",
  accommodation: "/images/live/accommodation-hero.jpg",
};

const LANDING = {
  hotels: {
    title: "Hotels in Maidenhead",
    intro: "Where to stay in and around the town centre, from budget chains to riverside hotels — every listing links to the hotel's own site for booking.",
  },
  accommodation: {
    title: "Accommodation in Maidenhead",
    intro: "Privately-owned homes and rooms to stay in around Maidenhead — example listings shown here; get in touch to arrange a real booking channel.",
  },
};

// One fixed colour per star rating, echoing CategoryPage's own
// CATEGORY_COLORS legend so hotel cards read as part of the same system.
const STAR_COLORS = { 5: "#c9962c", 4: "#c9962c", 3: "var(--leaf)", 2: "var(--leaf)", 1: "var(--leaf)" };
const TYPE_COLORS = {
  "entire-apartment": "#8b5cf6",
  "entire-cottage": "#22c55e",
  "entire-home": "#2563eb",
  "private-room": "#f59e0b",
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function ChevronIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function PinIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function StayListingPage({ kind }) {
  const isHotels = kind === "hotels";
  const basePath = isHotels ? "/live/stay/hotels" : "/live/stay/accommodation";
  const { data: hotels } = useFetch(getHotels, []);
  const { data: accommodations } = useFetch(getAccommodations, []);
  const allItems = isHotels ? hotels : accommodations;

  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || undefined;
  const [search, setSearch] = useState("");

  // Advanced search — postcode + radius, plus a set of multi-select
  // checkbox dropdowns (Facilities, Room facilities, and — accommodation
  // only — Meals, Travel group), and (hotels only) property rating. These
  // fields mirror a booking-site's filter sidebar; filtering here is done
  // client-side against the same data already loaded for the grid.
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState(RADIUS_OPTIONS[1]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [appliedLocation, setAppliedLocation] = useState(null); // { lat, lng, radius } | null
  const [checkboxFilters, setCheckboxFilters] = useState({}); // { [field]: Set<string> }
  const [openDropdown, setOpenDropdown] = useState(null); // field name currently open, or null
  const [starsFilter, setStarsFilter] = useState(() => new Set());
  const [starsOpen, setStarsOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    setSearch("");
    setPostcode("");
    setAppliedLocation(null);
    setCheckboxFilters({});
    setStarsFilter(new Set());
  }, [kind]);

  const landing = LANDING[kind];

  // Filter dropdowns shown, in order, for this listing kind — each backed
  // by a field on the hotel/accommodation data (Data/stay.js).
  const filterDefs = isHotels
    ? [
        { field: "facilities", label: "Facilities" },
        { field: "roomFacilities", label: "Room facilities" },
      ]
    : [
        { field: "facilities", label: "Facilities" },
        { field: "roomFacilities", label: "Room facilities" },
        { field: "meals", label: "Meals" },
        { field: "travelGroup", label: "Travel group" },
      ];

  // Categories — star rating for hotels, property type for accommodation —
  // each listing type's nearest equivalent to Eat & Drink's cuisine
  // categories, built from whatever values are actually present in the data.
  const categories = (() => {
    if (!allItems) return [];
    if (isHotels) {
      const stars = [...new Set(allItems.map((h) => h.stars))].sort((a, b) => b - a);
      return stars.map((s) => ({ value: String(s), label: `${s}-Star` }));
    }
    const types = [...new Set(allItems.map((a) => a.type))];
    return types.map((t) => ({ value: slugify(t), label: t }));
  })();

  // Options for each checkbox dropdown, built from whatever values are
  // actually present in the currently-loaded hotels/accommodation data.
  const filterOptions = useMemo(() => {
    const out = {};
    filterDefs.forEach(({ field }) => {
      const set = new Set();
      (allItems ?? []).forEach((i) => (i[field] ?? []).forEach((v) => set.add(v)));
      out[field] = [...set].sort();
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, kind]);

  let items = allItems ?? [];
  if (activeCategory) {
    items = isHotels
      ? items.filter((h) => String(h.stars) === activeCategory)
      : items.filter((a) => slugify(a.type) === activeCategory);
  }
  const trimmedSearch = search.trim().toLowerCase();
  if (trimmedSearch) {
    items = items.filter((i) => i.name.toLowerCase().includes(trimmedSearch));
  }
  if (isHotels && starsFilter.size > 0) {
    items = items.filter((i) => starsFilter.has(i.stars));
  }
  filterDefs.forEach(({ field }) => {
    const set = checkboxFilters[field];
    if (set && set.size > 0) {
      items = items.filter((i) => [...set].every((v) => i[field]?.includes(v)));
    }
  });
  if (appliedLocation) {
    items = items.filter(
      (i) => typeof i.lat === "number" && milesBetween(i.lat, i.lng, appliedLocation.lat, appliedLocation.lng) <= appliedLocation.radius
    );
  }

  const title = activeCategory
    ? categories.find((c) => c.value === activeCategory)?.label ?? landing.title
    : landing.title;

  const outwardCode = postcode.trim().toUpperCase().split(/\s+/)[0];
  const matchedCoords = POSTCODE_COORDS[outwardCode];

  const applyLocation = () => {
    if (!matchedCoords) return;
    setAppliedLocation({ ...matchedCoords, radius });
    setLocationOpen(false);
  };
  const clearLocation = () => {
    setPostcode("");
    setAppliedLocation(null);
    setLocationOpen(false);
  };

  const toggleFromSet = (setter) => (value) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };
  const toggleStar = toggleFromSet(setStarsFilter);
  const toggleCheckbox = (field) => (value) => {
    setCheckboxFilters((prev) => {
      const next = new Set(prev[field]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [field]: next };
    });
  };
  const clearCheckboxField = (field) => setCheckboxFilters((prev) => ({ ...prev, [field]: new Set() }));

  const checkboxFilterCount = filterDefs.reduce((n, { field }) => n + (checkboxFilters[field]?.size ?? 0), 0);
  const activeFilterCount = checkboxFilterCount + starsFilter.size + (appliedLocation ? 1 : 0);

  return (
    <div>
      {/* ── Hero banner — same treatment as Eat & Drink's: full-bleed photo,
          no darkening overlay, header floats transparent over it. ── */}
      <section className="relative w-full overflow-hidden h-[70vh] min-h-[520px]">
        <img src={HERO_IMAGES[kind]} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", objectPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.15) 0%, rgba(20,33,42,0.1) 40%, rgba(20,33,42,0.72) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-12">
          <h1 className="hero-title uppercase text-white text-4xl md:text-6xl lg:text-7xl max-w-3xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
            {title}
          </h1>
        </div>
      </section>

      {/* ── Intro + content ── */}
      <section className="py-14 md:py-20 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="transition-colors hover:opacity-70" style={{ color: "#000000" }}>Home</Link>
            <span className="mx-2 opacity-40" style={{ color: "#000000" }}>/</span>
            <Link to="/live" className="transition-colors hover:opacity-70" style={{ color: "#000000" }}>Live &amp; Stay</Link>
            <span className="mx-2 opacity-40" style={{ color: "#000000" }}>/</span>
            <Link to={basePath} className="transition-colors hover:opacity-70" style={{ color: "#000000" }}>{landing.title}</Link>
            {activeCategory && (
              <>
                <span className="mx-2 opacity-40" style={{ color: "#000000" }}>/</span>
                <span style={{ color: "#000000" }}>{title}</span>
              </>
            )}
          </nav>

          <p
            className="text-right mb-10 md:mb-16 text-2xl md:text-[2.5rem] max-w-3xl ml-auto"
            style={{
              color: "#000000",
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 400,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            {landing.intro}
          </p>
        </div>

        {/* Featured Hotels / Featured Accommodation — same width as the rest
            of the page, not full-bleed. */}
        <FeaturedStay kind={kind} basePath={basePath} />

        <div className="max-w-6xl mx-auto">
          {/* Advanced search — location/postcode + radius, amenities, and
              (hotels only) star rating. Sits above the name-search +
              category chip bar shared with every other listing page. */}
          <div className="relative flex flex-wrap items-center gap-2.5 mb-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setLocationOpen((o) => !o); setOpenDropdown(null); setStarsOpen(false); }}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-full border cursor-pointer transition-colors hover:bg-black/[0.03]"
                style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000", backgroundColor: appliedLocation ? "var(--sand)" : "#fff" }}
              >
                <PinIcon />
                {appliedLocation ? `Within ${appliedLocation.radius} mi of ${outwardCode}` : "Near a postcode"}
                <ChevronIcon />
              </button>
              {locationOpen && (
                <div className="absolute z-20 top-full mt-2 left-0 bg-white rounded-2xl p-4 shadow-xl flex flex-col gap-3 w-72" style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}>
                  <label className="text-xs font-semibold flex flex-col gap-1" style={{ color: "#000000" }}>
                    Postcode
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="e.g. SL6 1QJ"
                      className="text-sm rounded-lg px-3 py-2 outline-none border"
                      style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000" }}
                    />
                  </label>
                  <label className="text-xs font-semibold flex flex-col gap-1" style={{ color: "#000000" }}>
                    Radius
                    <select
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="text-sm rounded-lg px-3 py-2 outline-none border bg-white"
                      style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000" }}
                    >
                      {RADIUS_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r} mile{r > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </label>
                  {postcode.trim() && !matchedCoords && (
                    <p className="text-xs" style={{ color: "#C0392B" }}>Postcode area not recognised — try SL6, SL4, SL1, SL7, SL8 or RG9.</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <button type="button" onClick={applyLocation} disabled={!matchedCoords} className="text-sm font-semibold px-4 py-2 rounded-full text-white disabled:opacity-40" style={{ backgroundColor: "var(--leaf)" }}>
                      Apply
                    </button>
                    {appliedLocation && (
                      <button type="button" onClick={clearLocation} className="text-xs font-semibold underline" style={{ color: "#000000" }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {filterDefs.map(({ field, label }) => {
              const selected = checkboxFilters[field] ?? new Set();
              const options = filterOptions[field] ?? [];
              if (options.length === 0) return null;
              return (
                <div className="relative" key={field}>
                  <button
                    type="button"
                    onClick={() => { setOpenDropdown((o) => (o === field ? null : field)); setLocationOpen(false); setStarsOpen(false); }}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-full border cursor-pointer transition-colors hover:bg-black/[0.03]"
                    style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000", backgroundColor: selected.size > 0 ? "var(--sand)" : "#fff" }}
                  >
                    {label}{selected.size > 0 ? ` (${selected.size})` : ""}
                    <ChevronIcon />
                  </button>
                  {openDropdown === field && (
                    <div className="absolute z-20 top-full mt-2 left-0 bg-white rounded-2xl p-2 shadow-xl w-72 max-h-80 overflow-y-auto flex flex-col gap-0.5" style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}>
                      {options.map((o) => (
                        <label key={o} className="flex items-center gap-2.5 text-sm px-2.5 py-2 rounded-lg hover:bg-black/5 cursor-pointer" style={{ color: "#000000" }}>
                          <input type="checkbox" checked={selected.has(o)} onChange={() => toggleCheckbox(field)(o)} className="accent-[var(--leaf)]" />
                          {o}
                        </label>
                      ))}
                      {selected.size > 0 && (
                        <button type="button" onClick={() => clearCheckboxField(field)} className="text-xs font-semibold underline mt-1 mx-2.5 self-start" style={{ color: "#000000" }}>
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isHotels && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setStarsOpen((o) => !o); setLocationOpen(false); setOpenDropdown(null); }}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-full border cursor-pointer transition-colors hover:bg-black/[0.03]"
                  style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000", backgroundColor: starsFilter.size > 0 ? "var(--sand)" : "#fff" }}
                >
                  Property rating{starsFilter.size > 0 ? ` (${starsFilter.size})` : ""}
                  <ChevronIcon />
                </button>
                {starsOpen && (
                  <div className="absolute z-20 top-full mt-2 left-0 bg-white rounded-2xl p-2 shadow-xl w-48 flex flex-col gap-0.5" style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}>
                    {[5, 4, 3, 2, 1].map((s) => (
                      <label key={s} className="flex items-center gap-2.5 text-sm px-2.5 py-2 rounded-lg hover:bg-black/5 cursor-pointer" style={{ color: "#000000" }}>
                        <input type="checkbox" checked={starsFilter.has(s)} onChange={() => toggleStar(s)} className="accent-[var(--leaf)]" />
                        <span style={{ color: "#c9962c" }}>{"★".repeat(s)}</span>
                      </label>
                    ))}
                    {starsFilter.size > 0 && (
                      <button type="button" onClick={() => setStarsFilter(new Set())} className="text-xs font-semibold underline mt-1 mx-2.5 self-start" style={{ color: "#000000" }}>
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { clearLocation(); setCheckboxFilters({}); setStarsFilter(new Set()); }}
                className="text-xs font-semibold underline"
                style={{ color: "#000000" }}
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Category filter — same icon row + "More"/bottom-sheet component
              as every other listing page: name search plus star rating
              (hotels) or property type (accommodation). */}
          {categories.length > 1 && (
            <CategoryFilterBar
              basePath={basePath}
              activeCategory={activeCategory}
              categories={categories}
              search={search}
              onSearchChange={setSearch}
            />
          )}

          {/* Card grid */}
          {!allItems ? (
            <Loading minHeight="30vh" />
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {items.map((it) => {
                const tag = isHotels ? `${it.stars}-Star Hotel` : it.type;
                const tagColor = isHotels ? STAR_COLORS[it.stars] : (TYPE_COLORS[slugify(it.type)] ?? "var(--leaf)");
                const address = isHotels ? it.address : it.area;
                return (
                  <Link
                    key={it.slug}
                    to={`${basePath}/${it.slug}`}
                    className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                    style={{ borderRadius: "0px", boxShadow: card.shadow }}
                  >
                    <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden">
                      <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-0.5 p-2.5 sm:p-2.5">
                      <span
                        className={`${pill.className} !text-[9px] sm:!text-[9px] !px-2 sm:!px-2 !py-0.5 sm:!py-0.5`}
                        style={{ color: "#000000", backgroundColor: "#ffffff", boxShadow: "0 1px 4px rgba(13,42,51,0.12)", alignSelf: "flex-start" }}
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
                        {tag}
                      </span>
                      <h3 className="listing-card-title text-xs sm:text-sm leading-snug sm:leading-tight line-clamp-2 sm:line-clamp-1" style={{ color: "#000000", fontFamily: "var(--font-heading)" }}>
                        {it.name}
                      </h3>
                      {address && (
                        <span className="inline-flex items-center gap-1 sm:gap-1 text-[10px] sm:text-[11px]" style={{ color: "#000000" }}>
                          <PinIcon size={11} />
                          <span className="line-clamp-1">{address}</span>
                        </span>
                      )}
                      <div className="hidden sm:block">
                        <p className="text-[11px] leading-snug line-clamp-1" style={{ color: "#000000" }}>
                          {it.tagline}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 sm:gap-1 text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-0.5" style={{ color: "#000000" }}>
                        Read more
                        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-12 text-sm" style={{ color: "#000000" }}>
              {trimmedSearch
                ? `No results for "${search.trim()}" — try a different name.`
                : "No listings match these filters — try clearing one and searching again."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

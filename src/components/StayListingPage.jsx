import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { card, pill } from "../utils/design";
import { getHotels, getAccommodations } from "../api";
import useFetch from "../hooks/useFetch";
import CategoryFilterBar from "./CategoryFilterBar";
import Loading from "./ui/Loading";

const HERO_IMAGE = "/images/live/ext-hero.jpg";

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

export default function StayListingPage({ kind }) {
  const isHotels = kind === "hotels";
  const basePath = isHotels ? "/live/stay/hotels" : "/live/stay/accommodation";
  const { data: hotels } = useFetch(getHotels, []);
  const { data: accommodations } = useFetch(getAccommodations, []);
  const allItems = isHotels ? hotels : accommodations;

  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || undefined;
  const [search, setSearch] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => setSearch(""), [kind]);

  const landing = LANDING[kind];

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

  const title = activeCategory
    ? categories.find((c) => c.value === activeCategory)?.label ?? landing.title
    : landing.title;

  return (
    <div>
      {/* ── Hero banner — same treatment as Eat & Drink's: full-bleed photo,
          no darkening overlay, header floats transparent over it. ── */}
      <section className="relative w-full overflow-hidden h-[70vh] min-h-[520px]">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", objectPosition: "center" }} />
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

          {/* Category filter — same icon row + "More"/bottom-sheet component
              as every other listing page, filtering by star rating (hotels)
              or property type (accommodation). */}
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
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                          </svg>
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
                : "Nothing listed here just yet — check back soon."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

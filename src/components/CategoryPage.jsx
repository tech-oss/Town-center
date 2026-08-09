import { useRef, useLayoutEffect } from "react";
import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
import { card, pill } from "../utils/design";
import { sections, categoryTitles } from "../Data/pages";
import { getBusinesses, getEvents } from "../api";
import useFetch from "../hooks/useFetch";

// Colour key for the See & Do category dots — one fixed colour per category,
// reused everywhere a category is shown so it reads as a consistent legend.
const CATEGORY_COLORS = {
  "art-culture": "#8b5cf6",
  community: "#f59e0b",
  family: "#ec4899",
  "fashion-beauty": "#e11d48",
  film: "#1c2e38",
  gaming: "#6366f1",
  learning: "#2563eb",
  "sport-wellness": "#22c55e",
};

// What's On events carry their own category system (Music, Family, Market,
// Festive, Theatre, Sport, Community) — map each onto the nearest See & Do
// category so every card, event or otherwise, uses the same consistent set.
const EVENT_CATEGORY_MAP = {
  Music: "art-culture",
  Theatre: "art-culture",
  Family: "family",
  Market: "community",
  Festive: "community",
  Community: "community",
  Sport: "sport-wellness",
};

// The real What's On events surfaced as See & Do cards that link to the shared
// /event/:slug detail page — keeps one source of truth.
const toEventCard = (e) => {
  const category = EVENT_CATEGORY_MAP[e.category] ?? "community";
  return {
    slug: e.slug,
    name: e.title,
    tag: categoryTitles[category],
    section: "see-do",
    category,
    image: e.image,
    date: e.date,
    address: e.location,
    description: e.excerpt,
    to: `/event/${e.slug}`,
  };
};

export default function CategoryPage() {
  const { section } = useParams();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || undefined;
  const sec = sections[section];

  // `sections` provides the page config (hero, columns, chips); the listed
  // items come from the businesses resource, events from the events resource.
  const { data: sectionItems } = useFetch(() => getBusinesses({ section }), [section]);
  const { data: whatsOnEvents } = useFetch(getEvents, []);

  // When the user switches filter, scroll the chip row to a consistent spot
  // just under the header. Because the page height differs between views (the
  // events calendar only shows on the "All" landing), preserving the raw scroll
  // offset would land you in a different place each time — so we re-anchor.
  // Skips the first render so navigating *into* the page still lands at the top
  // (handled by <ScrollToTop>).
  const chipsRef = useRef(null);
  const firstRun = useRef(true);
  useLayoutEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const el = chipsRef.current;
    if (!el) return;
    const headerH = document.querySelector("header")?.offsetHeight ?? 0;
    const y = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
    window.scrollTo(0, Math.max(0, y));
  }, [category]);

  if (!sec) return <Navigate to="/" replace />;

  const baseItems = sectionItems ?? [];
  const eventCards = (whatsOnEvents ?? []).map(toEventCard);

  // An item appears under its primary `category` plus any extra `categories`.
  let items = category
    ? baseItems.filter((i) => i.category === category || i.categories?.includes(category))
    : baseItems;

  // See & Do: real What's On events are folded in alongside activities, each
  // tagged with its mapped category so every listing — event or otherwise —
  // filters consistently. All See & Do cards link to the shared /event/:slug
  // detail page so every listing uses the same layout.
  if (section === "see-do") {
    const activities = baseItems.map((i) => ({ ...i, to: `/event/${i.slug}` }));
    const allSeeDo = [...eventCards, ...activities];
    items = category ? allSeeDo.filter((i) => i.category === category) : allSeeDo;
  }
  const isCategory = Boolean(category);
  const title = isCategory ? categoryTitles[category] ?? sec.label : sec.landing.title;
  const intro = isCategory
    ? `Browse ${categoryTitles[category]?.toLowerCase() ?? "places"} across Maidenhead town centre.`
    : sec.landing.intro;

  const catHero = category && sec.categoryHeroes?.[category];
  const heroSrc = (typeof catHero === "object" ? catHero.src : catHero) || sec.landing.hero;
  const heroFit = typeof catHero === "object" ? catHero.fit : "cover";
  const heroBg  = typeof catHero === "object" ? catHero.bg  : undefined;

  return (
    <div>
      {/* ── Hero banner ── */}
      <section className="relative h-[42vh] min-h-[300px] w-full overflow-hidden" style={heroBg ? { backgroundColor: heroBg } : undefined}>
        <img src={heroSrc} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: heroFit }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.35) 0%, rgba(28,46,56,0.78) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-12">
          {/* Breadcrumb */}
          <nav className="mb-4 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--mint)" }}>
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to={sec.path} className="hover:text-white transition-colors">{sec.label}</Link>
            {isCategory && (
              <>
                <span className="mx-2 opacity-50">/</span>
                <span className="text-white">{title}</span>
              </>
            )}
          </nav>
          <h1 className="hero-title uppercase text-white text-4xl md:text-6xl lg:text-7xl max-w-3xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
            {title}
          </h1>
        </div>
      </section>

      {/* ── Intro + content ── */}
      <section className="py-14 md:py-20 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          {section === "see-do" && !isCategory ? (
            <p
              className="text-right mb-12 md:mb-16 text-2xl md:text-[2.5rem] max-w-3xl ml-auto"
              style={{
                color: "#000000",
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 400,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              }}
            >
              {intro}
            </p>
          ) : (
            <p className="text-base md:text-lg leading-relaxed max-w-3xl mb-10" style={{ color: "#000000" }}>
              {intro}
            </p>
          )}

          {/* Category filter chips */}
          <div className="flex items-center gap-4 mb-10">
            <div ref={chipsRef} className="flex flex-1 min-w-0 gap-2.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
              <FilterChip to={sec.path} active={!isCategory} label="All" />
              {(() => {
                const seen = new Set();
                return sec.columns
                  .flatMap((c) => c.links)
                  .filter((l) => l.to.includes("?category=") && !seen.has(l.to) && seen.add(l.to))
                  .map((l) => {
                    const cat = l.to.split("?category=")[1];
                    return <FilterChip key={l.to} to={l.to} active={category === cat} label={l.label} />;
                  });
              })()}
            </div>
            {section === "see-do" && (
              <Link
                to="/whats-on"
                className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap transition-opacity duration-150 hover:opacity-70"
                style={{ color: "#000000" }}
              >
                View full calendar
                <span>→</span>
              </Link>
            )}
          </div>

          {/* Card grid */}
          {items.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((it) => {
                const radius = section === "see-do" ? "0px" : card.radius;
                return (
                <Link
                  key={it.slug}
                  to={it.to ?? `/${it.section}/place/${it.slug}`}
                  className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                  style={{ borderRadius: radius, boxShadow: card.shadow }}
                >
                  <div
                    className="relative aspect-[4/3] overflow-hidden"
                    style={{ borderRadius: `${radius} ${radius} 0 0`, backgroundColor: it.logo ? "var(--mint)" : undefined }}
                  >
                    {it.logo ? (
                      <img src={it.logo} alt={it.name} loading="lazy" className="w-full h-full object-contain p-10 transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-5">
                    {it.tag && (
                      <span
                        className={pill.className}
                        style={{ color: "#000000", backgroundColor: "#ffffff", boxShadow: "0 1px 4px rgba(13,42,51,0.12)", alignSelf: "flex-start" }}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[it.category] ?? "var(--leaf)" }}
                        />
                        {it.tag}
                      </span>
                    )}
                    <h3 className="font-bold text-lg leading-snug" style={{ color: "#000000", fontFamily: "var(--font-heading)" }}>
                      {it.name}
                    </h3>
                    {it.date && (
                      <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "#000000" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        <span className="line-clamp-1">{it.date}</span>
                      </span>
                    )}
                    {it.address && (
                      <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "#000000" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="line-clamp-1">{it.address}</span>
                      </span>
                    )}
                    {!it.hideDescription && (it.paragraphs?.[0] || it.description) && (
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#000000" }}>
                        {it.paragraphs?.[0] || it.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-1" style={{ color: "#000000" }}>
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
              Nothing listed here just yet — check back soon.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterChip({ to, active, label }) {
  return (
    <Link
      to={to}
      replace
      className="shrink-0 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.07em] transition-all duration-200 whitespace-nowrap"
      style={active
        ? { backgroundColor: "var(--forest)", color: "#fff", boxShadow: "0 2px 8px rgba(13,42,51,0.18)" }
        : { backgroundColor: "#fff", color: "#000000", boxShadow: "0 1px 4px rgba(13,42,51,0.07)" }}
    >
      {label}
    </Link>
  );
}

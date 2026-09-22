import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
import { card } from "../utils/design";
import { sections, categoryTitles } from "../Data/pages";
import { listingCategory, placeLink } from "../lib/viewedCategory";
import ListingCard from "./ListingCard";
import { resolveCategory } from "../Data/taxonomy";
import { getBusinesses, getEvents } from "../api";
import useFetch from "../hooks/useFetch";
import CategoryFilterBar from "./CategoryFilterBar";
import { toSeeDoSlug, toSeeDoSlugs } from "../lib/eventCategories";


// The real What's On events surfaced as See & Do cards that link to the shared
// /event/:slug detail page — keeps one source of truth.
const toEventCard = (e) => {
  const category = toSeeDoSlug(e.category);
  return {
    categories: toSeeDoSlugs(e.categories),
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
  // Two routes render this component: the generic "/:section" listing, and
  // "/services/:group" — a dedicated, category-scoped listing for one of
  // Services' three columns (Tradespeople / Professionals / Freelancers),
  // so "See All Tradespeople" etc. no longer land on the same combined list.
  const { section: routeSection, group } = useParams();
  const section = routeSection || (group ? "services" : undefined);
  const [searchParams] = useSearchParams();
  // Resolved through the taxonomy's alias map so links saved or shared before
  // the category rename still land on the right filter instead of an empty page.
  const category = searchParams.get("category") ? resolveCategory(searchParams.get("category")) : undefined;
  const sec = sections[section];
  const groupConfig = group ? sec?.groups?.find((g) => g.key === group) : null;
  const [search, setSearch] = useState("");
  // Clear a typed search when the user switches to a different listing
  // section, so it doesn't silently keep filtering the new page's items.
  useEffect(() => setSearch(""), [section, group]);

  // `sections` provides the page config (hero, columns, chips); the listed
  // items come from the businesses resource, events from the events resource.
  const { data: sectionItems } = useFetch(() => getBusinesses({ section }), [section]);
  const { data: whatsOnEvents } = useFetch(getEvents, []);

  if (!sec) return <Navigate to="/" replace />;
  if (group && !groupConfig) return <Navigate to={sec.path} replace />;

  // The column of the group's own filter chips (e.g. just Builders/
  // Electricians/.../Cleaners for Tradespeople), used both to build the
  // chip list below and to restrict the item pool to that group.
  const groupColumn = groupConfig && sec.columns.find((c) => c.heading === groupConfig.heading);
  const groupCategoryValues = groupColumn
    ? new Set(groupColumn.links.filter((l) => l.to.includes("?category=")).map((l) => l.to.split("?category=")[1]))
    : null;

  // A group page takes the businesses assigned to it (by the kind they chose
  // at signup) plus anything filed under one of its categories — the same
  // rule as the app, so the two list the same businesses.
  const baseItems = groupCategoryValues
    ? (sectionItems ?? []).filter((i) =>
        i.serviceGroup === group || groupCategoryValues.has(i.category) || i.categories?.some((c) => groupCategoryValues.has(c)))
    : sectionItems ?? [];
  const eventCards = (whatsOnEvents ?? []).map(toEventCard);

  // An item appears under its primary `category` plus any extra `categories`.
  // Under a filter, each card is labelled and linked with the category being
  // browsed, so the detail page's breadcrumb matches where the visitor came from.
  let items = category
    ? baseItems
        .filter((i) => i.category === category || i.categories?.includes(category))
        .map((i) => ({ ...i, tag: listingCategory(i, category).label, to: placeLink(i, category) }))
    : baseItems;

  // See & Do: real What's On events are folded in alongside activities, each
  // tagged with its mapped category so every listing — event or otherwise —
  // filters consistently. All See & Do cards link to the shared /event/:slug
  // detail page so every listing uses the same layout.
  if (section === "see-do") {
    const activities = baseItems.map((i) => ({ ...i, to: `/event/${i.slug}` }));
    // Featured businesses lead, then events, then the rest.
    const allSeeDo = [
      ...activities.filter((i) => i.featured),
      ...eventCards,
      ...activities.filter((i) => !i.featured),
    ];
    // An event or business shows under each of its categories; under a
    // filter its card and link carry the category being browsed.
    items = category
      ? allSeeDo
          .filter((i) => i.category === category || i.categories?.includes(category))
          .map((i) => ({
            ...i,
            tag: categoryTitles[category] ?? i.tag,
            to: `${i.to ?? `/event/${i.slug}`}?category=${encodeURIComponent(category)}`,
          }))
      : allSeeDo;
  }

  // Search-by-name, applied on top of whichever category is active.
  const trimmedSearch = search.trim().toLowerCase();
  if (trimmedSearch) {
    items = items.filter((i) => i.name.toLowerCase().includes(trimmedSearch));
  }

  const isCategory = Boolean(category);
  const title = isCategory ? categoryTitles[category] ?? sec.label : groupConfig?.label ?? sec.landing.title;
  // The intro line stays constant regardless of which category is selected,
  // rather than swapping in a per-category sentence — that kept the text
  // (and the category bar underneath it) shifting every time the user
  // browsed between categories.
  const intro = groupConfig?.intro ?? sec.landing.intro;

  // Grouped pages (e.g. /services/tradespeople) only offer that group's own
  // chips — not every category across all of Services.
  const categories = (() => {
    const seen = new Set();
    const links = groupColumn ? groupColumn.links : sec.columns.flatMap((c) => c.links);
    return links
      .filter((l) => l.to.includes("?category=") && !seen.has(l.to) && seen.add(l.to))
      .map((l) => ({ value: l.to.split("?category=")[1], label: l.label }));
  })();

  // Category chip links need to stay within the grouped URL (e.g.
  // /services/tradespeople?category=builders), not the plain section path.
  const basePath = groupConfig ? `/services/${group}` : sec.path;

  const catHero = category && sec.categoryHeroes?.[category];
  const heroSrc = (typeof catHero === "object" ? catHero.src : catHero) || sec.landing.hero;
  const heroFit = typeof catHero === "object" ? catHero.fit : "cover";
  const heroBg  = typeof catHero === "object" ? catHero.bg  : undefined;
  // A separate desktop hero image, only set up for the Shop/Eat & Drink/
  // Services landing pages so far — falls back to the single `heroSrc`
  // everywhere else.
  const heroDesktopSrc = !isCategory && sec.landing.heroDesktop;
  // Services' desktop photo has its subject (a tradesperson up a ladder)
  // near the top of the frame — cover-cropping from dead center at wide
  // viewports (container aspect ~2:1 vs. the photo's own ~1.8:1) sliced
  // straight through it, so bias the crop toward the top instead.
  const heroDesktopPosition = section === "services" ? "center 20%" : "center";

  return (
    <div>
      {/* ── Hero banner ──
          The header floats transparent over this hero (like the homepage),
          so it needs to be tall enough to sit fully behind the header
          instead of leaving a gap of page background above it. */}
      <section
        className="relative w-full overflow-hidden h-[70vh] min-h-[520px]"
        style={heroBg ? { backgroundColor: heroBg } : undefined}
      >
        {heroDesktopSrc ? (
          <>
            <img src={heroSrc} alt="" className="absolute inset-0 w-full h-full md:hidden" style={{ objectFit: heroFit, objectPosition: "center" }} />
            <img src={heroDesktopSrc} alt="" className="absolute inset-0 w-full h-full hidden md:block" style={{ objectFit: heroFit, objectPosition: heroDesktopPosition }} />
          </>
        ) : (
          <img src={heroSrc} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: heroFit, objectPosition: "center" }} />
        )}
        {/* Eat & Drink, Shop and Services show the hero photo with no
            darkening overlay, at the user's request — See & Do keeps the
            gradient so the white title stays readable over it. */}
        {!["eat-drink", "shop", "services"].includes(section) && (
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.35) 0%, rgba(28,46,56,0.78) 100%)" }} />
        )}
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
            <Link to={sec.path} className="transition-colors hover:opacity-70" style={{ color: "#000000" }}>{sec.label}</Link>
            {groupConfig && (
              <>
                <span className="mx-2 opacity-40" style={{ color: "#000000" }}>/</span>
                {isCategory ? (
                  <Link to={basePath} className="transition-colors hover:opacity-70" style={{ color: "#000000" }}>{groupConfig.label}</Link>
                ) : (
                  <span style={{ color: "#000000" }}>{groupConfig.label}</span>
                )}
              </>
            )}
            {isCategory && (
              <>
                <span className="mx-2 opacity-40" style={{ color: "#000000" }}>/</span>
                <span style={{ color: "#000000" }}>{title}</span>
              </>
            )}
          </nav>
          {["see-do", "eat-drink", "shop", "services"].includes(section) ? (
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
              {intro}
            </p>
          ) : (
            <p className="text-base md:text-lg leading-relaxed max-w-3xl mb-10" style={{ color: "#000000" }}>
              {intro}
            </p>
          )}

          {/* Category filter — icon row + "More" dropdown on desktop, a
              "Browse Categories" bottom sheet on mobile. */}
          <CategoryFilterBar
            basePath={basePath}
            activeCategory={category}
            categories={categories}
            search={search}
            onSearchChange={setSearch}
            extra={section === "see-do" && (
              <Link
                to="/whats-on"
                className="shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-opacity duration-150 hover:opacity-70"
                style={{ color: "#000000" }}
              >
                View full calendar
                <span>→</span>
              </Link>
            )}
          />

          {/* Card grid */}
          {items.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {items.map((it) => (
                <ListingCard
                  key={it.slug}
                  item={it}
                  to={it.to ?? `/${it.section}/place/${it.slug}`}
                  radius={["see-do", "eat-drink", "shop", "services"].includes(section) ? "0px" : card.radius}
                />
              ))}
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

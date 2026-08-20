import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { getStories, getArticles } from "../api";
import { blogCards } from "../Data/content";
import { sections } from "../Data/pages";
import useFetch from "../hooks/useFetch";
import AppBadges from "./AppBadges";
import { card, pill } from "../utils/design";

// The site's own section list (Shop / Eat & Drink / See & Do / Services),
// reused here so "business type" means the exact same thing it does
// everywhere else on the site.
const BUSINESS_TYPES = [
  ...Object.values(sections).map((s) => ({ key: s.key, label: s.label })),
  { key: "stay", label: "Hotels & Stay" },
];

// Slugs currently live on the homepage's "In the Spotlight" cards, so the
// same "On Homepage" badge used for Featured Stories can be applied here too.
const homepageSpotlightSlugs = new Set(
  blogCards.posts.filter((p) => p.homepage).map((p) => p.href.split("/").pop())
);

// One colour per tag, echoing the dot-colour treatment CategoryPage uses for
// its own category pills, so this listing reads as the same design system.
const TYPE_COLORS = {
  Featured: "var(--forest)",
  Offer: "#F5A623",
  News: "var(--leaf)",
  "What's On": "var(--teal-deep)",
};
const TYPE_ORDER = ["Featured", "Offer", "News", "What's On"];

function HomepageBadge() {
  return (
    <span
      className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-[0.02em] px-2 py-0.5 rounded-full"
      style={{ backgroundColor: "var(--forest)", color: "#fff" }}
    >
      On Homepage
    </span>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="10" cy="10" r="7" /><path d="M21 21l-5.5-5.5" />
    </svg>
  );
}

// Search-by-name field, matching CategoryFilterBar's own SearchInput pill
// (same shadow/radius/padding) so the two listing experiences feel identical.
function SearchInput({ value, onChange, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(28,46,56,0.4)" }}>
        <SearchIcon />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or business"
        aria-label="Search offers and stories"
        className="w-full pl-11 pr-9 py-2.5 sm:py-3 rounded-full text-sm bg-white focus:outline-none"
        style={{ boxShadow: "0 2px 14px -6px rgba(28,46,56,0.22), 0 0 0 1px rgba(28,46,56,0.06)", color: "#000000" }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
          style={{ backgroundColor: "rgba(28,46,56,0.08)", color: "#000000" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

function RadioDot({ active }) {
  return (
    <span
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style={{ border: `2px solid ${active ? "var(--leaf)" : "rgba(28,46,56,0.25)"}` }}
    >
      {active && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--leaf)" }} />}
    </span>
  );
}

// Type filter — desktop: one continuous white pill-shaped bar with
// divider-separated chips (All, then one per tag), matching
// CategoryFilterBar's desktop bar exactly (same bg/shadow/radius/divider
// treatment used on See & Do, Eat & Drink, Shop and Services). Mobile: a
// "Browse Types" button that opens the same bottom-sheet pattern
// CategoryFilterBar uses, rather than a horizontally scrolling bar — state-
// driven instead of route-driven since this listing spans multiple article
// types instead of one section's categories.
function TypeFilterBar({ types, active, onChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = active ?? "Browse Types";

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Desktop ── */}
      <div
        className="hidden sm:inline-flex items-center flex-nowrap bg-white rounded-full pl-1.5 pr-2 py-1.5"
        style={{ boxShadow: "0 2px 14px -6px rgba(28,46,56,0.22), 0 0 0 1px rgba(28,46,56,0.06)" }}
      >
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors shrink-0"
          style={!active ? { backgroundColor: "var(--forest)", color: "#fff" } : { backgroundColor: "transparent", color: "#000000" }}
        >
          All
        </button>
        {types.map((t) => {
          const isActive = active === t;
          return (
            <div key={t} className="flex items-center shrink-0">
              <span className="w-px h-6 mx-0.5 lg:mx-1.5 shrink-0" style={{ backgroundColor: "rgba(28,46,56,0.12)" }} />
              <button
                type="button"
                onClick={() => onChange(t)}
                className="inline-flex items-center gap-2 px-2.5 lg:px-3.5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors hover:opacity-70 shrink-0"
                style={isActive ? { backgroundColor: "var(--forest)", color: "#fff" } : { backgroundColor: "transparent", color: "#000000" }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: isActive ? "#fff" : (TYPE_COLORS[t] ?? "var(--leaf)") }} />
                {t}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Mobile: button opening a bottom sheet, same pattern as
          CategoryFilterBar's "Browse Categories" ── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="sm:hidden inline-flex items-center gap-2.5 pl-5 pr-4 py-3 rounded-full text-sm font-semibold transition-opacity shrink-0"
        style={{ backgroundColor: "var(--forest)", color: "#fff" }}
      >
        {activeLabel}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="7" x2="20" y2="7" /><circle cx="15" cy="7" r="2" fill="#fff" stroke="none" />
          <line x1="4" y1="17" x2="20" y2="17" /><circle cx="9" cy="17" r="2" fill="#fff" stroke="none" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl pt-5 pb-6 max-h-[80vh] overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "#000000" }}>Types</h3>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: "var(--forest)" }}
              >✕</button>
            </div>

            <button
              type="button"
              onClick={() => { onChange(null); setMobileOpen(false); }}
              className="flex items-center justify-between gap-3 w-full px-6 py-3.5 border-t"
              style={{ borderColor: "rgba(28,46,56,0.08)" }}
            >
              <span className="flex items-center gap-3 text-[15px]" style={{ color: "#000000" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--forest)" }} /> All
              </span>
              <RadioDot active={!active} />
            </button>

            {types.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => { onChange(t); setMobileOpen(false); }}
                className="flex items-center justify-between gap-3 w-full px-6 py-3.5 border-t"
                style={{ borderColor: "rgba(28,46,56,0.08)" }}
              >
                <span className="flex items-center gap-3 text-[15px]" style={{ color: "#000000" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t] ?? "var(--leaf)" }} /> {t}
                </span>
                <RadioDot active={active === t} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ChevronIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Business-type filter — a simple dropdown (Eat & Drink / Shop / Services /
// See & Do) alongside the article-type bar, so results can be narrowed to
// one part of the site as well as one kind of post. Closes on an outside
// click/tap, same as the other dropdowns on the site (e.g. What's On).
function BusinessTypeFilter({ active, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeLabel = BUSINESS_TYPES.find((b) => b.key === active)?.label;

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 pl-5 pr-4 py-3 sm:py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors"
        style={
          active
            ? { backgroundColor: "var(--forest)", color: "#fff" }
            : { backgroundColor: "#ffffff", color: "#000000", boxShadow: "0 2px 14px -6px rgba(28,46,56,0.22), 0 0 0 1px rgba(28,46,56,0.06)" }
        }
      >
        {activeLabel ?? "Business Type"}
        <ChevronIcon />
      </button>

      {open && (
        <div
          className="absolute z-30 top-full mt-2 right-0 sm:right-auto sm:left-0 w-56 max-w-[calc(100vw-3rem)] bg-white rounded-2xl p-2 flex flex-col gap-0.5"
          style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}
        >
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className="flex items-center justify-between gap-3 text-sm px-3 py-2.5 rounded-lg hover:bg-black/5"
            style={{ color: "#000000" }}
          >
            All Business Types
            <RadioDot active={!active} />
          </button>
          {BUSINESS_TYPES.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => { onChange(b.key); setOpen(false); }}
              className="flex items-center justify-between gap-3 text-sm px-3 py-2.5 rounded-lg hover:bg-black/5"
              style={{ color: "#000000" }}
            >
              {b.label}
              <RadioDot active={active === b.key} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OffersPage() {
  const { data: allFeatures } = useFetch(getStories, []);
  const { data: allArticles } = useFetch(getArticles, []);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [activeBusinessType, setActiveBusinessType] = useState(null);

  // Unlike /news (which only shows the hand-written spotlight stories), this
  // page is the home hub for every business's News & Offers — so it pulls
  // every article from every section (Shop, Eat & Drink, See & Do and
  // Services, including tradespeople, professionals and freelancers), not
  // just the hand-picked ones.
  const allNewsAndOffers = allArticles ?? [];
  const featuredStories = allFeatures ?? [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // One unified list — Featured Stories and In the Spotlight articles
  // normalised to the same shape, so they can share a single search+filter
  // and one directory-style card grid instead of two separate sections.
  const items = useMemo(() => [
    ...featuredStories.map((s) => ({
      slug: s.slug,
      to: `/story/${s.slug}`,
      image: s.cardImage,
      title: s.cardHeading,
      excerpt: s.cardBody,
      date: s.date,
      type: "Featured",
      businessName: null,
      businessSection: null,
      homepage: !!s.homepage,
    })),
    ...allNewsAndOffers.map((s) => ({
      slug: s.slug,
      to: `/news/${s.slug}`,
      image: s.image,
      title: s.title,
      excerpt: s.excerpt,
      date: s.date,
      type: s.category,
      businessName: s.business?.name ?? null,
      businessSection: s.business?.section ?? null,
      homepage: homepageSpotlightSlugs.has(s.slug),
    })),
  ], [featuredStories, allNewsAndOffers]);

  const types = useMemo(
    () => TYPE_ORDER.filter((t) => items.some((it) => it.type === t)),
    [items]
  );

  const trimmedSearch = search.trim().toLowerCase();
  const filtered = items.filter((it) => {
    if (activeType && it.type !== activeType) return false;
    if (activeBusinessType && it.businessSection !== activeBusinessType) return false;
    if (!trimmedSearch) return true;
    return (
      it.title?.toLowerCase().includes(trimmedSearch) ||
      it.businessName?.toLowerCase().includes(trimmedSearch) ||
      it.type?.toLowerCase().includes(trimmedSearch)
    );
  });

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      {/* Hero band — same height as the Shop/Eat & Drink/Services/See & Do
          hero (70vh, 520px floor) so the transparent header always sits
          fully behind it; content is bottom-anchored, matching those pages,
          so the title never crowds the header nav. */}
      <section
        className="relative w-full h-[70vh] min-h-[520px] flex flex-col items-center justify-end text-center px-6 pb-12 md:pb-16 overflow-hidden"
        style={{ backgroundColor: "var(--forest)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(47,164,164,0.28) 0%, transparent 70%)",
          }}
        />
        <span className="section-eyebrow relative mb-3" style={{ color: "var(--sage)" }}>
          Offers &amp; Stories
        </span>
        <h1 className="hero-title relative uppercase text-3xl md:text-5xl lg:text-6xl leading-tight mb-4 text-white" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
          Every Story, In One Place
        </h1>
        <p
          className="relative text-sm md:text-base max-w-xl leading-relaxed font-medium mb-5"
          style={{ color: "#ffffff", letterSpacing: "-0.01em" }}
        >
          Discover the complete collection of Featured Stories and Spotlight Articles. Find and search for
          offers and the latest news from businesses around Maidenhead. Download The Maidenhead App to get
          all the offers direct to you anytime you need.
        </p>
        <div className="relative">
          <AppBadges size="sm" />
        </div>
      </section>

      {/* Body */}
      <section className="py-14 md:py-20 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Offers</span>
          </nav>

          {/* ── Search + filter — wraps onto its own rows on mobile rather
              than squeezing three controls into one cramped line. ── */}
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <TypeFilterBar types={types} active={activeType} onChange={setActiveType} />
            <BusinessTypeFilter active={activeBusinessType} onChange={setActiveBusinessType} />
            <SearchInput value={search} onChange={setSearch} className="w-full sm:ml-auto sm:w-72" />
          </div>

          {/* ── Card grid — same layout/typography as the See & Do / Eat &
              Drink / Shop / Services listing pages ── */}
          {filtered.length === 0 ? (
            <p className="text-sm py-16 text-center" style={{ color: "rgba(0,0,0,0.55)" }}>
              {trimmedSearch
                ? `No results for "${search.trim()}" — try a different name.`
                : "Nothing listed here just yet — check back soon."}
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filtered.map((it) => (
                <Link
                  key={it.slug}
                  to={it.to}
                  className="group relative bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                  style={{ boxShadow: card.shadow }}
                >
                  <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden">
                    <img src={it.image} alt={it.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {it.homepage && <HomepageBadge />}
                  </div>
                  <div className="flex flex-col gap-1 sm:gap-0.5 p-2.5 sm:p-2.5">
                    {it.type && (
                      <span
                        className={`${pill.className} !text-[9px] sm:!text-[9px] !px-2 sm:!px-2 !py-0.5 sm:!py-0.5`}
                        style={{ color: "#000000", backgroundColor: "#ffffff", boxShadow: "0 1px 4px rgba(13,42,51,0.12)", alignSelf: "flex-start" }}
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[it.type] ?? "var(--leaf)" }} />
                        {it.type}
                      </span>
                    )}
                    <h3 className="listing-card-title text-xs sm:text-sm leading-snug sm:leading-tight line-clamp-2 sm:line-clamp-1" style={{ color: "#000000", fontFamily: "var(--font-heading)" }}>
                      {it.title}
                    </h3>
                    {it.date && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px]" style={{ color: "#000000" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        <span className="line-clamp-1">{it.date}</span>
                      </span>
                    )}
                    {it.businessName && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px]" style={{ color: "#000000" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="line-clamp-1">{it.businessName}</span>
                      </span>
                    )}
                    <div className="hidden sm:block">
                      <p className="text-[11px] leading-snug line-clamp-1" style={{ color: "#000000" }}>{it.excerpt}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold mt-0.5" style={{ color: "#000000" }}>
                      Read more
                      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

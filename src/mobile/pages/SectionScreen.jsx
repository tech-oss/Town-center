import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useTapReveal from "../../hooks/useTapReveal";
import useFetch from "../../hooks/useFetch";
import MobileShell from "../components/MobileShell";
import CategorySheet from "../components/CategorySheet";
import { ListSearch, OffersLink } from "../components/ListSearch";
import { sections } from "../../Data/pages";
import { resolveCategory } from "../../Data/taxonomy";
import { getEvents } from "../../api";
import { sectionCategories, matchesCategory, eventToSeeDoCard } from "../../lib/sectionCategories";

const SECTION_INTROS = {
  "see-do": "Explore the best attractions, green spaces, and things to do in and around Maidenhead.",
  "eat-drink": "From riverside dining to cosy cafés, explore Maidenhead's food and drink scene.",
  shop: "From high-street favourites to independent boutiques, discover Maidenhead's shops.",
  services: "Trades, professionals and local businesses serving Maidenhead.",
};

// Framed-photo hover — same "spotlight" treatment used across the website's
// cards, adapted for a touch tap-reveal on mobile.
function CardImage({ src, alt }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div
      onClick={onImageClick}
      className={`spotlight-card relative w-28 h-28 shrink-0 overflow-hidden ${revealed ? "is-revealed" : ""}`}
    >
      <img src={src} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
      <img src={src} alt={alt} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

export default function SectionScreen({ sectionKey }) {
  const section = sections[sectionKey];
  const isSeeDo = sectionKey === "see-do";
  const [query, setQuery] = useState("");

  // The category lives in the URL, as it does on the website, so a shared
  // link opens the same filter and "back" from a listing returns to it.
  // Run through the taxonomy's alias map so a pre-rename slug still lands.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCategory = searchParams.get("category");
  const category = rawCategory ? resolveCategory(rawCategory) : null;
  const setCategory = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("category", value);
      else next.delete("category");
      return next;
    }, { replace: true });
  };

  // A typed search shouldn't follow the user into a different section.
  useEffect(() => setQuery(""), [sectionKey]);

  // Same list, same order as the website's filter — the section's nav
  // columns flattened (see lib/sectionCategories).
  const categories = useMemo(() => sectionCategories(section), [section]);

  // See & Do folds the What's On events in alongside activities, exactly as
  // the website does, so categories like Music & Dance or Markets aren't
  // empty just because no venue is tagged with them.
  const { data: events } = useFetch(getEvents, []);

  const items = useMemo(() => {
    let list;
    if (isSeeDo) {
      const eventCards = (events ?? []).map((e) => eventToSeeDoCard(e, "/mobile/event"));
      const all = [...eventCards, ...section.items];
      list = category ? all.filter((i) => i.category === category) : all;
    } else {
      list = section.items.filter((i) => matchesCategory(i, category));
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((i) => i.name.toLowerCase().includes(q));
    return list;
  }, [section, isSeeDo, events, category, query]);

  return (
    <MobileShell title={section.label} onBack backFallback="/mobile/explore">
      <div className="flex flex-col gap-5 mobile-stagger">
        <p className="text-sm font-medium" style={{ color: "#000000" }}>{SECTION_INTROS[sectionKey] ?? section.landing?.intro}</p>

        <OffersLink />

        {isSeeDo && (
          <Link
            to="/mobile/whats-on"
            className="self-start inline-flex items-center gap-1.5 text-sm font-bold active:opacity-70"
            style={{ color: "var(--teal-deep)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
            View on Calendar
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </Link>
        )}

        {/* The website's phone-width filter row: category sheet beside a
            search-by-name field. */}
        <div className="flex items-center gap-3">
          <CategorySheet categories={categories} value={category} onChange={setCategory} />
          <div className="flex-1 min-w-0">
            <ListSearch value={query} onChange={setQuery} placeholder="Search by name" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((it) => (
            <Link key={`${it.isEvent ? "e" : "p"}-${it.slug}`} to={it.to ?? `/mobile/place/${it.slug}`}>
              <div
                className="flex items-stretch overflow-hidden bg-white active:opacity-90"
                style={{ borderRadius: 16, boxShadow: "0 10px 26px -12px rgba(28,46,56,0.45)" }}
              >
                <CardImage src={it.image} alt={it.name} />
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <p className="text-sm font-bold leading-snug" style={{ color: "#000000" }}>{it.name}</p>
                  <p className="text-xs mt-1 leading-snug line-clamp-2 font-medium" style={{ color: "#000000" }}>{it.description}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--teal-deep)" }}>{it.tag}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "var(--leaf)" }}>
                      Read more
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-center py-10 font-medium" style={{ color: "#000000" }}>
              No results{query ? ` for “${query}”` : ""}.
            </p>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

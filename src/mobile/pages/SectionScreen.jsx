import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useTapReveal from "../../hooks/useTapReveal";
import MobileShell from "../components/MobileShell";
import { ListSearch, FilterPills, OffersLink } from "../components/ListSearch";
import { sections } from "../../Data/pages";

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
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filters = useMemo(
    () => ["All", ...Array.from(new Set(section.items.map((i) => i.tag)))],
    [section]
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return section.items.filter((i) => {
      if (filter !== "All" && i.tag !== filter) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.tag.toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [section, filter, query]);

  const showHero = sectionKey === "eat-drink" && section.landing?.hero;

  return (
    <MobileShell title={section.label} onBack backFallback="/mobile/explore" noPadding={showHero}>
      <div className="flex flex-col">
        {showHero && (
          <div className="relative h-40 -mb-1">
            <img src={section.landing.hero} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <p className="absolute bottom-3 left-5 text-white text-lg font-bold" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
              {section.label}
            </p>
          </div>
        )}

        <div className={`flex flex-col gap-5 mobile-stagger ${showHero ? "px-5 pt-5 pb-6" : ""}`}>
        <p className="text-sm font-medium" style={{ color: "#000000" }}>{SECTION_INTROS[sectionKey] ?? section.landing?.intro}</p>

        <OffersLink />

        <ListSearch value={query} onChange={setQuery} placeholder={`Search ${section.label}…`} />

        {sectionKey === "see-do" && (
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

        <FilterPills options={filters} value={filter} onChange={setFilter} />

        <div className="flex flex-col gap-3">
          {items.map((it) => (
            <Link key={it.slug} to={`/mobile/place/${it.slug}`}>
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
      </div>
    </MobileShell>
  );
}

import { useState, useMemo } from "react";
import { appSectionLabel } from "../lib/sectionLabels";
import ListingCard from "../../components/ListingCard";
import useSectionItems from "../hooks/useSectionItems";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { ListSearch, FilterPills, OffersLink } from "../components/ListSearch";
import { sections } from "../../Data/pages";
import { categoryLabel } from "../../Data/taxonomy";

const SECTION_INTROS = {
  "see-do": "Explore the best attractions, green spaces, and things to do in and around Maidenhead.",
  "eat-drink": "From riverside dining to cosy cafés, explore Maidenhead's food and drink scene.",
  shop: "From high-street favourites to independent boutiques, discover Maidenhead's shops.",
  services: "Trades, professionals and local businesses serving Maidenhead.",
};

// Every category a listing is filed under — a registered business can pick
// more than one (e.g. Restaurants and Private Dining), and should appear under
// each, the same as on the website. Only the section's own categories count
// (the ones the website's category bar offers), so cuisines don't become pills.
function sectionCategorySlugs(section) {
  const links = (section?.columns ?? []).flatMap((c) => c.links ?? []);
  return new Set(links.filter((l) => l.to?.includes("?category=")).map((l) => l.to.split("?category=")[1]));
}

function tagsOf(item, slugs) {
  const extra = (item.categories ?? []).filter((c) => slugs.has(c)).map(categoryLabel);
  return [...new Set([item.tag, ...extra].filter(Boolean))];
}

export default function SectionScreen({ sectionKey }) {
  const section = sections[sectionKey];
  const sectionItems = useSectionItems(sectionKey);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const slugs = useMemo(() => sectionCategorySlugs(section), [section]);

  const filters = useMemo(
    () => ["All", ...Array.from(new Set(sectionItems.flatMap((i) => tagsOf(i, slugs))))],
    [sectionItems, slugs]
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sectionItems.filter((i) => {
      if (filter !== "All" && !tagsOf(i, slugs).includes(filter)) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        (i.tag ?? "").toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [sectionItems, filter, query, slugs]);

  return (
    <MobileShell title={appSectionLabel(sectionKey, section.label)} onBack backFallback="/mobile/explore">
      <div className="flex flex-col gap-5 mobile-stagger">
        <p className="text-sm font-medium" style={{ color: "#000000" }}>{SECTION_INTROS[sectionKey] ?? section.landing?.intro}</p>

        <OffersLink />

        <ListSearch value={query} onChange={setQuery} placeholder={`Search ${appSectionLabel(sectionKey, section.label)}…`} />

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

        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <ListingCard key={it.slug} item={it} to={`/mobile/place/${it.slug}`} />
          ))}
          {items.length === 0 && (
            <p className="col-span-2 text-sm text-center py-10 font-medium" style={{ color: "#000000" }}>
              No results{query ? ` for “${query}”` : ""}.
            </p>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

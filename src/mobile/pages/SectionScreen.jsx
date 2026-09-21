import { useState, useMemo } from "react";
import { appSectionLabel } from "../lib/sectionLabels";
import ListingCard from "../../components/ListingCard";
import useSectionItems from "../hooks/useSectionItems";
import useFetch from "../../hooks/useFetch";
import { getEvents } from "../../api";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { ListSearch, FilterPills, OffersLink } from "../components/ListSearch";
import { sections, categoryTitles } from "../../Data/pages";
import { toSeeDoSlug, toSeeDoSlugs } from "../../lib/eventCategories";

const SECTION_INTROS = {
  "see-do": "Explore the best attractions, green spaces, and things to do in and around Maidenhead.",
  "eat-drink": "From riverside dining to cosy cafés, explore Maidenhead's food and drink scene.",
  shop: "From high-street favourites to independent boutiques, discover Maidenhead's shops.",
  services: "Trades, professionals and local businesses serving Maidenhead.",
};

// The section's categories in the order the website's dropdown lists them, so
// the app's filter bar reads top-to-bottom exactly as the menu does. The menu
// is the single source of truth for both — nothing is sorted or discovered
// from the items themselves, which used to leave the two in different orders.
function sectionCategories(section) {
  const links = (section?.columns ?? []).flatMap((c) => c.links ?? []);
  const seen = new Set();
  const out = [];
  for (const l of links) {
    if (!l.to?.includes("?category=")) continue;
    const slug = l.to.split("?category=")[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, label: categoryTitles[slug] ?? l.label });
  }
  return out;
}

// What's On events shown as See & Do cards, the same as the website does —
// the app's See & Do page was missing them entirely.
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
    to: `/mobile/event/${e.slug}`,
  };
};

const inCategory = (item, slug) => item.category === slug || item.categories?.includes(slug);

export default function SectionScreen({ sectionKey }) {
  const section = sections[sectionKey];
  const sectionItems = useSectionItems(sectionKey);
  const { data: whatsOnEvents } = useFetch(getEvents, []);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => sectionCategories(section), [section]);

  // See & Do: featured businesses lead, then events, then everything else —
  // the same running order as the website's See & Do listing.
  const pool = useMemo(() => {
    if (sectionKey !== "see-do") return sectionItems;
    const activities = sectionItems.map((i) => ({ ...i, to: `/mobile/event/${i.slug}` }));
    return [
      ...activities.filter((i) => i.featured),
      ...(whatsOnEvents ?? []).map(toEventCard),
      ...activities.filter((i) => !i.featured),
    ];
  }, [sectionKey, sectionItems, whatsOnEvents]);

  // Only categories that actually have something in them get a pill, but they
  // keep the website's order.
  const filters = useMemo(
    () => [
      { key: "all", label: "All" },
      ...categories.filter((c) => pool.some((i) => inCategory(i, c.slug))),
    ],
    [categories, pool]
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const active = filter === "all" ? null : filter;
    return pool
      .filter((i) => {
        if (active && !inCategory(i, active)) return false;
        if (!q) return true;
        return (
          i.name.toLowerCase().includes(q) ||
          (i.tag ?? "").toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q)
        );
      })
      // Under a filter, each card is labelled and linked with the category
      // being browsed, so the detail page's breadcrumb matches the way in.
      .map((i) => {
        const base = i.to ?? `/mobile/place/${i.slug}`;
        if (!active) return { ...i, to: base };
        return {
          ...i,
          tag: categoryTitles[active] ?? i.tag,
          to: `${base}?category=${encodeURIComponent(active)}`,
        };
      });
  }, [pool, filter, query]);

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
            <ListingCard key={`${it.section}-${it.slug}`} item={it} to={it.to} />
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

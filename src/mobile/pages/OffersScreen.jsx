import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import FilterSheet from "../components/FilterSheet";
import useFetch from "../../hooks/useFetch";
import { getStories, getArticles } from "../../api";
import { blogCards } from "../../Data/content";
import { sections } from "../../Data/pages";

const BUSINESS_TYPES = [
  ...Object.values(sections).map((s) => ({ key: s.key, label: s.label })),
  { key: "stay", label: "Hotels & Stay" },
];

const homepageSpotlightSlugs = new Set(
  blogCards.posts.filter((p) => p.homepage).map((p) => p.href.split("/").pop())
);

const TYPE_COLORS = {
  Featured: "var(--forest)",
  Offer: "#F5A623",
  News: "var(--leaf)",
  "What's On": "var(--teal-deep)",
};
const TYPE_ORDER = ["Featured", "Offer", "News", "What's On"];

function SearchInput({ value, onChange }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(28,46,56,0.4)" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7" /><path d="M21 21l-5.5-5.5" /></svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or business"
        aria-label="Search offers and stories"
        className="w-full pl-11 pr-9 py-3 rounded-full text-sm bg-white focus:outline-none"
        style={{ boxShadow: "0 2px 14px -6px rgba(28,46,56,0.22), 0 0 0 1px rgba(28,46,56,0.06)", color: "#000000" }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(28,46,56,0.08)", color: "#000000" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

export default function OffersScreen() {
  const { data: allFeatures } = useFetch(getStories, []);
  const { data: allArticles } = useFetch(getArticles, []);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [activeBusinessType, setActiveBusinessType] = useState(null);

  const featuredStories = allFeatures ?? [];
  const allNewsAndOffers = allArticles ?? [];

  const items = useMemo(() => [
    ...featuredStories.map((s) => ({
      slug: s.slug,
      to: `/mobile/story/${s.slug}`,
      image: s.cardImage,
      title: s.cardHeading,
      date: s.date,
      type: "Featured",
      businessName: null,
      businessSection: null,
      homepage: !!s.homepage,
    })),
    ...allNewsAndOffers.map((s) => ({
      slug: s.slug,
      to: `/mobile/news/${s.slug}`,
      image: s.image,
      title: s.title,
      date: s.date,
      type: s.category,
      businessName: s.business?.name ?? null,
      businessSection: s.business?.section ?? null,
      homepage: homepageSpotlightSlugs.has(s.slug),
    })),
  ], [featuredStories, allNewsAndOffers]);

  const types = useMemo(() => TYPE_ORDER.filter((t) => items.some((it) => it.type === t)), [items]);

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
    <MobileShell title="Offers & Stories" onBack backFallback="/mobile/home">
      <div className="flex flex-col gap-4 mobile-stagger">
        <p className="text-sm" style={{ color: "#000000" }}>
          Every Featured Story and Spotlight Article — search and filter offers and the latest news from businesses around Maidenhead.
        </p>

        <SearchInput value={search} onChange={setSearch} />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
          <FilterSheet
            title="Types"
            triggerLabel={activeType ?? "All Types"}
            options={types.map((t) => ({ key: t, label: t, color: TYPE_COLORS[t] }))}
            value={activeType}
            onChange={setActiveType}
          />
          <FilterSheet
            title="Business Types"
            triggerLabel={BUSINESS_TYPES.find((b) => b.key === activeBusinessType)?.label ?? "Business Type"}
            options={BUSINESS_TYPES}
            value={activeBusinessType}
            onChange={setActiveBusinessType}
            allLabel="All Business Types"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: "#000000" }}>
            {trimmedSearch ? `No results for "${search.trim()}" — try a different name.` : "Nothing listed here just yet — check back soon."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((it) => (
              <Link
                key={it.slug}
                to={it.to}
                className="group relative bg-white overflow-hidden flex flex-col active:opacity-90"
                style={{ borderRadius: 14, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img src={it.image} alt={it.title} loading="lazy" className="w-full h-full object-cover" />
                  {it.homepage && (
                    <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--forest)", color: "#fff" }}>
                      On Homepage
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 p-2.5">
                  {it.type && (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide w-fit" style={{ color: "#000000" }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[it.type] ?? "var(--leaf)" }} />
                      {it.type}
                    </span>
                  )}
                  <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{it.title}</p>
                  {it.businessName && (
                    <span className="text-[10px] leading-snug truncate" style={{ color: "#000000" }}>{it.businessName}</span>
                  )}
                  {it.date && !it.businessName && (
                    <span className="text-[10px] leading-snug truncate" style={{ color: "#000000" }}>{it.date}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

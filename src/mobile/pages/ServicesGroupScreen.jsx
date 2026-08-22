import { useState, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import useTapReveal from "../../hooks/useTapReveal";
import MobileShell from "../components/MobileShell";
import { ListSearch, FilterPills, OffersLink } from "../components/ListSearch";
import { sections } from "../../Data/pages";

const servicesSection = sections.services;

// Same category slug -> group mapping the website derives from Services'
// three columns (Tradesperson/Professionals/Freelancers) — reused here
// rather than duplicated, so mobile and web can never drift apart on which
// category belongs to which group.
function categoriesForGroup(groupConfig) {
  if (!groupConfig) return null;
  const column = servicesSection.columns.find((c) => c.heading === groupConfig.heading);
  if (!column) return null;
  return new Set(
    column.links.filter((l) => l.to.includes("?category=")).map((l) => l.to.split("?category=")[1])
  );
}

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

export default function ServicesGroupScreen() {
  const { group } = useParams();
  const groupConfig = servicesSection.groups.find((g) => g.key === group);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const groupCategories = useMemo(() => categoriesForGroup(groupConfig), [groupConfig]);
  const groupItems = useMemo(
    () => (groupCategories ? servicesSection.items.filter((i) => groupCategories.has(i.category)) : []),
    [groupCategories]
  );

  const filters = useMemo(
    () => ["All", ...Array.from(new Set(groupItems.map((i) => i.tag)))],
    [groupItems]
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupItems.filter((i) => {
      if (filter !== "All" && i.tag !== filter) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.tag.toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [groupItems, filter, query]);

  if (!groupConfig) return <Navigate to="/mobile/services" replace />;

  return (
    <MobileShell title={groupConfig.label} onBack backFallback="/mobile/services">
      <div className="flex flex-col gap-5 mobile-stagger">
        <p className="text-sm font-medium" style={{ color: "#000000" }}>{groupConfig.intro}</p>

        <OffersLink />

        <ListSearch value={query} onChange={setQuery} placeholder={`Search ${groupConfig.label}…`} />

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
    </MobileShell>
  );
}

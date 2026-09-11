import { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
import useTapReveal from "../../hooks/useTapReveal";
import MobileShell from "../components/MobileShell";
import CategorySheet from "../components/CategorySheet";
import { ListSearch, OffersLink } from "../components/ListSearch";
import { sections } from "../../Data/pages";
import { resolveCategory } from "../../Data/taxonomy";
import { sectionCategories, groupColumnFor, columnCategoryValues, matchesCategory } from "../../lib/sectionCategories";

const servicesSection = sections.services;

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
  const [query, setQuery] = useState("");

  // Category in the URL, alias-resolved — same as the website's
  // /services/:group?category= pages.
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

  useEffect(() => setQuery(""), [group]);

  // Scoped to this group's own column — its full taxonomy list, including
  // categories no one is listed under yet and the trailing "Other".
  const column = useMemo(() => groupColumnFor(servicesSection, groupConfig), [groupConfig]);
  const categories = useMemo(() => (column ? sectionCategories(servicesSection, column) : []), [column]);
  const groupItems = useMemo(() => {
    const values = columnCategoryValues(column);
    return values ? servicesSection.items.filter((i) => values.has(i.category)) : [];
  }, [column]);

  const items = useMemo(() => {
    let list = groupItems.filter((i) => matchesCategory(i, category));
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((i) => i.name.toLowerCase().includes(q));
    return list;
  }, [groupItems, category, query]);

  if (!groupConfig) return <Navigate to="/mobile/services" replace />;

  return (
    <MobileShell title={groupConfig.label} onBack backFallback="/mobile/services">
      <div className="flex flex-col gap-5 mobile-stagger">
        <p className="text-sm font-medium" style={{ color: "#000000" }}>{groupConfig.intro}</p>

        <OffersLink />

        <div className="flex items-center gap-3">
          <CategorySheet categories={categories} value={category} onChange={setCategory} />
          <div className="flex-1 min-w-0">
            <ListSearch value={query} onChange={setQuery} placeholder="Search by name" />
          </div>
        </div>

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

import { useState, useMemo } from "react";
import ListingCard from "../../components/ListingCard";
import useSectionItems from "../hooks/useSectionItems";
import { useParams, Navigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { ListSearch, FilterPills, OffersLink } from "../components/ListSearch";
import { sections, categoryTitles } from "../../Data/pages";

const servicesSection = sections.services;

// Same category slug -> group mapping the website derives from Services'
// three columns (Tradesperson/Professionals/Freelancers) — reused here
// rather than duplicated, so mobile and web can never drift apart on which
// category belongs to which group.
function categoriesForGroup(groupConfig) {
  if (!groupConfig) return null;
  const column = servicesSection.columns.find((c) => c.heading === groupConfig.heading);
  if (!column) return null;
  // Kept in the column's own order so the app's filter bar reads the same
  // way as the website's dropdown.
  return column.links
    .filter((l) => l.to.includes("?category="))
    .map((l) => {
      const slug = l.to.split("?category=")[1];
      // `key` is what FilterPills renders and compares by.
      return { key: slug, slug, label: categoryTitles[slug] ?? l.label };
    });
}

export default function ServicesGroupScreen() {
  const { group } = useParams();
  const groupConfig = group === "all"
    ? { key: "all", label: "All Services", heading: null, intro: "Every trade, professional and freelancer listed in Maidenhead." }
    : servicesSection.groups.find((g) => g.key === group);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const serviceItems = useSectionItems("services");
  const groupCategories = useMemo(
    () => (group === "all"
      ? servicesSection.groups.flatMap((g) => categoriesForGroup(g) ?? [])
      : categoriesForGroup(groupConfig)),
    [group, groupConfig]
  );
  const groupSlugs = useMemo(
    () => new Set((groupCategories ?? []).map((c) => c.slug)),
    [groupCategories]
  );
  // "All" is every Services business, the same list as the website's
  // Services page. A group takes the businesses assigned to it (by the kind
  // they chose at signup) plus anything filed under one of its categories.
  const groupItems = useMemo(
    () => (group === "all"
      ? serviceItems
      : serviceItems.filter((i) =>
          i.serviceGroup === group || groupSlugs.has(i.category) || i.categories?.some((c) => groupSlugs.has(c)))),
    [group, groupSlugs, serviceItems]
  );

  const filters = useMemo(
    () => [
      { key: "all", label: "All" },
      ...(groupCategories ?? []).filter((c) =>
        groupItems.some((i) => i.category === c.slug || i.categories?.includes(c.slug))
      ),
    ],
    [groupCategories, groupItems]
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const active = filter === "all" ? null : filter;
    return groupItems
      .filter((i) => {
        if (active && !(i.category === active || i.categories?.includes(active))) return false;
        if (!q) return true;
        return (
          i.name.toLowerCase().includes(q) ||
          (i.tag ?? "").toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q)
        );
      })
      // The card carries the category being browsed so the detail screen's
      // breadcrumb follows the way in.
      .map((i) =>
        active
          ? { ...i, tag: categoryTitles[active] ?? i.tag, to: `/mobile/place/${i.slug}?category=${encodeURIComponent(active)}` }
          : { ...i, to: `/mobile/place/${i.slug}` }
      );
  }, [groupItems, filter, query]);

  if (!groupConfig) return <Navigate to="/mobile/services" replace />;

  return (
    <MobileShell title={groupConfig.label} onBack backFallback="/mobile/services">
      <div className="flex flex-col gap-5 mobile-stagger">
        <p className="text-sm font-medium" style={{ color: "#000000" }}>{groupConfig.intro}</p>

        <OffersLink />

        <ListSearch value={query} onChange={setQuery} placeholder={`Search ${groupConfig.label}…`} />

        <FilterPills options={filters} value={filter} onChange={setFilter} />

        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <ListingCard key={it.slug} item={it} to={it.to} />
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

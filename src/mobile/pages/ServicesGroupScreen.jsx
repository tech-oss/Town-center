import { useState, useMemo } from "react";
import ListingCard from "../../components/ListingCard";
import useSectionItems from "../hooks/useSectionItems";
import { useParams, Navigate } from "react-router-dom";
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

export default function ServicesGroupScreen() {
  const { group } = useParams();
  const groupConfig = servicesSection.groups.find((g) => g.key === group);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const serviceItems = useSectionItems("services");
  const groupCategories = useMemo(() => categoriesForGroup(groupConfig), [groupConfig]);
  const groupItems = useMemo(
    () => (groupCategories ? serviceItems.filter((i) => groupCategories.has(i.category)) : []),
    [groupCategories, serviceItems]
  );

  const filters = useMemo(
    () => ["All", ...Array.from(new Set(groupItems.map((i) => i.tag).filter(Boolean)))],
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

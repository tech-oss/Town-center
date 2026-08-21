import { useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { ListSearch, OffersLink } from "../components/ListSearch";
import FilterSheet from "../components/FilterSheet";
import useFetch from "../../hooks/useFetch";
import { getHotels, getAccommodations } from "../../api";

const LANDING = {
  hotels: {
    title: "Hotels",
    intro: "Where to stay in and around the town centre, from budget chains to riverside hotels — every listing links to the hotel's own site for booking.",
  },
  accommodation: {
    title: "Accommodation",
    intro: "Privately-owned homes and rooms to stay in around Maidenhead.",
  },
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function StayListingScreen() {
  const { kind } = useParams();
  const isHotels = kind === "hotels";
  const landing = LANDING[kind];
  const { data: hotels } = useFetch(getHotels, []);
  const { data: accommodations } = useFetch(getAccommodations, []);
  const allItems = isHotels ? hotels : accommodations;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const [amenitiesFilter, setAmenitiesFilter] = useState(() => new Set());

  const categories = useMemo(() => {
    if (!allItems) return [];
    if (isHotels) {
      const stars = [...new Set(allItems.map((h) => h.stars))].sort((a, b) => b - a);
      return stars.map((s) => ({ key: String(s), label: `${s}-Star` }));
    }
    const types = [...new Set(allItems.map((a) => a.type))];
    return types.map((t) => ({ key: slugify(t), label: t }));
  }, [allItems, isHotels]);

  const allAmenities = useMemo(() => {
    const set = new Set();
    (allItems ?? []).forEach((i) => (i.amenities ?? []).forEach((a) => set.add(a)));
    return [...set].sort().map((a) => ({ key: a, label: a }));
  }, [allItems]);

  const items = useMemo(() => {
    let list = allItems ?? [];
    if (category) {
      list = isHotels ? list.filter((h) => String(h.stars) === category) : list.filter((a) => slugify(a.type) === category);
    }
    if (amenitiesFilter.size > 0) {
      list = list.filter((i) => [...amenitiesFilter].every((a) => i.amenities?.includes(a)));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.tagline ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [allItems, category, amenitiesFilter, query, isHotels]);

  if (!landing) return <Navigate to="/mobile/live" replace />;

  return (
    <MobileShell title={landing.title} onBack backFallback="/mobile/live">
      <div className="flex flex-col gap-4 mobile-stagger">
        <p className="text-sm font-medium" style={{ color: "#000000" }}>{landing.intro}</p>

        <OffersLink />

        <ListSearch value={query} onChange={setQuery} placeholder={`Search ${landing.title}…`} />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
          <FilterSheet
            title={isHotels ? "Star Rating" : "Property Type"}
            triggerLabel={categories.find((c) => c.key === category)?.label ?? (isHotels ? "Star Rating" : "Property Type")}
            options={categories}
            value={category}
            onChange={setCategory}
            allLabel={isHotels ? "All Ratings" : "All Types"}
          />
          {allAmenities.length > 0 && (
            <FilterSheet
              title="Amenities"
              triggerLabel={`Amenities${amenitiesFilter.size > 0 ? ` (${amenitiesFilter.size})` : ""}`}
              options={allAmenities}
              multi
              value={amenitiesFilter}
              onChange={setAmenitiesFilter}
            />
          )}
        </div>

        <div className="flex flex-col gap-3">
          {items.map((p) => (
            <Link key={p.slug} to={`/mobile/stay/${kind}/${p.slug}`}>
              <MobileCard className="flex items-stretch overflow-hidden active:opacity-90">
                <img src={p.image} alt="" className="w-28 h-28 object-cover shrink-0" />
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--teal-deep)" }}>
                    {isHotels ? `${"★".repeat(p.stars)} Hotel` : p.type}
                  </span>
                  <p className="text-sm font-bold leading-snug mt-0.5" style={{ color: "#000000" }}>{p.name}</p>
                  <p className="text-xs mt-1 leading-snug line-clamp-2 font-medium" style={{ color: "#000000", opacity: 0.75 }}>{p.tagline}</p>
                </div>
              </MobileCard>
            </Link>
          ))}
          {allItems == null && (
            <p className="text-sm text-center py-8 font-medium" style={{ color: "#000000" }}>Loading places to stay…</p>
          )}
          {allItems != null && items.length === 0 && (
            <p className="text-sm text-center py-10 font-medium" style={{ color: "#000000" }}>
              No results{query ? ` for “${query}”` : ""}.
            </p>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

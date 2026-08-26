import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
import { createPortal } from "react-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { ListSearch, OffersLink } from "../components/ListSearch";
import FilterSheet from "../components/FilterSheet";
import useFetch from "../../hooks/useFetch";
import { getHotels, getAccommodations } from "../../api";
import { POSTCODE_COORDS, RADIUS_OPTIONS, milesBetween } from "../../lib/postcodeDistance";

// "Near a postcode" — same postcode + radius search as the web listing
// page, in the app's bottom-sheet pattern rather than a plain option list
// since it also needs a text input and a radius select.
function PostcodeFilterSheet({ appliedLocation, onApply, onClear }) {
  const [open, setOpen] = useState(false);
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState(RADIUS_OPTIONS[1]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const outwardCode = postcode.trim().toUpperCase().split(/\s+/)[0];
  const matchedCoords = POSTCODE_COORDS[outwardCode];

  const apply = () => {
    if (!matchedCoords) return;
    onApply({ ...matchedCoords, radius, outwardCode });
    setOpen(false);
  };
  const clear = () => {
    setPostcode("");
    onClear();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 pl-4 pr-3.5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0"
        style={appliedLocation ? { backgroundColor: "var(--forest)", color: "#fff" } : { backgroundColor: "rgba(28,46,56,0.06)", color: "#000000" }}
      >
        {appliedLocation ? appliedLocation.label : "Near a postcode"}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={() => setOpen(false)}>
          <div className="w-full bg-white rounded-t-3xl pt-5 pb-6 px-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "#000000" }}>Near a Postcode</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: "var(--forest)" }}>✕</button>
            </div>
            <label className="text-xs font-semibold flex flex-col gap-1.5" style={{ color: "#000000" }}>
              Postcode
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. SL6 1QJ"
                className="text-sm rounded-xl px-3.5 py-3 outline-none border"
                style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000" }}
              />
            </label>
            <label className="text-xs font-semibold flex flex-col gap-1.5" style={{ color: "#000000" }}>
              Radius
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="text-sm rounded-xl px-3.5 py-3 outline-none border bg-white"
                style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000" }}
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r} mile{r > 1 ? "s" : ""}</option>
                ))}
              </select>
            </label>
            {postcode.trim() && !matchedCoords && (
              <p className="text-xs" style={{ color: "#C0392B" }}>Postcode area not recognised — try SL6, SL4, SL1, SL7, SL8 or RG9.</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              {appliedLocation && (
                <button type="button" onClick={clear} className="text-xs font-semibold underline" style={{ color: "#000000" }}>
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={apply}
                disabled={!matchedCoords}
                className="flex-1 py-3 rounded-full text-sm font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: "var(--forest)" }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

const LANDING = {
  hotels: {
    title: "Hotels",
    intro: "Where to stay in and around the town centre, from budget chains to riverside hotels — every listing links to the hotel's own site for booking.",
    heroImage: "/images/live/hotels-hero.jpg",
  },
  accommodation: {
    title: "Accommodation",
    intro: "Privately-owned homes and rooms to stay in around Maidenhead.",
    heroImage: "/images/live/accommodation-hero.jpg",
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

  // Every filter lives in the URL (not plain useState) so that tapping a
  // card, viewing the business, and pressing back restores the exact same
  // filtered results instead of resetting to the unfiltered list.
  const [searchParams, setSearchParams] = useSearchParams();
  const patchParams = (patch) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") next.delete(k);
        else next.set(k, v);
      });
      return next;
    }, { replace: true });
  };
  const setToParam = (set) => ([...set].join(",") || undefined);
  const paramToSet = (v) => new Set(v ? v.split(",") : []);

  const query = searchParams.get("q") ?? "";
  const setQuery = (v) => patchParams({ q: v });
  const category = searchParams.get("category");
  const setCategory = (v) => patchParams({ category: v });

  // Same filter set as the web listing page — Facilities, Room facilities,
  // and (accommodation only) Meals, Travel group — each backed by a field
  // on the hotel/accommodation data (Data/stay.js).
  const filterDefs = isHotels
    ? [
        { field: "facilities", label: "Facilities" },
        { field: "roomFacilities", label: "Room Facilities" },
      ]
    : [
        { field: "facilities", label: "Facilities" },
        { field: "roomFacilities", label: "Room Facilities" },
        { field: "meals", label: "Meals" },
        { field: "travelGroup", label: "Travel Group" },
      ];
  const checkboxFilters = useMemo(() => {
    const out = {};
    filterDefs.forEach(({ field }) => { out[field] = paramToSet(searchParams.get(field)); });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, kind]);
  const setCheckboxField = (field) => (next) => patchParams({ [field]: setToParam(next) });

  const postcode = searchParams.get("postcode");
  const locParam = searchParams.get("loc"); // "lat,lng,radius"
  const appliedLocation = useMemo(() => {
    if (!locParam || !postcode) return null;
    const [lat, lng, radius] = locParam.split(",").map(Number);
    if (![lat, lng, radius].every(Number.isFinite)) return null;
    return { lat, lng, radius, label: `Within ${radius} mi of ${postcode.toUpperCase()}` };
  }, [locParam, postcode]);
  const applyLocation = ({ lat, lng, radius, outwardCode }) => {
    patchParams({ postcode: outwardCode, loc: `${lat},${lng},${radius}` });
  };
  const clearLocation = () => patchParams({ postcode: undefined, loc: undefined });

  const categories = useMemo(() => {
    if (!allItems) return [];
    if (isHotels) {
      const stars = [...new Set(allItems.map((h) => h.stars))].sort((a, b) => b - a);
      return stars.map((s) => ({ key: String(s), label: `${s}-Star` }));
    }
    const types = [...new Set(allItems.map((a) => a.type))];
    return types.map((t) => ({ key: slugify(t), label: t }));
  }, [allItems, isHotels]);

  const filterOptions = useMemo(() => {
    const out = {};
    filterDefs.forEach(({ field }) => {
      const set = new Set();
      (allItems ?? []).forEach((i) => (i[field] ?? []).forEach((v) => set.add(v)));
      out[field] = [...set].sort().map((v) => ({ key: v, label: v }));
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, kind]);

  const items = useMemo(() => {
    let list = allItems ?? [];
    if (category) {
      list = isHotels ? list.filter((h) => String(h.stars) === category) : list.filter((a) => slugify(a.type) === category);
    }
    filterDefs.forEach(({ field }) => {
      const set = checkboxFilters[field];
      if (set && set.size > 0) {
        list = list.filter((i) => [...set].every((v) => i[field]?.includes(v)));
      }
    });
    if (appliedLocation) {
      list = list.filter(
        (i) => typeof i.lat === "number" && milesBetween(i.lat, i.lng, appliedLocation.lat, appliedLocation.lng) <= appliedLocation.radius
      );
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.tagline ?? "").toLowerCase().includes(q));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, category, checkboxFilters, appliedLocation, query, isHotels]);

  if (!landing) return <Navigate to="/mobile/live" replace />;

  // When any filter/search is active, carry the current filtered URL
  // forward as a `back` param on every card link, so the detail page can
  // offer an explicit "Back to results" that returns to this exact
  // filtered view rather than the unfiltered listing.
  const currentQuery = searchParams.toString();
  const backParam = currentQuery ? `?back=${encodeURIComponent(`/mobile/live/${kind}?${currentQuery}`)}` : "";

  return (
    <MobileShell title={landing.title} onBack backFallback="/mobile/live" noPadding>
      <div className="flex flex-col">
        {landing.heroImage && (
          <div className="relative h-40 -mb-1">
            <img src={landing.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.05) 0%, rgba(20,33,42,0.55) 100%)" }} />
            <p className="absolute bottom-3 left-5 text-white text-lg font-bold" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
              {landing.title}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 mobile-stagger px-5 pt-5 pb-6">
        <p className="text-sm font-medium" style={{ color: "#000000" }}>{landing.intro}</p>

        <OffersLink />

        <ListSearch value={query} onChange={setQuery} placeholder={`Search ${landing.title}…`} />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
          <FilterSheet
            title={isHotels ? "Property Rating" : "Property Type"}
            triggerLabel={categories.find((c) => c.key === category)?.label ?? (isHotels ? "Property Rating" : "Property Type")}
            options={categories}
            value={category}
            onChange={setCategory}
            allLabel={isHotels ? "All Ratings" : "All Types"}
          />
          <PostcodeFilterSheet
            appliedLocation={appliedLocation}
            onApply={applyLocation}
            onClear={clearLocation}
          />
          {filterDefs.map(({ field, label }) => {
            const options = filterOptions[field] ?? [];
            if (options.length === 0) return null;
            const selected = checkboxFilters[field] ?? new Set();
            return (
              <FilterSheet
                key={field}
                title={label}
                triggerLabel={`${label}${selected.size > 0 ? ` (${selected.size})` : ""}`}
                options={options}
                multi
                value={selected}
                onChange={setCheckboxField(field)}
              />
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {items.map((p) => (
            <Link key={p.slug} to={`/mobile/stay/${kind}/${p.slug}${backParam}`}>
              <MobileCard className="flex items-stretch overflow-hidden active:opacity-90">
                <img src={p.image} alt="" className="w-28 h-28 object-cover shrink-0" />
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--teal-deep)" }}>
                    {isHotels ? `${"★".repeat(p.stars)} Hotel` : p.type}
                  </span>
                  <p className="text-sm font-bold leading-snug mt-0.5" style={{ color: "#000000" }}>{p.name}</p>
                  <p className="text-xs mt-1 leading-snug line-clamp-2 font-medium" style={{ color: "#000000" }}>{p.tagline}</p>
                  <span className="inline-flex items-center gap-0.5 self-start text-[10px] font-bold mt-1.5" style={{ color: "var(--leaf)" }}>
                    Read more
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </span>
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
      </div>
    </MobileShell>
  );
}

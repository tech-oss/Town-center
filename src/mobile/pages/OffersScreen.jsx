import { useMemo, useState } from "react";
import FitImage from "../../components/FitImage";
import { appSectionLabel } from "../lib/sectionLabels";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import useSiteSection from "../../hooks/useSiteSection";
import SmartImage from "../../components/SmartImage";
import FilterSheet from "../components/FilterSheet";
import useFetch from "../../hooks/useFetch";
import { getOffersFeed } from "../../api";
import { sections } from "../../Data/pages";
import { TYPE_COLORS, typeColor } from "../lib/typeColors";
import OfferTag from "../../components/OfferTag";
import { categoryColor } from "../../lib/categoryColors";

const BUSINESS_TYPES = [
  ...Object.values(sections).map((s) => ({ key: s.key, label: appSectionLabel(s.key, s.label), color: categoryColor(s.key) })),
  { key: "stay", label: "Hotels & Accommodation", color: categoryColor("stay") },
];

const TYPE_ORDER = ["Featured", "Offer", "News"];


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
  // Stories and every live news post and offer (events live in See & Do and
  // the calendar) — the same list the website shows (api/offers.js).
  const { data: feed } = useFetch(getOffersFeed, []);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [activeBusinessType, setActiveBusinessType] = useState(null);

  const items = useMemo(() => (feed ?? []).map((it) => ({ ...it, to: `/mobile${it.to}` })), [feed]);

  const types = useMemo(() => TYPE_ORDER.filter((t) => items.some((it) => it.type === t)), [items]);

  const trimmedSearch = search.trim().toLowerCase();
  const filtered = items.filter((it) => {
    if (activeType && it.type !== activeType) return false;
    if (activeBusinessType && it.businessSection !== activeBusinessType) return false;
    if (!trimmedSearch) return true;
    return (
      it.title?.toLowerCase().includes(trimmedSearch) ||
      it.businessName?.toLowerCase().includes(trimmedSearch) ||
      it.type?.toLowerCase().includes(trimmedSearch) ||
      it.category?.toLowerCase().includes(trimmedSearch)
    );
  });

  const copy = useSiteSection("offers");
  return (
    <MobileShell title={copy.eyebrow || "Offers & Stories"} onBack backFallback="/mobile/home">
      <div className="flex flex-col gap-4 mobile-stagger">
        {/* Same header as the website — Site Content → Offers & Stories. */}
        {copy.hero && <SmartImage src={copy.hero} alt="" size="card" eager sizes="100vw" className="w-full aspect-[16/9] object-cover rounded-2xl" />}
        <p className="text-sm" style={{ color: "#000000" }}>{copy.intro}</p>

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
                key={it.key}
                to={it.to}
                className="group relative bg-white overflow-hidden flex flex-col active:opacity-90"
                style={{ borderRadius: 14, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <FitImage src={it.image} alt={it.title} className="w-full h-full" />
                  {it.homepage && (
                    <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--forest)", color: "#fff" }}>
                      On Homepage
                    </span>
                  )}
                  {it.type === "Offer" && <OfferTag />}
                </div>
                <div className="flex flex-col gap-1 p-2.5">
                  {it.type && (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide w-fit" style={{ color: "#000000" }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: typeColor(it.type) }} />
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

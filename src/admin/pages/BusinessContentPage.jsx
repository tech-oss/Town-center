import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getBusinessesForContent, getBusinessListingContent, saveBusinessListingContent,
} from "../../api/admin/businessListingContent";
import {
  StatusDot, NAVY, BLUE, MUTED, BORDER, useToast, Toast,
} from "./businessContent/shared";
import TypeAEditor from "./businessContent/TypeAEditor";
import { PlanContext } from "./businessContent/shared";
import { isPremium } from "../../Data/plans";
import TypeBEditor from "./businessContent/TypeBEditor";
import TypeCEditor from "./businessContent/TypeCEditor";

// Admin's "Business Type" values (see src/Data/taxonomy.js) grouped the same
// way the left-hand list has always been grouped. "services" and "hotel" get
// their own editor shape below; "live" was a section on the old mock dataset
// that has no equivalent business type any more.
const SECTION_ORDER = ["see-do", "eat-drink", "shop", "services", "hotel"];
const SECTION_LABELS = {
  "see-do": "See & Do",
  "eat-drink": "Eat & Drink",
  shop: "Shop",
  services: "Services",
  hotel: "Hotel & Accommodation",
};

function NoContentBadge() {
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
      style={{ backgroundColor: "rgba(100,116,139,0.15)", color: "#475569" }}>
      No Content
    </span>
  );
}

export default function BusinessContentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [businesses, setBusinesses] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [listing, setListing] = useState(null);
  const [loadingListing, setLoadingListing] = useState(false);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useToast();

  useEffect(() => {
    getBusinessesForContent().then(setBusinesses);
  }, []);

  // Arriving from Business Registrations' "Add Content" / "Edit Content"
  // link — pre-select the business the URL's businessId param points to.
  useEffect(() => {
    const businessId = searchParams.get("businessId");
    if (businessId) setSelectedId(businessId);
    // Only re-run when the URL itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("businessId")]);

  useEffect(() => {
    if (!selectedId) { setListing(null); return; }
    let cancelled = false;
    setLoadingListing(true);
    getBusinessListingContent(selectedId).then((data) => {
      if (!cancelled) { setListing(data); setLoadingListing(false); }
    });
    return () => { cancelled = true; };
  }, [selectedId]);

  const selectedBusiness = (businesses ?? []).find((b) => b.id === selectedId) ?? null;

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (businesses ?? []).filter((b) => !q || b.name.toLowerCase().includes(q));
    const groups = SECTION_ORDER.map((section) => ({
      section,
      label: SECTION_LABELS[section],
      items: filtered.filter((b) => b.section === section),
    })).filter((g) => g.items.length > 0);
    const unknown = filtered.filter((b) => !SECTION_ORDER.includes(b.section));
    if (unknown.length) groups.push({ section: "other", label: "Other", items: unknown });
    return groups;
  }, [businesses, query]);

  function set(key, value) {
    setListing((l) => ({ ...l, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveBusinessListingContent(selectedId, listing);
      setToast("Changes published to the live site.");
      setBusinesses((prev) => prev.map((b) => (b.id === selectedId ? { ...b, hasContent: true } : b)));
      setListing((l) => ({ ...l, hasContent: true }));
    } catch (e) {
      setToast(e.message ?? "Something went wrong saving this content.");
    }
    setSaving(false);
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] min-h-[600px]">
      {/* ── Left panel: business list ── */}
      <div className="w-72 shrink-0 bg-white rounded-2xl flex flex-col overflow-hidden"
        style={{ border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: NAVY }}>Business Content</h2>
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search businesses…"
            className="w-full rounded-xl px-3 py-2 text-xs outline-none"
            style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#f8fafc" }}
          />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {businesses === null && (
            <p className="text-xs text-center py-6" style={{ color: MUTED }}>Loading…</p>
          )}
          {businesses !== null && grouped.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: MUTED }}>No businesses match your search.</p>
          )}
          {grouped.map((g) => (
            <div key={g.section} className="mb-1">
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{g.label}</p>
              {g.items.map((b) => (
                <button key={b.id} onClick={() => setSelectedId(b.id)}
                  title={!b.hasContent ? "This business has no content yet. Click to start adding." : undefined}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors"
                  style={{ backgroundColor: selectedId === b.id ? "rgba(37,99,235,0.08)" : "transparent" }}>
                  {b.hasContent ? <StatusDot status="Published" /> : <NoContentBadge />}
                  <span className="text-sm truncate flex-1" style={{ color: selectedId === b.id ? BLUE : NAVY, fontWeight: selectedId === b.id ? 600 : 400 }}>
                    {b.name}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: editor ── */}
      <div className="flex-1 overflow-y-auto">
        {!selectedId ? (
          <div className="h-full flex items-center justify-center rounded-2xl bg-white"
            style={{ border: "1px dashed rgba(16,24,40,0.15)", minHeight: 400 }}>
            <div className="text-center">
              <p className="text-4xl mb-2">🗂️</p>
              <p className="text-sm font-medium" style={{ color: MUTED }}>Select a business to edit</p>
            </div>
          </div>
        ) : loadingListing || !listing ? (
          <p className="text-sm py-10 text-center" style={{ color: MUTED }}>Loading content…</p>
        ) : (
          <div className="max-w-3xl pb-10">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <button onClick={() => setSelectedId(null)} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: NAVY }}>← All Businesses</button>
              <span className="text-sm" style={{ color: MUTED }}>/</span>
              <h1 className="text-lg font-bold" style={{ color: NAVY }}>{selectedBusiness?.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>
                {SECTION_LABELS[selectedBusiness?.section] ?? selectedBusiness?.section}
              </span>
            </div>
            <p className="text-xs mb-6" style={{ color: "#9CA3AF" }}>
              Address, phone, website and coordinates below are pulled directly from this business's registration — editing them here updates the same record, published immediately (admin edits don't need approval).
            </p>

            {!isPremium(listing.plan) && (
              <div className="rounded-xl px-4 py-3 mb-5 text-xs flex items-start gap-3 flex-wrap"
                style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>
                <span className="font-bold">Free plan.</span>
                <span className="flex-1 min-w-[200px]">Only the business name, address, phone, email and hero image can be edited. Fields marked 🔒 Premium stay locked until the business is moved to Premium.</span>
                <button type="button" onClick={() => navigate("/admin/businesses")} className="font-semibold underline">Change plan</button>
              </div>
            )}

            <PlanContext.Provider value={listing.plan}>
            {(selectedBusiness?.section === "see-do" || selectedBusiness?.section === "eat-drink" || selectedBusiness?.section === "shop") && (
              <TypeAEditor form={listing} set={set} onSave={handleSave} saving={saving} />
            )}
            {selectedBusiness?.section === "services" && (
              <TypeBEditor form={listing} set={set} onSave={handleSave} saving={saving} />
            )}
            {selectedBusiness?.section === "hotel" && (
              <TypeCEditor form={listing} set={set} onSave={handleSave} saving={saving} />
            )}
            </PlanContext.Provider>
            {!["see-do", "eat-drink", "shop", "services", "hotel"].includes(selectedBusiness?.section) && (
              <div className="bg-white rounded-2xl p-6 text-sm" style={{ color: MUTED, border: "1px solid rgba(16,24,40,0.08)" }}>
                This business has no registered business type yet, so there's no content form to show. Approve its registration first.
              </div>
            )}
          </div>
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { BUSINESS_CONTENT, SECTION_LABELS, createBlankBusinessContent } from "../../Data/adminBusinessContentMock";
import { markBusinessHasContent } from "../../api/admin";
import {
  StatusDot, NAVY, BLUE, MUTED, BORDER, useToast, Toast,
  NewBusinessBanner, ProgressSteps, computeProgressSteps,
} from "./businessContent/shared";
import TypeAEditor from "./businessContent/TypeAEditor";
import TypeBEditor from "./businessContent/TypeBEditor";
import TypeCEditor from "./businessContent/TypeCEditor";
import TypeDEditor from "./businessContent/TypeDEditor";

const SECTION_ORDER = ["see-do", "eat-drink", "shop", "services", "live-stay", "explore"];

// Grey "No Content" badge shown in the left list for a registered business
// that has no page content yet — replaces the usual Published/Draft dot.
function NoContentBadge() {
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
      style={{ backgroundColor: "rgba(100,116,139,0.15)", color: "#475569" }}>
      No Content
    </span>
  );
}

export default function BusinessContentPage() {
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();

  const [businesses, setBusinesses] = useState(() => BUSINESS_CONTENT.map((b) => ({ ...b })));
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useToast();

  // Arriving from "Add Content Now" / "Add / Edit Content" — pre-select the
  // business the id/name/section URL params point to, synthesising a blank
  // draft entry if no content record exists for it yet.
  useEffect(() => {
    const businessId = searchParams.get("businessId");
    if (!businessId) return;

    // Resolve existing-vs-blank atomically inside the updater (reading the
    // true current state, not a stale render-time snapshot) so this can't
    // double-insert a duplicate draft — e.g. under React StrictMode's
    // dev-only double effect invocation.
    let resolvedId = businessId;
    setBusinesses((prev) => {
      const existing = prev.find((b) => b.id === businessId || b.registrationId === businessId);
      if (existing) {
        resolvedId = existing.id;
        return prev;
      }
      const name = searchParams.get("name") || "New Business";
      const rawSection = searchParams.get("section") || "shop";
      // The registration form's "Live" section value doesn't match the
      // content editor's "live-stay" section key — normalise it here.
      const section = rawSection === "live" ? "live-stay" : rawSection;
      const blank = createBlankBusinessContent({ id: businessId, name, section, registrationId: businessId });
      resolvedId = blank.id;
      return [blank, ...prev];
    });
    setSelectedId(resolvedId);
    // Only re-run when the URL itself changes — not on every local edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  const selected = businesses.find((b) => b.id === selectedId) ?? null;

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = businesses.filter((b) => !q || b.name.toLowerCase().includes(q));
    return SECTION_ORDER.map((section) => ({
      section,
      label: SECTION_LABELS[section],
      items: filtered.filter((b) => b.section === section),
    })).filter((g) => g.items.length > 0);
  }, [businesses, query]);

  function set(key, value) {
    setBusinesses((all) => all.map((b) => (b.id === selectedId ? { ...b, [key]: value } : b)));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast("Changes saved successfully");
      // First save on a freshly-registered business — clear its Content
      // Pending state here and back on the Business Registrations list.
      // TODO: persist to Supabase on backend integration
      if (selected && !selected.hasContent) {
        set("hasContent", true);
        if (selected.registrationId) markBusinessHasContent(selected.registrationId);
      }
    }, 500);
  }

  const showProgress = selected && !selected.hasContent;

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
          {grouped.length === 0 && (
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
                  {b.hasContent ? <StatusDot status={b.status} /> : <NoContentBadge />}
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
        {!selected ? (
          <div className="h-full flex items-center justify-center rounded-2xl bg-white"
            style={{ border: "1px dashed rgba(16,24,40,0.15)", minHeight: 400 }}>
            <div className="text-center">
              <p className="text-4xl mb-2">🗂️</p>
              <p className="text-sm font-medium" style={{ color: MUTED }}>Select a business to edit</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl pb-10">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <button onClick={() => setSelectedId(null)} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: NAVY }}>← All Businesses</button>
              <span className="text-sm" style={{ color: MUTED }}>/</span>
              <h1 className="text-lg font-bold" style={{ color: NAVY }}>{selected.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>
                {SECTION_LABELS[selected.section]}
              </span>
              {selected.hasContent ? <StatusDot status={selected.status} /> : <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: "rgba(100,116,139,0.15)", color: "#475569" }}>No Content</span>}
            </div>

            {showProgress && <NewBusinessBanner name={selected.name} />}
            {showProgress && <ProgressSteps steps={computeProgressSteps(selected)} />}

            {(selected.section === "see-do" || selected.section === "eat-drink" || selected.section === "shop") && (
              <TypeAEditor form={selected} set={set} onSave={handleSave} saving={saving} />
            )}
            {selected.section === "services" && (
              <TypeBEditor form={selected} set={set} onSave={handleSave} saving={saving} />
            )}
            {selected.section === "live-stay" && (
              <TypeCEditor form={selected} set={set} onSave={handleSave} saving={saving} />
            )}
            {selected.section === "explore" && (
              <TypeDEditor form={selected} set={set} onSave={handleSave} saving={saving} />
            )}
          </div>
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}

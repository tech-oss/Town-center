import { useState, useMemo } from "react";
import { BUSINESS_CONTENT, SECTION_LABELS } from "../../Data/adminBusinessContentMock";
import { StatusDot, NAVY, BLUE, MUTED, BORDER, useToast, Toast } from "./businessContent/shared";
import TypeAEditor from "./businessContent/TypeAEditor";
import TypeBEditor from "./businessContent/TypeBEditor";
import TypeCEditor from "./businessContent/TypeCEditor";
import TypeDEditor from "./businessContent/TypeDEditor";

const SECTION_ORDER = ["see-do", "eat-drink", "shop", "services", "live-stay", "explore"];

export default function BusinessContentPage() {
  const [businesses, setBusinesses] = useState(() => BUSINESS_CONTENT.map((b) => ({ ...b })));
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useToast();

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
    }, 500);
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
          {grouped.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: MUTED }}>No businesses match your search.</p>
          )}
          {grouped.map((g) => (
            <div key={g.section} className="mb-1">
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{g.label}</p>
              {g.items.map((b) => (
                <button key={b.id} onClick={() => setSelectedId(b.id)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors"
                  style={{ backgroundColor: selectedId === b.id ? "rgba(37,99,235,0.08)" : "transparent" }}>
                  <StatusDot status={b.status} />
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
              <StatusDot status={selected.status} />
            </div>

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

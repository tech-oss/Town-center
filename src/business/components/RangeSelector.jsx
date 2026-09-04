import { useState } from "react";
import { FOREST, BORDER, MUTED } from "./FormKit";
import { RANGE_PRESETS } from "../api/analyticsRanges";

// value: { type: "preset", key } | { type: "custom", from, to }
export default function RangeSelector({ value, onChange }) {
  const [customOpen, setCustomOpen] = useState(value?.type === "custom");
  const [draftFrom, setDraftFrom] = useState(value?.type === "custom" ? value.from : "");
  const [draftTo, setDraftTo] = useState(value?.type === "custom" ? value.to : "");

  function applyCustom() {
    if (!draftFrom || !draftTo) return;
    onChange({ type: "custom", from: draftFrom, to: draftTo });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="inline-flex rounded-xl p-1 flex-wrap" style={{ backgroundColor: "rgba(28,46,56,0.05)" }}>
        {RANGE_PRESETS.map((opt) => {
          const active = value?.type === "preset" && opt.key === value.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => { setCustomOpen(false); onChange({ type: "preset", key: opt.key }); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={active
                ? { backgroundColor: "#fff", color: FOREST, boxShadow: "0 1px 3px rgba(16,24,40,0.12)" }
                : { color: "#64748B" }}
            >
              {opt.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCustomOpen((o) => !o)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={value?.type === "custom"
            ? { backgroundColor: "#fff", color: FOREST, boxShadow: "0 1px 3px rgba(16,24,40,0.12)" }
            : { color: "#64748B" }}
        >
          Custom
        </button>
      </div>

      {customOpen && (
        <div className="flex items-center gap-2 rounded-xl p-2" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
          <input type="date" value={draftFrom} max={draftTo || undefined} onChange={(e) => setDraftFrom(e.target.value)}
            className="text-xs rounded-lg px-2 py-1.5 outline-none" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }} />
          <span className="text-xs" style={{ color: MUTED }}>to</span>
          <input type="date" value={draftTo} min={draftFrom || undefined} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDraftTo(e.target.value)}
            className="text-xs rounded-lg px-2 py-1.5 outline-none" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }} />
          <button type="button" onClick={applyCustom} disabled={!draftFrom || !draftTo}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40" style={{ backgroundColor: "var(--sage)" }}>
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

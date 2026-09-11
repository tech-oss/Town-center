import { useState } from "react";
import { NAVY, BORDER, MUTED, BLUE } from "../theme";
import UKDateInput from "./UKDateInput";

// value: preset key string ("6m") | { type: "custom", from, to }
// presets: [{ key, label }]
export default function RangeSelector({ value, onChange, presets }) {
  const isCustom = value && typeof value === "object" && value.type === "custom";
  const [open, setOpen] = useState(isCustom);
  const [draftFrom, setDraftFrom] = useState(isCustom ? value.from : "");
  const [draftTo, setDraftTo] = useState(isCustom ? value.to : "");

  function applyCustom() {
    if (!draftFrom || !draftTo) return;
    onChange({ type: "custom", from: draftFrom, to: draftTo });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex rounded-xl p-1 flex-wrap" style={{ backgroundColor: "rgba(16,24,40,0.05)" }}>
        {presets.map((opt) => {
          const active = value === opt.key;
          return (
            <button key={opt.key} type="button"
              onClick={() => { setOpen(false); onChange(opt.key); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={active ? { backgroundColor: "#fff", color: NAVY, boxShadow: "0 1px 3px rgba(16,24,40,0.12)" } : { color: MUTED }}>
              {opt.label}
            </button>
          );
        })}
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={isCustom ? { backgroundColor: "#fff", color: NAVY, boxShadow: "0 1px 3px rgba(16,24,40,0.12)" } : { color: MUTED }}>
          Custom
        </button>
      </div>

      {open && (
        <div className="flex items-center gap-2 rounded-xl p-2 w-fit" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#fff" }}>
          <UKDateInput value={draftFrom} max={draftTo || undefined} onChange={(e) => setDraftFrom(e.target.value)}
            className="text-xs rounded-lg px-2 py-1.5 outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }} />
          <span className="text-xs" style={{ color: MUTED }}>to</span>
          <UKDateInput value={draftTo} min={draftFrom || undefined} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDraftTo(e.target.value)}
            className="text-xs rounded-lg px-2 py-1.5 outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }} />
          <button type="button" onClick={applyCustom} disabled={!draftFrom || !draftTo}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40" style={{ backgroundColor: BLUE }}>
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

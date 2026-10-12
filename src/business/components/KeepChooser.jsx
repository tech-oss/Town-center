import { useState } from "react";
import { CARD, BORDER, MUTED, FOREST, SAGE } from "./FormKit";
import StateChip from "./PropertyStateChip";

// Choosing which properties stay live when a plan change allows fewer than
// are using a slot. The others become inactive at the change — kept, not
// deleted — and can be reactivated after upgrading again.
//
// `properties`: the ones using a slot ({ id, name, state, address }).
// `limit`: how many the new plan allows.
export default function KeepChooser({ title, intro, properties, limit, initial, confirmLabel, busy, onConfirm, onCancel }) {
  const [chosen, setChosen] = useState(() => (initial?.length ? initial : properties.filter((p) => p.state === "live").map((p) => p.id)).slice(0, limit));
  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < limit ? [...c, id] : c));
  const needed = Math.min(limit, properties.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.55)" }}
      role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full flex flex-col gap-4 max-h-[90vh]" style={CARD} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold" style={{ color: FOREST }}>{title}</h2>
        <p className="text-sm" style={{ color: "#334155" }}>{intro}</p>
        <p className="text-xs font-semibold" style={{ color: chosen.length === needed ? "#047857" : "#B45309" }}>
          {chosen.length} of {needed} chosen
        </p>
        <ul className="flex flex-col gap-2 overflow-y-auto">
          {properties.map((p) => {
            const on = chosen.includes(p.id);
            const full = !on && chosen.length >= limit;
            return (
              <li key={p.id}>
                <label className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${full ? "opacity-50" : "cursor-pointer"}`}
                  style={{ border: `1.5px solid ${on ? SAGE : BORDER}`, backgroundColor: on ? "rgba(37,99,235,0.05)" : "#fff" }}>
                  <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(p.id)} className="w-4 h-4" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate" style={{ color: FOREST }}>{p.name}</span>
                    {p.address && <span className="block text-xs truncate" style={{ color: MUTED }}>{p.address}</span>}
                  </span>
                  <StateChip state={p.state} />
                </label>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
          <button type="button" onClick={() => onConfirm(chosen)} disabled={busy || chosen.length !== needed}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: SAGE }}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

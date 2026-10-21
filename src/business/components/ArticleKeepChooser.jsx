import { useState } from "react";
import { CARD, BORDER, MUTED, FOREST, SAGE } from "./FormKit";

// Choosing which live articles stay live when a plan allows fewer than are
// live. The others are hidden — kept, not deleted — and can be put live
// again when there's room (more articles on a bigger plan, or extras bought).
//
// `articles`: the live ones ({ id, title, type }). `limit`: how many may stay.
export default function ArticleKeepChooser({ title, intro, articles, limit, initial, confirmLabel, busy, onConfirm, onCancel }) {
  const [chosen, setChosen] = useState(() => (initial?.length ? initial : articles.map((a) => a.id)).slice(0, limit));
  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < limit ? [...c, id] : c));
  const needed = Math.min(limit, articles.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.55)" }}
      role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full flex flex-col gap-4 max-h-[90vh]" style={CARD} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold" style={{ color: FOREST }}>{title}</h2>
        <p className="text-sm" style={{ color: "#334155" }}>{intro}</p>
        <p className="text-xs font-semibold" style={{ color: chosen.length === needed ? "#047857" : "#B45309" }}>
          {chosen.length} of {needed} chosen
        </p>
        {needed === 0 ? (
          <p className="text-sm" style={{ color: MUTED }}>None of your articles can stay live on this plan. They'll be hidden, not deleted.</p>
        ) : (
          <ul className="flex flex-col gap-2 overflow-y-auto">
            {articles.map((a) => {
              const on = chosen.includes(a.id);
              const full = !on && chosen.length >= limit;
              return (
                <li key={a.id}>
                  <label className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${full ? "opacity-50" : "cursor-pointer"}`}
                    style={{ border: `1.5px solid ${on ? SAGE : BORDER}`, backgroundColor: on ? "rgba(37,99,235,0.05)" : "#fff" }}>
                    <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(a.id)} className="w-4 h-4" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate" style={{ color: FOREST }}>{a.title}</span>
                      {a.type && <span className="block text-xs" style={{ color: MUTED }}>{a.type}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
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

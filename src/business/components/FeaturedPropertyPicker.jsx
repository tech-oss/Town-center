import { useEffect, useState } from "react";
import { CARD, BORDER, MUTED, FOREST, SAGE } from "./FormKit";
import { listFeaturedSlots, assignFeaturedProperty } from "../api/accommodationBilling";
import { listProperties } from "../api/accommodation";

// An accommodation company's Featured Business slots: the company buys the
// slot, then chooses which of its live properties it shows — and can switch
// to another while the slot runs. A slot whose property is no longer live
// shows nothing until another is chosen.

const fmt = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function FeaturedPropertyPicker({ companyId, onToast }) {
  const [slots, setSlots] = useState(null);
  const [live, setLive] = useState([]);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listFeaturedSlots(companyId), listProperties(companyId)])
      .then(([s, props]) => { if (!cancelled) { setSlots(s); setLive(props.filter((p) => p.state === "live")); } })
      .catch(() => { if (!cancelled) setSlots([]); });
    return () => { cancelled = true; };
  }, [companyId]);

  if (!slots?.length) return null;

  async function assign(slot, propertyId) {
    setBusy(slot.id);
    try {
      await assignFeaturedProperty(slot.id, propertyId);
      setSlots((list) => list.map((s) => (s.id === slot.id ? { ...s, propertyId, status: s.status === "approved" ? "approved" : "pending_approval" } : s)));
      onToast?.(slot.status === "approved" ? "Your Featured Business slot now shows that property." : "Sent to Maidenhead admin for approval.");
    } catch (e) {
      onToast?.(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
      <div>
        <p className="text-sm font-bold" style={{ color: FOREST }}>Featured Business — which property it shows</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>Your slot promotes one of your live properties. You can switch to another while it runs.</p>
      </div>
      {slots.map((slot) => {
        const showing = live.find((p) => p.id === slot.propertyId);
        return (
          <div key={slot.id} className="flex items-center gap-3 flex-wrap rounded-xl px-3 py-2.5" style={{ border: `1.5px solid ${BORDER}` }}>
            <span className="text-xs font-semibold" style={{ color: FOREST }}>{fmt(slot.startsAt)} – {fmt(slot.endsAt)}</span>
            {!showing && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(217,119,6,0.12)", color: "#92400E" }}>
                {live.length ? "Choose a property" : "Needs a live property"}
              </span>
            )}
            <select value={showing ? slot.propertyId : ""} disabled={busy === slot.id || !live.length}
              onChange={(e) => e.target.value && assign(slot, e.target.value)}
              className="ml-auto rounded-lg px-3 py-2 text-sm" style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff", minWidth: 200 }}
              aria-label="Property shown in this slot">
              <option value="">{live.length ? "Choose a property…" : "No live properties yet"}</option>
              {live.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {busy === slot.id && <span className="text-xs" style={{ color: SAGE }}>Saving…</span>}
          </div>
        );
      })}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { formatUK } from "../../lib/ukDate";
import { CARD, FOREST, SAGE, MUTED, BORDER } from "./FormKit";
import { ADDON_KINDS, ADDON_SMALLPRINT, getAddonAllowance, buyAddonSlots } from "../api/addonSlots";
import { raisePurchaseRequest } from "../api/purchaseRequests";

// One add-on's packages, what the business already holds, and what a slot
// gets them. Used for articles, events and featured articles alike —
// everything that differs between them lives in ADDON_KINDS.
//
// `isOwner` false (a Content Manager) shows the packages but no Purchase
// button: a Content Manager can edit everything the business has bought, and
// asks the owner when more is needed.
export default function AddonSlotsCard({ businessId, kind, premium, isOwner = true, requestedBy, onToast, compact = false }) {
  const spec = ADDON_KINDS[kind];
  const [slots, setSlots] = useState(null);
  const [buying, setBuying] = useState(false);
  // Which pack a Content Manager is asking the owner for, and the note.
  const [asking, setAsking] = useState(null);
  const [note, setNote] = useState("");
  const [asked, setAsked] = useState(() => new Set());

  const load = useCallback(() => {
    getAddonAllowance(businessId, kind)
      .then(setSlots)
      .catch(() => { /* what's included still applies */ });
  }, [businessId, kind]);

  useEffect(load, [load]);

  async function buy(pack) {
    setBuying(true);
    try {
      await buyAddonSlots(businessId, kind, pack);
    } catch (e) {
      onToast?.(e.message);
      setBuying(false);
    }
  }

  async function ask(pack) {
    try {
      await raisePurchaseRequest(businessId, { kind, pack, note, requestedName: requestedBy });
      setAsked((prev) => new Set(prev).add(pack));
      setAsking(null);
      setNote("");
      onToast?.("Sent to the business owner.");
    } catch (e) {
      onToast?.(e.message);
    }
  }

  if (!spec) return null;
  const allowance = slots?.allowance ?? spec.included;

  return (
    <div className={`bg-white rounded-2xl p-5 flex flex-col gap-4 ${compact ? "" : ""}`} style={CARD}>
      <div>
        <p className="text-sm font-bold" style={{ color: FOREST }}>{spec.label}</p>
        <p className="text-xs mt-1" style={{ color: MUTED }}>{spec.intro}</p>
      </div>

      <div className="rounded-xl px-3.5 py-3 text-sm" style={{ backgroundColor: "rgba(37,99,235,0.06)", color: FOREST }}>
        {allowance === 0 ? (
          <>You have no {spec.noun} slots yet.</>
        ) : (
          <>
            <strong>{allowance}</strong> {spec.noun}{allowance === 1 ? "" : "s"} can be on the site at once
            {slots?.extra
              ? ` — ${spec.included} included plus ${slots.extra} purchased.`
              : ` — the ${spec.included} included with your plan.`}
          </>
        )}
      </div>

      {slots?.packs?.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Your slots</p>
          {slots.packs.map((p) => (
            <p key={p.id} className="text-xs" style={{ color: MUTED }}>
              {p.quantity} slot{p.quantity === 1 ? "" : "s"} · valid until {formatUK(p.expiresAt?.slice(0, 10))}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {spec.packs.map((p) => (
          <div key={p.pack} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5" style={{ border: `1.5px solid ${BORDER}` }}>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: FOREST }}>{p.label}</p>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{p.price} · valid 12 months</p>
            </div>
            {isOwner ? (
              <button onClick={() => buy(p.pack)} disabled={buying || !premium}
                className="text-xs font-bold px-4 py-2 rounded-lg shrink-0 text-white disabled:opacity-40"
                style={{ backgroundColor: SAGE }}>
                {buying ? "Opening…" : "Purchase"}
              </button>
            ) : asked.has(p.pack) ? (
              <span className="text-[11px] font-semibold shrink-0" style={{ color: "#15803D" }}>Requested ✓</span>
            ) : (
              <button onClick={() => { setAsking(p.pack); setNote(""); }}
                className="text-xs font-bold px-4 py-2 rounded-lg shrink-0"
                style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }}>
                Ask the owner
              </button>
            )}
          </div>
        ))}
      </div>

      {/* A Content Manager can't buy, so this sends the request — with the
          package already chosen — to the owner's dashboard and bell. */}
      {asking != null && (
        <div className="rounded-xl p-3.5 flex flex-col gap-2" style={{ backgroundColor: "rgba(37,99,235,0.06)" }}>
          <p className="text-xs font-bold" style={{ color: FOREST }}>
            Ask the owner for {spec.packs.find((p) => p.pack === asking)?.label}
          </p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Why you need it (optional) — e.g. we want to promote the Christmas menu."
            className="rounded-xl px-3 py-2 text-sm outline-none resize-none"
            style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }} />
          <div className="flex gap-2">
            <button onClick={() => ask(asking)}
              className="text-xs font-bold px-4 py-2 rounded-lg text-white" style={{ backgroundColor: SAGE }}>
              Send request
            </button>
            <button onClick={() => { setAsking(null); setNote(""); }}
              className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!premium && (
        <p className="text-xs" style={{ color: "#92400E" }}>
          Add-ons are available while your Business Visibility subscription is active.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold" style={{ color: FOREST }}>What a slot gets you:</p>
        <ul className="flex flex-col gap-0.5">
          {spec.terms.map((t) => (
            <li key={t} className="text-[11px] flex gap-1.5" style={{ color: MUTED }}><span>•</span>{t}</li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>{ADDON_SMALLPRINT}</p>
    </div>
  );
}

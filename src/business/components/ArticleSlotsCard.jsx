import { useEffect, useState } from "react";
import { formatUK } from "../../lib/ukDate";
import { CARD, FOREST, SAGE, MUTED, BORDER } from "./FormKit";
import {
  ARTICLE_SLOT_PACKS, ARTICLE_SLOT_TERMS, INCLUDED_ARTICLE_SLOTS,
  getArticleAllowance, buyArticleSlots,
} from "../api/articleSlots";

// Extra article slots, alongside the homepage slot bookings — so Subscriptions
// & Billing is the one place that holds everything a business can buy.
//
// A slot is not a one-off article: it is re-usable for 12 months, and the
// business can edit or replace what sits in it as often as it likes.
export default function ArticleSlotsCard({ businessId, premium, onToast }) {
  const [slots, setSlots] = useState(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getArticleAllowance(businessId)
      .then((s) => { if (!cancelled) setSlots(s); })
      .catch(() => { /* the included 3 still apply */ });
    return () => { cancelled = true; };
  }, [businessId]);

  async function buy(pack) {
    setBuying(true);
    try {
      await buyArticleSlots(businessId, pack);
    } catch (e) {
      onToast?.(e.message);
      setBuying(false);
    }
  }

  const allowance = slots?.allowance ?? INCLUDED_ARTICLE_SLOTS;

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
      <div>
        <p className="text-sm font-bold" style={{ color: FOREST }}>Extra Article Slots</p>
        <p className="text-xs mt-1" style={{ color: MUTED }}>
          Want to get more of your news and offers seen across Maidenhead.com and The Maidenhead App?
          Purchase additional article slots and use them throughout the year.
        </p>
      </div>

      <div className="rounded-xl px-3.5 py-3 text-sm" style={{ backgroundColor: "rgba(37,99,235,0.06)", color: FOREST }}>
        <strong>{allowance}</strong> article{allowance === 1 ? "" : "s"} can be live at once
        {slots?.extra ? ` — ${INCLUDED_ARTICLE_SLOTS} included plus ${slots.extra} purchased.` : " — the 3 included with your plan."}
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
        {ARTICLE_SLOT_PACKS.map((p) => (
          <div key={p.pack} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5" style={{ border: `1.5px solid ${BORDER}` }}>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: FOREST }}>{p.label}</p>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{p.price} · valid 12 months</p>
            </div>
            <button onClick={() => buy(p.pack)} disabled={buying || !premium}
              className="text-xs font-bold px-4 py-2 rounded-lg shrink-0 text-white disabled:opacity-40"
              style={{ backgroundColor: SAGE }}>
              {buying ? "Opening…" : "Purchase"}
            </button>
          </div>
        ))}
      </div>

      {!premium && (
        <p className="text-xs" style={{ color: "#92400E" }}>
          Extra article slots are available while your Business Visibility subscription is active.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold" style={{ color: FOREST }}>Your slots give you flexibility:</p>
        <ul className="flex flex-col gap-0.5">
          {ARTICLE_SLOT_TERMS.map((t) => (
            <li key={t} className="text-[11px] flex gap-1.5" style={{ color: MUTED }}><span>•</span>{t}</li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
        Slots are not one-off articles — each slot can be re-used for different content during its 12-month validity.
        If your subscription is cancelled, additional paid add-ons, including unused article slots, are deactivated.
      </p>
    </div>
  );
}

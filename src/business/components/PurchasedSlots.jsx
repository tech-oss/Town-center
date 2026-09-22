import { useEffect, useState } from "react";
import { CARD, FOREST, MUTED, BORDER } from "./FormKit";
import { ADDON_KINDS, getAddonAllowance } from "../api/addonSlots";

// "04.10.26" — the short UK date the business sees on its receipts.
function shortUK(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

const NOUN = { article: "Article slot", event: "Event slot", featured_article: "Featured Article slot" };

// Every slot the business has bought of one kind, one line per slot, with the
// date it was bought and the date it must be used by — so it's always clear
// what's been paid for and when it runs out. A pack of 3 shows as three lines,
// since each slot is its own place on the site.
//
// `refreshKey` reloads it, e.g. after returning from Stripe.
export default function PurchasedSlots({ businessId, kind, refreshKey = 0 }) {
  const [slots, setSlots] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAddonAllowance(businessId, kind)
      .then((s) => { if (!cancelled) setSlots(s); })
      .catch(() => { if (!cancelled) setSlots({ packs: [], included: ADDON_KINDS[kind]?.included ?? 0 }); });
    return () => { cancelled = true; };
  }, [businessId, kind, refreshKey]);

  if (!slots) return null;

  // One line per slot, soonest to expire first.
  const lines = slots.packs
    .flatMap((p) => Array.from({ length: p.quantity }, (_, i) => ({ key: `${p.id}-${i}`, purchasedAt: p.purchasedAt, expiresAt: p.expiresAt })))
    .sort((a, b) => String(a.expiresAt).localeCompare(String(b.expiresAt)));

  const noun = NOUN[kind] ?? "Slot";
  const soon = Date.now() + 30 * 86_400_000;

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
      <p className="text-sm font-bold" style={{ color: FOREST }}>Your purchased {noun.toLowerCase()}s</p>

      {slots.included > 0 && (
        <p className="text-sm" style={{ color: MUTED }}>
          {slots.included} {noun.toLowerCase()}{slots.included === 1 ? "" : "s"} included with your Visibility Plan.
        </p>
      )}

      {lines.length === 0 ? (
        <p className="text-sm" style={{ color: MUTED }}>
          You haven't purchased any {noun.toLowerCase()}s yet.
        </p>
      ) : (
        <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
          {lines.map((l) => {
            const expiringSoon = new Date(l.expiresAt).getTime() < soon;
            return (
              <li key={l.key} className="py-2 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm" style={{ color: FOREST }}>
                  {noun} purchased on <strong>{shortUK(l.purchasedAt)}</strong> expires <strong>{shortUK(l.expiresAt)}</strong>
                </span>
                {expiringSoon && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(217,119,6,0.14)", color: "#92400E" }}>
                    Expires within 30 days
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

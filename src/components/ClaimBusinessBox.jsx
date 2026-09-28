import { useEffect, useState } from "react";

// "Is this your business?" — shown on the profile of a business Maidenhead
// admin registered that nobody has claimed yet (no Owner login), on the
// website and in the app. The link goes to the business portal's claim page.
//
// Unclaimed is read through unclaimed_businesses(), the same public lookup the
// portal's own claim page uses; business_users itself is not readable here.

import { supabase } from "../lib/supabaseClient";

// The business portal is a separate deployment. Set VITE_BUSINESS_PORTAL_URL
// to its permanent address once it has one.
const PORTAL_URL = (import.meta.env.VITE_BUSINESS_PORTAL_URL
  || "https://town-center-l4bfal4jh-muhammad-abuzar-s46-projects1.vercel.app").replace(/\/$/, "");

let unclaimed = null; // one lookup per page load
function loadUnclaimed() {
  if (!unclaimed) {
    unclaimed = supabase.rpc("unclaimed_businesses")
      .then(({ data, error }) => {
        if (error) { unclaimed = null; return new Set(); }
        return new Set((data ?? []).map((b) => b.id));
      })
      .catch(() => { unclaimed = null; return new Set(); });
  }
  return unclaimed;
}

export function useIsUnclaimed(businessId) {
  const [result, setResult] = useState(false);
  useEffect(() => {
    if (!businessId) { setResult(false); return; }
    let cancelled = false;
    loadUnclaimed().then((ids) => { if (!cancelled) setResult(ids.has(businessId)); });
    return () => { cancelled = true; };
  }, [businessId]);
  return result;
}

function StoreIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 18l3-10h30l3 10" />
      <path d="M6 18c0 3 2.5 5 5.5 5s5.5-2 5.5-5c0 3 2.5 5 5.5 5h3c3 0 5.5-2 5.5-5 0 3 2.5 5 5.5 5S42 21 42 18" />
      <path d="M9 23v17h30V23" />
      <path d="M20 40V30h8v10" />
    </svg>
  );
}

// `compact` is the app's layout: a text link rather than a pill button.
export default function ClaimBusinessBox({ businessId, compact = false }) {
  const show = useIsUnclaimed(businessId);
  if (!show) return null;
  const href = `${PORTAL_URL}/business/login`;

  return (
    <section className={compact ? "py-5" : "py-8"}
      style={{ borderTop: "1px solid rgba(28,46,56,0.1)", borderBottom: "1px solid rgba(28,46,56,0.1)" }}>
      <div className={`flex items-center ${compact ? "gap-4" : "gap-8"}`}>
        <div className={`shrink-0 flex items-center justify-center ${compact ? "pr-4" : "pr-8"}`}
          style={{ color: "var(--teal, #3E8E96)", borderRight: "1px solid rgba(28,46,56,0.1)" }}>
          <StoreIcon size={compact ? 40 : 56} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <h3 className={`font-bold ${compact ? "text-base" : "text-xl"}`} style={{ color: "#1C2E38" }}>Is this your business?</h3>
          <p className={compact ? "text-xs leading-relaxed" : "text-base leading-relaxed"} style={{ color: "rgba(28,46,56,0.7)" }}>
            Claim your profile to keep your information up to date and add photos, offers, events and more.
          </p>
          {compact ? (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="self-start text-sm font-semibold mt-1" style={{ color: "var(--teal, #3E8E96)" }}>
              Claim this business →
            </a>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="self-start mt-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--teal, #3E8E96)" }}>
              Claim this business →
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FOREST, SAGE, MUTED, BORDER, CARD } from "./FormKit";
import useNow from "../../hooks/useNow";
import { formatUKDateTime, formatCountdown } from "../../lib/ukDateTime";
import { getMyBookings, BOOKING_STATUS } from "../api/homepageSlots";

// Dashboard card: the business's paid homepage promotions (ad-hoc services)
// that are running or still to start, with their dates and a countdown.
// Manage or book more in Subscriptions & Billing.

const SLOT_LABELS = {
  spotlight: "In the Spotlight",
  featured_article: "Featured Article",
  whats_on: "What's On",
  featured_business: "Featured Business",
};

const TONES = {
  approved: ["#ECFDF5", "#047857"],
  pending_approval: ["#EFF6FF", "#1D4ED8"],
  awaiting_content: ["#FFFBEB", "#92400E"],
  rejected: ["#FEF2F2", "#991B1B"],
};

function Row({ b }) {
  const now = useNow();
  const start = new Date(b.startsAt).getTime();
  const end = new Date(b.endsAt).getTime();
  const running = now >= start;
  // "Live" only once admin has approved it and its time has started.
  const live = running && b.status === "approved";
  const [bg, fg] = live ? ["#DCFCE7", "#15803D"] : (TONES[b.status] ?? ["#F1F5F9", "#475569"]);
  const label = live ? "Live now" : BOOKING_STATUS[b.status] ?? b.status;
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold" style={{ color: FOREST }}>{SLOT_LABELS[b.slotType] ?? b.slotType}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: bg, color: fg }}>{label}</span>
        </div>
        {b.contentTitle && <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>Showing “{b.contentTitle}”</p>}
        <p className="text-xs mt-1 tabular-nums" style={{ color: MUTED }}>
          {formatUKDateTime(b.startsAt)} → {formatUKDateTime(b.endsAt)} UK
        </p>
      </div>
      <span className="text-xs font-semibold tabular-nums whitespace-nowrap" style={{ color: FOREST }}>
        ⏱ {running ? `Ends in ${formatCountdown(end - now)}` : `Starts in ${formatCountdown(start - now)}`}
      </span>
    </div>
  );
}

export default function ActivePromotions({ businessId }) {
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyBookings(businessId)
      .then((rows) => {
        if (!cancelled) setBookings(rows.filter((b) => b.status !== "cancelled" && new Date(b.endsAt) > new Date()));
      })
      .catch(() => { if (!cancelled) setBookings([]); });
    return () => { cancelled = true; };
  }, [businessId]);

  if (bookings === null) return null;

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col" style={CARD}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-sm font-bold" style={{ color: FOREST }}>Your homepage promotions</p>
        <Link to="/business/billing" className="text-xs font-semibold" style={{ color: SAGE }}>
          {bookings.length ? "Manage →" : "Promote your business →"}
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="text-sm" style={{ color: MUTED }}>
          No active promotions. Feature your business or put a post on the homepage from Subscriptions &amp; Billing.
        </p>
      ) : (
        bookings.map((b) => <Row key={b.id} b={b} />)
      )}
    </div>
  );
}

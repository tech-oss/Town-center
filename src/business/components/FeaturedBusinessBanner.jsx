import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useNow from "../../hooks/useNow";
import { formatUKDateTime, formatCountdown } from "../../lib/ukDateTime";
import { getMyBookings, BOOKING_STATUS } from "../api/homepageSlots";

// Top-of-dashboard banner for a bought Featured Business slot: when it runs,
// when it expires, and a live countdown — the thing a business most wants to
// know about what it paid for, which used to sit in a small list further
// down (and only for the owner).

export default function FeaturedBusinessBanner({ businessId, canManage }) {
  const now = useNow();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getMyBookings(businessId)
      .then((rows) => {
        if (cancelled) return;
        setBookings(rows
          .filter((b) => b.slotType === "featured_business" && b.status !== "cancelled" && b.status !== "rejected" && new Date(b.endsAt) > new Date())
          .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [businessId]);

  if (!bookings.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((b) => {
        const start = new Date(b.startsAt).getTime();
        const end = new Date(b.endsAt).getTime();
        const started = now >= start;
        const live = started && b.status === "approved";
        const status = live ? "Live now" : started ? (BOOKING_STATUS[b.status] ?? b.status) : "Booked";
        return (
          <div key={b.id} className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "linear-gradient(135deg, #78350F 0%, #B45309 55%, #F59E0B 100%)" }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-white">⭐ Featured Business</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ backgroundColor: live ? "#DCFCE7" : "rgba(255,255,255,0.2)", color: live ? "#15803D" : "#fff" }}>{status}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                {started ? "Expires" : "Starts"} <strong>{formatUKDateTime(started ? b.endsAt : b.startsAt)}</strong> UK
                {!started && <> · runs until {formatUKDateTime(b.endsAt)}</>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>{started ? "Time left" : "Starts in"}</p>
                <p className="text-xl font-bold tabular-nums text-white">{formatCountdown(started ? end - now : start - now)}</p>
              </div>
              {canManage && (
                <Link to="/business/billing" className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff" }}>Extend / manage</Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

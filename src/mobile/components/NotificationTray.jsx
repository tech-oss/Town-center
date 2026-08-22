import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { typeColor } from "../lib/typeColors";

// Sample push notifications shown behind the home screen's bell. Static for
// now — the shape (image, business, category, copy, when, where it links)
// mirrors a real News & Offers article so a live feed can drop straight in.
// Every entry points at content that actually exists in the app.
export const NOTIFICATIONS = [
  {
    id: "cocoba-end-of-season-sale",
    business: "COCOBA",
    category: "Offer",
    title: "Exclusive end of season delights at Cocoba",
    body: "Handcrafted chocolates, gift boxes and seasonal treats at reduced prices. Get while stocks last!",
    when: "2h ago",
    image: "/images/cocoba/truffles.jpg",
    to: "/mobile/news/cocoba-end-of-season-sale",
    unread: true,
  },
  {
    id: "coppa-champagne-tasting",
    business: "Coppa Club",
    category: "Offer",
    title: "Champagne & Sparkling Tasting Evening",
    body: "Explore Champagne alongside a curated selection of sparkling wines, with light bites throughout. Booking recommended.",
    when: "5h ago",
    image: "/images/coppa/champagne.jpg",
    to: "/mobile/news/coppa-champagne-tasting",
    unread: true,
  },
  {
    id: "coppa-cocktail-masterclass",
    business: "Coppa Club",
    category: "What's On",
    title: "Shake, Stir & Sip: Cocktail Masterclass",
    body: "Learn to mix Coppa Club's signature serves with the in-house bartenders. Places are limited.",
    when: "Yesterday",
    image: "/images/coppa/cocktail.jpg",
    to: "/mobile/news/coppa-cocktail-masterclass",
  },
  {
    id: "jetts-maidenhead",
    business: "Jetts Maidenhead",
    category: "Featured",
    title: "24/7 Fitness in the Heart of Town",
    body: "A new 24-hour gym has opened at One Maidenhead — train whenever you want, on your own terms.",
    when: "2 days ago",
    image: "/images/jetts/entrance.webp",
    to: "/mobile/story/jetts-maidenhead",
  },
];

function TagIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="#fff" />
    </svg>
  );
}

// Drops down under the header like a phone's notification shade. Rendered
// through a portal so it sits above the tab bar and the hero video rather
// than being clipped by the scrolling column.
export default function NotificationTray({ open, onClose }) {
  const navigate = useNavigate();

  // Close on Escape, and don't let the page scroll behind the tray.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const openItem = (item) => {
    onClose();
    navigate(item.to);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[3000] flex justify-center"
      style={{ backgroundColor: "rgba(8,16,20,0.5)", paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      onClick={onClose}
    >
      <div
        className="mobile-tray w-full max-w-[420px] mx-3 self-start rounded-3xl overflow-hidden"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 24px 60px -18px rgba(8,16,20,0.6)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Notifications"
      >
        <div
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ backgroundColor: "var(--forest)" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <h2 className="flex-1 text-sm font-bold text-white">Notifications</h2>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="w-7 h-7 -mr-1 flex items-center justify-center rounded-full active:opacity-70"
            style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrolls internally so a growing feed never pushes the tray past
            the viewport or under the tab bar. */}
        <div className="flex flex-col overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(100vh - 260px)" }}>
          {NOTIFICATIONS.map((n, i) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openItem(n)}
              className="flex items-start gap-3 text-left px-4 py-3.5 active:bg-black/[0.04]"
              style={{
                borderTop: i > 0 ? "1px solid rgba(28,46,56,0.09)" : undefined,
                backgroundColor: n.unread ? "rgba(47,164,164,0.06)" : undefined,
              }}
            >
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                <img src={n.image} alt="" className="w-full h-full object-cover" />
                {/* Tag badge marks offers only — same rule the listing cards use. */}
                {n.category === "Offer" && (
                  <span
                    className="absolute top-1 left-1 rounded-md flex items-center justify-center"
                    style={{ width: 18, height: 18, backgroundColor: "var(--teal-deep)" }}
                  >
                    <TagIcon />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide truncate" style={{ color: typeColor(n.category) }}>
                    {n.business} · {n.category}
                  </span>
                  {n.unread && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: typeColor(n.category) }} />}
                </div>
                <p className="text-sm font-bold leading-snug mt-0.5" style={{ color: "#000000" }}>{n.title}</p>
                <p className="text-xs leading-snug mt-1" style={{ color: "#000000" }}>{n.body}</p>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-[10px] font-medium" style={{ color: "#000000" }}>{n.when}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold shrink-0" style={{ color: "var(--leaf)" }}>
                    Read more
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] font-medium py-3" style={{ color: "#000000", borderTop: "1px solid rgba(28,46,56,0.09)" }}>
          You're all caught up.
        </p>
      </div>
    </div>,
    document.body
  );
}

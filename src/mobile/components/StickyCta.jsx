import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Floating sticky action button — the mobile counterpart of the website's
// "Make a Booking" / ticket CTA (see components/PlaceDetailLayout.jsx), which
// floats in once the in-page button has scrolled out of view. Same gating: it
// only renders when the listing actually has the relevant action enabled.
//
// Rendered through a portal into <body> because the app's scroller sets
// `-webkit-overflow-scrolling: touch`, which on iOS Safari traps `position:
// fixed` descendants inside the scrolling box instead of the viewport.
export default function StickyCta({ label, href, icon, threshold = 380 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const scroller = document.querySelector(".mobile-scroll");
    if (!scroller) return;
    const onScroll = () => setShow(scroller.scrollTop > threshold);
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [threshold]);

  if (!href) return null;

  return createPortal(
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // Centring is done entirely in the inline style: Tailwind v4's
      // `-translate-x-1/2` sets the `translate` property, which would compose
      // with the `transform` below and shift the button twice.
      className="fixed z-[3000] inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-white"
      style={{
        left: "50%",
        bottom: "calc(78px + env(safe-area-inset-bottom, 0px))",
        backgroundColor: "var(--teal-deep)",
        boxShadow: "0 12px 30px -8px rgba(28,46,56,0.7)",
        opacity: show ? 1 : 0,
        transform: `translateX(-50%) translateY(${show ? "0" : "16px"})`,
        pointerEvents: show ? "auto" : "none",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      {icon}
      {label}
    </a>,
    document.body
  );
}

export function TicketIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6Z" />
      <path d="M13 5v14" strokeDasharray="2 3" />
    </svg>
  );
}

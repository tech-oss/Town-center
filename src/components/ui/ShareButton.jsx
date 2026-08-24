import { useState } from "react";

// Share pill used on article-style detail pages (offers/news, featured
// stories) — native share sheet where available, clipboard + toast fallback
// otherwise. Sits inline next to the category/date row rather than in a
// dark hero overlay, so it's styled as a light pill (see GuideDetailPage's
// ShareButton for the dark-hero variant).
export default function ShareButton({ path, title, text }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* user cancelled — no-op */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-opacity hover:opacity-85"
      style={{ backgroundColor: "var(--leaf)", color: "#fff", boxShadow: "0 4px 16px -8px rgba(28,46,56,0.3)" }}
      aria-label="Share"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" />
      </svg>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

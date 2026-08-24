import { useState } from "react";

// Circular share action used on every article-style detail screen (guides,
// offers/news, featured stories, calendar events) — native share sheet where
// available, clipboard + toast fallback otherwise.
export default function ShareButton({ path, title, text, className = "", size = 36 }) {
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
    <>
      <button
        type="button"
        onClick={handleShare}
        className={`shrink-0 rounded-full flex items-center justify-center active:opacity-80 ${className}`}
        style={{ width: size, height: size, backgroundColor: "var(--leaf)" }}
        aria-label="Share"
      >
        <svg width={size * 0.47} height={size * 0.47} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" />
        </svg>
      </button>

      {copied && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-xs font-semibold"
          style={{ bottom: 88, backgroundColor: "rgba(15,26,32,0.95)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          Link copied to clipboard
        </div>
      )}
    </>
  );
}

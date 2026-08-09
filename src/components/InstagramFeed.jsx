import { useEffect, useRef, useState } from "react";
import { footer } from "../Data/content";

// Curated reels shown on the homepage — update this list to rotate the posts.
const POSTS = [
  "https://www.instagram.com/reel/Dbnc_fFRSSe/",
  "https://www.instagram.com/reel/DbYNnf4tDGe/",
  "https://www.instagram.com/reel/Db0TCO7IrQ2/",
];

const instagramHref = footer.social.find((s) => s.icon === "instagram")?.href ?? "https://www.instagram.com";

// Instagram's embed.js scans the page once for `.instagram-media` blockquotes
// and swaps each for a sized iframe — loaded once, lazily, and re-run
// (`window.instgrm.Embeds.process()`) whenever new blockquotes mount.
let scriptPromise = null;
function loadInstagramEmbedScript() {
  if (window.instgrm) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const existing = document.getElementById("instagram-embed-script");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "instagram-embed-script";
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = resolve;
    document.body.appendChild(script);
  });
  return scriptPromise;
}

// One reel embed — reserves a fixed-ratio slot immediately (no layout jump
// once Instagram's iframe swaps in) and shows a soft skeleton until then.
function ReelEmbed({ url }) {
  const [loaded, setLoaded] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadInstagramEmbedScript().then(() => {
      if (cancelled) return;
      window.instgrm?.Embeds?.process();
    });

    // Instagram replaces the <blockquote> with an <iframe> once processed —
    // watch for that swap to know when to hide the skeleton.
    const el = wrapRef.current;
    if (!el) return;
    const observer = new MutationObserver(() => {
      if (el.querySelector("iframe")) {
        setLoaded(true);
        observer.disconnect();
      }
    });
    observer.observe(el, { childList: true, subtree: true });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [url]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full max-w-[400px] mx-auto overflow-hidden rounded-2xl bg-white"
      style={{ aspectRatio: "9 / 16", boxShadow: "0 8px 24px rgba(13,42,51,0.08)" }}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse" style={{ backgroundColor: "var(--mint)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--sage)" }}>
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </div>
      )}
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ background: "#fff", border: 0, margin: 0, padding: 0, width: "100%", minWidth: 0, maxWidth: "100%" }}
      />
    </div>
  );
}

export default function InstagramFeed() {
  return (
    <section className="py-20 md:py-24 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-sm font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>
            Follow Along
          </p>
          <h2 className="home-section-title text-3xl md:text-5xl leading-tight" style={{ color: "#000000" }}>
            On Instagram
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
          {POSTS.map((url) => (
            <ReelEmbed key={url} url={url} />
          ))}
        </div>

        <div className="text-center mt-10 md:mt-12">
          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-70"
            style={{ color: "#000000" }}
          >
            Follow us on Instagram
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

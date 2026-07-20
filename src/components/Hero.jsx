import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { hero } from "../Data/content";
import SmartLink from "./SmartLink";

// Feature-card wrapper: SPA <Link> for internal routes (cta.to), <a> for hash anchors
function CardLink({ cta, className, children }) {
  if (cta.to) return <Link to={cta.to} className={className}>{children}</Link>;
  return <a href={cta.href} className={className}>{children}</a>;
}

const s = hero.slides[0];

// Honour reduced-motion: skip video autoplay (poster stays) for users who ask
// for less motion. Evaluated once at load — this is a CSR (Vite) app.
const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Hero() {
  const videoRef = useRef(null);

  // Robustness fallback: some engines (Safari, mobile power-saving) don't honour
  // the autoplay attribute alone even when muted. Nudge playback once the video
  // can play — unless the user prefers reduced motion, in which case the poster
  // frame stays. Rejections (e.g. autoplay policy) are swallowed silently.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    tryPlay();
    v.addEventListener("canplay", tryPlay, { once: true });
    return () => v.removeEventListener("canplay", tryPlay);
  }, []);

  return (
    <section aria-label="Hero" className="hero-section relative w-full overflow-hidden">
      {/* ── Fullscreen background video ──
          Covers the whole viewport, autoplays muted + looping, plays inline on
          mobile, no controls. The poster paints instantly and is the fallback
          when autoplay is suppressed (reduced-motion / power-saving). */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/hero.mp4"
        poster="/images/hero-poster.jpg"
        autoPlay={!prefersReducedMotion}
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ── Readability overlays (balanced for centred caption) ──
          Flat tint for overall contrast + a soft radial vignette that darkens
          the edges so the white caption reads crisply over any video frame. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: "rgba(12,20,24,0.34)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 92% 72% at 50% 46%, rgba(12,20,24,0) 34%, rgba(12,20,24,0.5) 100%)",
        }}
      />

      {/* ── Caption (centred over the video) ── */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h1
          className="text-white uppercase"
          style={{ fontFamily: "var(--font-heading)", textShadow: "0 2px 32px rgba(0,0,0,0.55)" }}
        >
          <span
            className="block text-base sm:text-lg md:text-2xl font-medium mb-3 md:mb-5"
            style={{ letterSpacing: "0.32em", paddingLeft: "0.32em", color: "rgba(255,255,255,0.92)" }}
          >
            Welcome to
          </span>
          <span className="hero-title block text-6xl sm:text-7xl md:text-8xl leading-none">
            Maidenhead
          </span>
        </h1>

        <div className="flex items-center gap-3 md:gap-4 mt-6 md:mt-8">
          <span className="hidden sm:block" style={{ height: 1, width: 36, background: "rgba(255,255,255,0.55)" }} />
          <p
            className="text-[11px] sm:text-xs md:text-sm font-semibold uppercase"
            style={{
              letterSpacing: "0.22em",
              paddingLeft: "0.22em",
              color: "rgba(255,255,255,0.92)",
              textShadow: "0 1px 12px rgba(0,0,0,0.5)",
            }}
          >
            Riverside · Connected · Thriving
          </p>
          <span className="hidden sm:block" style={{ height: 1, width: 36, background: "rgba(255,255,255,0.55)" }} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURE CARD ("Waterfront Dining & Bars") — COMMENTED OUT per request.
          To restore, delete the opening marker below and the closing marker at
          the end of this block; both the mobile (inline) and desktop (absolute)
          cards render exactly as before.
      ─────────────────────────────────────────────────────────────────────────
      {s.featureCard && (
        <CardLink
          cta={s.featureCard.cta}
          className="md:hidden absolute left-4 right-4 bottom-8 flex items-center gap-3 bg-white rounded-2xl shadow-xl p-3 group z-10"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
            <img src={s.featureCard.image} alt={s.featureCard.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold tracking-wide uppercase mb-0.5" style={{ color: "var(--sage)" }}>{s.featureCard.label}</p>
            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--forest)" }}>{s.featureCard.title}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: "var(--leaf)" }}>{s.featureCard.cta.label}</p>
          </div>
          <span className="text-lg shrink-0" style={{ color: "var(--sage)" }}>→</span>
        </CardLink>
      )}
      {s.featureCard && (
        <CardLink
          cta={s.featureCard.cta}
          className="hidden md:flex absolute bottom-10 right-12 w-72 rounded-2xl overflow-hidden shadow-2xl flex-col bg-white group z-10"
        >
          <div className="h-36 overflow-hidden">
            <img src={s.featureCard.image} alt={s.featureCard.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
          <div className="p-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: "var(--sage)" }}>{s.featureCard.label}</p>
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--forest)" }}>{s.featureCard.title}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: "var(--leaf)" }}>{s.featureCard.cta.label}</p>
            </div>
            <span className="text-xl shrink-0 mt-1 transition-transform duration-150 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
          </div>
        </CardLink>
      )}
      ═══ end feature card ═══ */}
    </section>
  );
}

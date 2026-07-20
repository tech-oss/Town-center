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

      {/* ── Readability overlays (~25% flat tint + bottom gradient) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: "rgba(12,20,24,0.25)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(12,20,24,0.72) 0%, rgba(12,20,24,0.15) 42%, rgba(12,20,24,0) 68%)",
        }}
      />

      {/* ── Content (overlaid, pinned to the bottom-left) ── */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-14 flex flex-col justify-end pb-16 md:pb-24">
        <div className="max-w-2xl">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "var(--mint)" }}
          >
            {s.eyebrow}
          </p>
          <h1
            className="hero-title text-5xl md:text-7xl text-white mb-5"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}
          >
            {s.headline}
          </h1>
          <p
            className="text-lg max-w-xl mb-8 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 12px rgba(0,0,0,0.4)" }}
          >
            {s.subheadline}
          </p>

          {/* Mobile feature card — compact, above the CTAs (desktop uses the
              absolute card bottom-right instead). */}
          {s.featureCard && (
            <CardLink
              cta={s.featureCard.cta}
              className="md:hidden mb-6 flex items-center gap-3 bg-white rounded-2xl shadow-xl p-3 group"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img
                  src={s.featureCard.image}
                  alt={s.featureCard.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold tracking-wide uppercase mb-0.5" style={{ color: "var(--sage)" }}>
                  {s.featureCard.label}
                </p>
                <p className="text-sm font-semibold leading-snug" style={{ color: "var(--forest)" }}>
                  {s.featureCard.title}
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: "var(--leaf)" }}>
                  {s.featureCard.cta.label}
                </p>
              </div>
              <span className="text-lg shrink-0" style={{ color: "var(--sage)" }}>→</span>
            </CardLink>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <SmartLink
              to={s.primaryCta.href}
              className="inline-block text-center px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: "var(--forest)" }}
            >
              {s.primaryCta.label}
            </SmartLink>
            <SmartLink
              to={s.secondaryCta.href}
              className="inline-block text-center px-8 py-3.5 rounded-full text-sm font-semibold border border-white/50 text-white transition-colors duration-150 hover:bg-white/10"
            >
              {s.secondaryCta.label}
            </SmartLink>
          </div>
        </div>
      </div>

      {/* ── Desktop feature card (absolute, bottom-right) ── */}
      {s.featureCard && (
        <CardLink
          cta={s.featureCard.cta}
          className="hidden md:flex absolute bottom-10 right-12 w-72 rounded-2xl overflow-hidden shadow-2xl flex-col bg-white group z-10"
        >
          <div className="h-36 overflow-hidden">
            <img
              src={s.featureCard.image}
              alt={s.featureCard.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="p-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: "var(--sage)" }}>
                {s.featureCard.label}
              </p>
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--forest)" }}>
                {s.featureCard.title}
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: "var(--leaf)" }}>
                {s.featureCard.cta.label}
              </p>
            </div>
            <span
              className="text-xl shrink-0 mt-1 transition-transform duration-150 group-hover:translate-x-1"
              style={{ color: "var(--sage)" }}
            >
              →
            </span>
          </div>
        </CardLink>
      )}
    </section>
  );
}

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { hero } from "../Data/content";
import SmartLink from "./SmartLink";

// Feature-card wrapper: SPA <Link> for internal routes (cta.to), <a> for hash anchors
function CardLink({ cta, className, children }) {
  if (cta.to) return <Link to={cta.to} className={className}>{children}</Link>;
  return <a href={cta.href} className={className}>{children}</a>;
}

const SLIDES = hero.slides;
const TOTAL = SLIDES.length;
const INTERVAL = hero.autoplayInterval;

// ─── Desktop overlay gradient helpers ────────────────────────────────────────
const GRAD_BOTTOM =
  "linear-gradient(to top, rgba(28,46,56,0.92) 0%, rgba(28,46,56,0.55) 38%, rgba(28,46,56,0.20) 70%, rgba(28,46,56,0.10) 100%)";
const GRAD_LEFT =
  "linear-gradient(to right, rgba(28,46,56,0.55) 0%, rgba(28,46,56,0.10) 45%, rgba(28,46,56,0) 70%)";

export default function Hero() {
  const [current, setCurrent] = useState(0);
  // Autoplay pauses while `paused` is true; currently always false (no pause trigger wired).
  const [paused] = useState(false);

  // ── Mobile section height lock ────────────────────────────────────────────
  // Measures the TOTAL HEIGHT of every slide (image + card + copy — everything)
  // at the actual device width, then pins the section to the tallest one.
  // This means the section never changes size on rotation no matter what varies
  // inside (card title wrapping, copy line count, images, etc.).
  const sectionRef = useRef(null);
  const [mobileSectionMinH, setMobileSectionMinH] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (window.innerWidth >= 768) {
        setMobileSectionMinH(0); // clear when resizing to desktop
        return;
      }

      const section = sectionRef.current;
      if (!section) return;

      const allSlides = [...section.querySelectorAll("[data-slide]")];
      if (!allSlides.length) return;

      // Save current display states
      const savedDisplay = allSlides.map((s) => s.style.display);

      // Step 1 — strip any section min-height so it doesn't influence measurements
      section.style.minHeight = "0";

      // Step 2 — show every slide (invisible to user) so each can be measured
      allSlides.forEach((s) => {
        s.style.display = "block";
        s.style.visibility = "hidden";
      });
      document.body.offsetHeight; // force reflow

      // Step 3 — tallest full slide height (includes image + card + copy)
      const maxH = Math.max(...allSlides.map((s) => s.offsetHeight));

      // Step 4 — restore display states and remove the override
      allSlides.forEach((s, i) => {
        s.style.display = savedDisplay[i];
        s.style.visibility = "";
      });
      section.style.minHeight = "";

      if (maxH > 0) setMobileSectionMinH(maxH + 4); // +4px safety buffer
    };

    measure();
    // Re-run on orientation change, zoom, or any resize
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const goTo = (i) => setCurrent((i + TOTAL) % TOTAL);
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setCurrent((c) => (c + 1) % TOTAL), INTERVAL);
    return () => clearTimeout(id);
  }, [current, paused]);

  return (
    <section
      ref={sectionRef}
      aria-label="Hero slideshow"
      className="hero-section relative w-full"
      // Mobile: locked to tallest slide height so section never resizes on rotation.
      // Desktop: hero-section CSS class sets height: calc(100dvh - var(--header-height)).
      style={mobileSectionMinH > 0 ? { minHeight: mobileSectionMinH } : undefined}
    >
      {/* ══════════════════════════════════════════════════════════════
          SLIDES
          Mobile  → only active slide visible (display:none on inactive),
                    content stacks vertically: image → card → copy.
          Desktop → absolute crossfade overlay, full-height.
      ══════════════════════════════════════════════════════════════ */}
      {SLIDES.map((s, i) => {
        const active = i === current;
        return (
          <div
            key={i}
            // Mobile:  show/hide with display. No transition needed (instant).
            // Desktop: absolute overlay with opacity crossfade.
            data-slide={i}
            className={`w-full
              md:absolute md:inset-0 md:transition-opacity md:duration-700 md:ease-in-out
              ${active ? "block" : "hidden md:block"}
            `}
            style={{
              opacity: active ? 1 : 0,            // desktop crossfade
              zIndex: active ? 1 : 0,
              pointerEvents: active ? "auto" : "none",
            }}
            aria-hidden={!active}
          >
            {/* ── Image ── */}
            {/* Mobile: natural 16:9 so the full landscape photo shows (no side crop).
                Desktop: full-bleed fill of the section. */}
            <div className="relative w-full aspect-[16/9] md:aspect-auto md:h-full overflow-hidden">
              <img
                src={s.imageSrc}
                alt={s.imageAlt}
                className="w-full h-full object-cover"
                style={{ objectPosition: s.imagePosition || "center" }}
              />

              {/* Gradients — desktop only (mobile uses solid navy below) */}
              <div className="hidden md:block absolute inset-0" style={{ background: GRAD_BOTTOM }} />
              <div className="hidden md:block absolute inset-0" style={{ background: GRAD_LEFT }} />

              {/* ── Desktop copy (overlaid bottom-left) ── */}
              <div className="hidden md:block absolute left-0 bottom-0 w-3/5 px-14 pb-24 z-10">
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--mint)" }}>
                  {s.eyebrow}
                </p>
                <h1
                  className="text-5xl lg:text-7xl font-bold text-white mb-5 leading-tight"
                  style={{ textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}
                >
                  {s.headline}
                </h1>
                <p
                  className="text-lg max-w-xl mb-8 leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 12px rgba(0,0,0,0.35)" }}
                >
                  {s.subheadline}
                </p>
                <div className="flex gap-3">
                  <SmartLink
                    to={s.primaryCta.href}
                    className="inline-block px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                    style={{ backgroundColor: "var(--sage)" }}
                  >
                    {s.primaryCta.label}
                  </SmartLink>
                  <SmartLink
                    to={s.secondaryCta.href}
                    className="inline-block px-8 py-3.5 rounded-full text-sm font-semibold border border-white/50 text-white transition-colors duration-150 hover:bg-white/10"
                  >
                    {s.secondaryCta.label}
                  </SmartLink>
                </div>
              </div>

              {/* ── Desktop feature card (bottom-right) ── */}
              {s.featureCard && (
                <CardLink
                  cta={s.featureCard.cta}
                  className="hidden md:flex absolute bottom-8 right-12 w-72 rounded-2xl overflow-hidden shadow-2xl flex-col bg-white group z-10"
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
            </div>{/* end image wrapper */}

            {/* ══════════════════════════════════════════════════════
                MOBILE-ONLY: feature card + copy below the image
            ══════════════════════════════════════════════════════ */}

            {/* ── Mobile feature card — overlaps image bottom by 24px ── */}
            {s.featureCard && (
              <CardLink
                cta={s.featureCard.cta}
                className="md:hidden relative z-10 -mt-6 mx-4 flex items-center gap-3 bg-white rounded-2xl shadow-xl p-3"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
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

            {/* ── Mobile copy block (solid navy bg, below the card) ── */}
            <div
              className="md:hidden px-5 pt-5 pb-8"
              style={{ backgroundColor: "var(--forest)" }}
            >
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--mint)" }}>
                {s.eyebrow}
              </p>
              <h1
                className="text-4xl font-bold text-white mb-4 leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {s.headline}
              </h1>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.78)" }}>
                {s.subheadline}
              </p>
              <div className="flex flex-col gap-3">
                <SmartLink
                  to={s.primaryCta.href}
                  className="block w-full py-3.5 rounded-full text-sm font-semibold text-white text-center transition-opacity duration-150 hover:opacity-90"
                  style={{ backgroundColor: "var(--sage)" }}
                >
                  {s.primaryCta.label}
                </SmartLink>
                <SmartLink
                  to={s.secondaryCta.href}
                  className="block w-full py-3.5 rounded-full text-sm font-semibold text-center border border-white/40 text-white transition-colors duration-150 hover:bg-white/10"
                >
                  {s.secondaryCta.label}
                </SmartLink>
              </div>

              {/* Mobile dots + counter */}
              <div className="flex items-center justify-between mt-8">
                {/* Dots */}
                <div className="flex gap-2">
                  {SLIDES.map((_, di) => (
                    <button
                      key={di}
                      onClick={() => goTo(di)}
                      aria-label={`Go to slide ${di + 1}`}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: di === current ? 20 : 8,
                        height: 8,
                        backgroundColor: di === current ? "var(--sage)" : "rgba(255,255,255,0.35)",
                      }}
                    />
                  ))}
                </div>
                {/* Prev / next + counter */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={prev}
                    aria-label="Previous slide"
                    className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white text-lg transition-colors hover:bg-white/20"
                  >
                    ‹
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next slide"
                    className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white text-lg transition-colors hover:bg-white/20"
                  >
                    ›
                  </button>
                  <span className="text-white/60 text-xs tabular-nums ml-1">
                    {String(current + 1).padStart(2, "0")}/{String(TOTAL).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

          </div>
        );
      })}

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP-ONLY controls (floating, above all slide layers)
      ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex absolute z-20 bottom-8 left-14 items-center gap-3">
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white text-lg transition-colors hover:bg-white/20"
        >
          ‹
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-white text-lg transition-colors hover:bg-white/20"
        >
          ›
        </button>
        <span className="text-white text-sm font-medium ml-1 tabular-nums">
          {String(current + 1).padStart(2, "0")}
          <span className="text-white/40 mx-1">/</span>
          {String(TOTAL).padStart(2, "0")}
        </span>
      </div>

      {/* ── Desktop progress bar ── */}
      <div className="hidden md:block absolute bottom-0 left-0 w-full h-1 z-20" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        <div
          key={current}
          className="h-full"
          style={{
            backgroundColor: "var(--sage)",
            animation: `progressGrow ${INTERVAL}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      </div>
    </section>
  );
}

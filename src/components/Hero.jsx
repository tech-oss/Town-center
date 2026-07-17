import { Link } from "react-router-dom";
import { hero } from "../Data/content";
import SmartLink from "./SmartLink";

// Feature-card wrapper: SPA <Link> for internal routes (cta.to), <a> for hash anchors
function CardLink({ cta, className, children }) {
  if (cta.to) return <Link to={cta.to} className={className}>{children}</Link>;
  return <a href={cta.href} className={className}>{children}</a>;
}

const s = hero.slides[0];

export default function Hero() {
  return (
    <section
      aria-label="Hero"
      className="hero-section relative w-full"
    >
      <div className="w-full md:absolute md:inset-0">
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
                style={{ backgroundColor: "var(--forest)" }}
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

        {/* ── Mobile copy block (below the card) ── */}
        <div
          className="md:hidden px-5 pt-5 pb-8"
          style={{ backgroundColor: "#ffffff" }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>
            {s.eyebrow}
          </p>
          <h1
            className="text-4xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--forest)" }}
          >
            {s.headline}
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(26,26,26,0.7)" }}>
            {s.subheadline}
          </p>
          <div className="flex flex-col gap-3">
            <SmartLink
              to={s.primaryCta.href}
              className="block w-full py-3.5 rounded-full text-sm font-semibold text-white text-center transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: "var(--forest)" }}
            >
              {s.primaryCta.label}
            </SmartLink>
            <SmartLink
              to={s.secondaryCta.href}
              className="block w-full py-3.5 rounded-full text-sm font-semibold text-center border transition-colors duration-150"
              style={{ borderColor: "rgba(28,46,56,0.3)", color: "var(--forest)" }}
            >
              {s.secondaryCta.label}
            </SmartLink>
          </div>
        </div>
      </div>
    </section>
  );
}

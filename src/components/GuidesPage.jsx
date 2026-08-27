import { Link } from "react-router-dom";
import { useEffect } from "react";
import { guidesIndex, guides } from "../Data/guides";
import { card, pill } from "../utils/design";

export default function GuidesPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* Hero — same treatment as the other Explore pages. */}
      <section
        className="relative w-full flex flex-col items-center justify-end text-center px-6 pb-12 md:pb-16 overflow-hidden"
        style={{ minHeight: "max(70vh, 520px)", paddingTop: "calc(var(--header-height, 96px) + 2rem)" }}
      >
        <img src={guidesIndex.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover md:hidden" />
        <img src={guidesIndex.heroImageDesktop} alt="" className="absolute inset-0 w-full h-full object-cover hidden md:block" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0) 0%, rgba(20,33,42,0.15) 55%, rgba(20,33,42,0.6) 100%)" }} />
        <span className="section-eyebrow relative mb-3" style={{ color: "var(--sage)" }}>{guidesIndex.eyebrow}</span>
        <h1 className="hero-title relative uppercase text-3xl md:text-5xl lg:text-6xl leading-tight mb-4 text-white max-w-3xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
          {guidesIndex.title}
        </h1>
        <p className="relative text-sm md:text-base max-w-xl leading-relaxed font-medium text-white" style={{ letterSpacing: "-0.01em" }}>
          {guidesIndex.subtitle}
        </p>
      </section>

      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto px-6 md:px-12 pt-6 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
        <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
        <span className="mx-2 opacity-40">/</span>
        <span>Neighbourhood Guides</span>
      </nav>

      {/* Guides grid — same card treatment as See & Do / Eat & Drink listings. */}
      <section className="px-6 md:px-12 pt-8 md:pt-10 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {guides.map((g) => (
            <Link
              key={g.slug}
              to={`/guides/${g.slug}`}
              className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
              style={{ borderRadius: "0px", boxShadow: card.shadow }}
            >
              <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden">
                <img src={g.cardImage} alt={g.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-col gap-1 sm:gap-0.5 p-2.5 sm:p-2.5">
                <span
                  className={`${pill.className} !text-[9px] sm:!text-[9px] !px-2 sm:!px-2 !py-0.5 sm:!py-0.5`}
                  style={{ color: "#000000", backgroundColor: "#ffffff", boxShadow: "0 1px 4px rgba(13,42,51,0.12)", alignSelf: "flex-start" }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--leaf)" }} />
                  {g.category}
                </span>
                <h3 className="listing-card-title text-xs sm:text-sm leading-snug sm:leading-tight line-clamp-2 sm:line-clamp-1" style={{ color: "#000000", fontFamily: "var(--font-heading)" }}>
                  {g.title}
                </h3>
                <div className="hidden sm:block">
                  <p className="text-[11px] leading-snug line-clamp-1" style={{ color: "#000000" }}>{g.summary}</p>
                </div>
                <span className="inline-flex items-center gap-1 sm:gap-1 text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-0.5" style={{ color: "#000000" }}>
                  Read more
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

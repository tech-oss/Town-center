import { Link } from "react-router-dom";
import { useEffect } from "react";
import { guidesIndex, guides } from "../Data/guides";

export default function GuidesPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* Hero — same treatment as the other Explore pages. */}
      <section className="relative w-full h-[70vh] min-h-[520px] flex flex-col items-center justify-end text-center px-6 pb-12 md:pb-16 overflow-hidden">
        <img src={guidesIndex.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.45) 0%, rgba(20,33,42,0.55) 50%, rgba(20,33,42,0.9) 100%)" }} />
        <span className="relative text-xs font-bold uppercase tracking-[0.02em] mb-3" style={{ color: "var(--sage)" }}>{guidesIndex.eyebrow}</span>
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

      {/* Guides grid */}
      <section className="px-6 md:px-12 pt-8 md:pt-10 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {guides.map((g) => (
            <Link
              key={g.slug}
              to={`/guides/${g.slug}`}
              className="group flex flex-col overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1"
              style={{ borderRadius: "0px", boxShadow: "0 10px 32px -18px rgba(28,46,56,0.35)" }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={g.cardImage} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-3 left-3 text-2xl">{g.icon}</span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.02em] mb-2" style={{ color: "var(--leaf)" }}>{g.category}</p>
                <h3 className="listing-card-title text-lg leading-snug mb-2" style={{ color: "#000000" }}>{g.title}</h3>
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#000000" }}>{g.summary}</p>
                <span className="mt-4 text-sm font-semibold inline-flex items-center gap-2 transition-transform group-hover:translate-x-1" style={{ color: "#000000" }}>
                  Read the guide <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

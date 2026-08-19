import { Link } from "react-router-dom";
import { useEffect } from "react";
import { live } from "../Data/live";
import { getBuildings } from "../api";
import { getHotels, getAccommodations } from "../api/stay";
import useFetch from "../hooks/useFetch";
import LocationMap from "./LocationMap";
import LifestyleBento from "./LifestyleBento";
import DesignedAroundYou from "./DesignedAroundYou";
import ConnectivitySection from "./ConnectivitySection";
// Property search platform (for sale / for rent) — paused for now, kept for
// a future relaunch. See the commented-out routes in src/App.jsx.
// import { FeaturedProperties } from "./PropertySearch";

// ── Featured stays spotlight — replaces the old property "In the Spotlight"
// section with a mix of hotels and accommodation, matching the same
// asymmetric 1-large + 2-compact layout so the section keeps its visual
// weight on the page. ──
function FeaturedStays() {
  const { data: hotels } = useFetch(getHotels, []);
  const { data: accommodations } = useFetch(getAccommodations, []);

  const featured = [
    ...(hotels ?? []).slice(0, 2).map((s) => ({ ...s, kind: "hotels" })),
    ...(accommodations ?? []).slice(0, 1).map((s) => ({ ...s, kind: "accommodation" })),
  ];
  if (featured.length === 0) return null;
  const [hero, ...rest] = featured;

  const kindBadge = (kind) => (
    <span className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-[0.02em] px-2.5 py-1 rounded-full" style={{ backgroundColor: kind === "hotels" ? "var(--forest)" : "var(--teal-deep, #1e5f5f)", color: "#fff" }}>
      {kind === "hotels" ? "Hotel" : "Accommodation"}
    </span>
  );

  return (
    <section
      className="relative py-20 px-6 md:px-12 mt-4 overflow-hidden"
      style={{ background: "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(150,215,211,0.22) 0%, transparent 70%), linear-gradient(135deg, #16252E 0%, #245C63 50%, #2F8C8C 100%)" }}
    >
      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--mint)" }}>Where to Stay</p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white">In the Spotlight</h2>
          </div>
          <Link to="/live/stay/hotels" className="group inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-white/80 underline decoration-white/40 underline-offset-4">
            View all places to stay
            <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
          <Link
            to={`/live/stay/${hero.kind}/${hero.slug}`}
            className="group relative overflow-hidden flex flex-col min-h-[340px] transition-all duration-300 hover:-translate-y-1"
            style={{ borderRadius: "14px", boxShadow: "0 8px 24px rgba(13,42,51,0.08)" }}
          >
            <img src={hero.image} alt={hero.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
            {kindBadge(hero.kind)}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(13,42,51,0.92) 0%, rgba(13,42,51,0.55) 45%, transparent 75%)" }} />
            <div className="relative z-10 mt-auto p-6 flex flex-col gap-1.5">
              <p className="text-2xl font-bold text-white" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.4)" }}>{hero.name}</p>
              {hero.stars && <p className="text-base font-semibold" style={{ color: "var(--sage)" }}>{"★".repeat(hero.stars)}</p>}
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>{hero.tagline}</p>
            </div>
          </Link>

          <div className="flex flex-col gap-5">
            {rest.map((s) => (
              <Link
                key={s.slug}
                to={`/live/stay/${s.kind}/${s.slug}`}
                className="group flex flex-row overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white"
                style={{ borderRadius: "14px", boxShadow: "0 8px 24px rgba(13,42,51,0.08)" }}
              >
                <div className="relative shrink-0 w-32 overflow-hidden" style={{ aspectRatio: "1/1" }}>
                  <img src={s.image} alt={s.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                </div>
                <div className="flex flex-col flex-1 p-4 gap-1 justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.02em] w-fit px-2 py-0.5 rounded-full" style={{ backgroundColor: s.kind === "hotels" ? "rgba(47,140,140,0.13)" : "rgba(30,95,95,0.12)", color: "var(--teal-deep, #1e5f5f)" }}>
                    {s.kind === "hotels" ? "Hotel" : "Accommodation"}
                  </span>
                  <p className="text-lg font-bold mt-0.5" style={{ color: "#000000" }}>{s.name}</p>
                  {s.stars && <p className="text-sm font-semibold leading-snug" style={{ color: "var(--leaf)" }}>{"★".repeat(s.stars)}</p>}
                  <p className="text-xs line-clamp-2" style={{ color: "#000000" }}>{s.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LivePage() {
  const { data: buildings } = useFetch(getBuildings, []);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* Hero — same footprint as the See & Do / Eat & Drink / Shop /
          Services landing pages (CategoryPage's hero), so it doesn't stand
          out as a different size. */}
      <section className="relative w-full overflow-hidden h-[70vh] min-h-[520px]">
        <img src={live.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.35) 0%, rgba(28,46,56,0.78) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--mint)" }}>{live.hero.eyebrow}</p>
          <h1 className="hero-title uppercase text-white text-4xl md:text-6xl lg:text-7xl max-w-3xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>{live.hero.title}</h1>
          <p className="text-lg text-white/85 mt-4 max-w-2xl leading-relaxed">{live.hero.intro}</p>
          {/* Properties For Sale / For Rent CTAs — paused along with the
              property search platform (see src/App.jsx). */}
          {/* <div className="flex flex-wrap gap-3 mt-7">
            <Link to="/live/for-sale" className="px-6 py-3 rounded-full font-semibold transition-transform hover:scale-105" style={{ backgroundColor: "var(--sage)", color: "#000000" }}>Properties For Sale</Link>
            <Link to="/live/for-rent" className="px-6 py-3 rounded-full font-semibold text-white transition-colors" style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}>Properties For Rent</Link>
          </div> */}
        </div>
      </section>

      {/* Lifestyle bento (desktop) / auto-slider (mobile) */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>Lifestyle</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: "#000000" }}>Life in Maidenhead</h2>
          </div>
          <LifestyleBento />
        </div>
      </section>

      {/* Designed Around You */}
      <DesignedAroundYou />

      {/* Connectivity — Elizabeth line + car/train times */}
      <ConnectivitySection />

      {/* Developments — squared cards, same card typography as the See & Do
          / Eat & Drink / Shop / Services listing grids (.listing-card-title,
          var(--font-heading)). */}
      <section className="pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight" style={{ color: "#000000" }}>Developments</h2>
          <p className="text-base mb-10 max-w-2xl" style={{ color: "#000000" }}>Explore Maidenhead's leading residential developments.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {(buildings ?? []).map((b) => (
              <Link
                key={b.slug}
                to={`/live/building/${b.slug}`}
                className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                style={{ borderRadius: "0px", boxShadow: "0 8px 24px rgba(13,42,51,0.08)" }}
              >
                <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden">
                  <img src={b.image} alt={b.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-col gap-1 sm:gap-0.5 p-2.5 sm:p-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 text-[9px] sm:text-[9px] font-semibold uppercase tracking-[0.08em] px-2 sm:px-2 py-0.5 sm:py-0.5 rounded-full max-w-full truncate self-start"
                    style={{ color: "#000000", backgroundColor: "#ffffff", boxShadow: "0 1px 4px rgba(13,42,51,0.12)" }}
                  >
                    {b.developer}
                  </span>
                  <h3 className="listing-card-title text-xs sm:text-sm leading-snug sm:leading-tight line-clamp-2 sm:line-clamp-1" style={{ color: "#000000", fontFamily: "var(--font-heading)" }}>
                    {b.name}
                  </h3>
                  <p className="hidden sm:block text-[11px] leading-snug line-clamp-1" style={{ color: "#000000" }}>{b.tagline}</p>
                  <span className="inline-flex items-center gap-1 sm:gap-1 text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-0.5" style={{ color: "#000000" }}>
                    Explore
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Location map */}
      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Where you'll live" note="Maidenhead, Berkshire — on the Elizabeth Line, 18 minutes from London Paddington." lat={51.5236} lng={-0.7197} query="Maidenhead, Berkshire" />
        </div>
      </section>

      {/* Featured stays — In the Spotlight (hotels & accommodation, in
          place of the paused property listings). */}
      <FeaturedStays />
    </div>
  );
}

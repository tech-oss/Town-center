import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { buildingBySlug, buildings, properties } from "../Data/live";
import { PropertyCard } from "./PropertySearch";
import LocationMap from "./LocationMap";

const FIFTEEN_MIN = [
  { label: "Eat & Drink", to: "/eat-drink", icon: "🍽" },
  { label: "What's On", to: "/see-do", icon: "🎭" },
  { label: "Shopping", to: "/shop", icon: "🛍" },
  { label: "See & Do", to: "/see-do", icon: "📍" },
];

export default function BuildingPage() {
  const { slug } = useParams();
  const b = buildingBySlug[slug];

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  if (!b) return <Navigate to="/live" replace />;

  const homes = properties.filter((p) => p.buildingSlug === b.slug);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* Hero */}
      <section className="relative h-[48vh] min-h-[340px] w-full overflow-hidden">
        <img src={b.hero} alt={b.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.35) 0%, rgba(28,46,56,0.8) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-12">
          <nav className="mb-4 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--mint)" }}>
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to="/live" className="hover:text-white">Live</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">{b.name}</span>
          </nav>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--mint)" }}>{b.developer}</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">{b.name}</h1>
          <p className="text-lg text-white/85 mt-3 max-w-2xl">{b.tagline}</p>
        </div>
      </section>

      {/* Intro + amenities */}
      <section className="py-14 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>{b.location}</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-5 leading-tight" style={{ color: "var(--forest)" }}>About {b.name}</h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>{b.description}</p>
          </div>
          <aside>
            <div className="rounded-3xl p-7" style={{ backgroundColor: "#fff", boxShadow: "0 10px 40px -22px rgba(28,46,56,0.3)" }}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--leaf)" }}>At a glance</h3>
              <ul className="flex flex-col gap-2.5">
                {b.amenities.map((a) => (
                  <li key={a} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--ink)", opacity: 0.82 }}>
                    <span style={{ color: "var(--sage)" }}>✓</span> {a}
                  </li>
                ))}
              </ul>
              <Link to="/live/enquire" className="mt-6 block text-center py-3 rounded-full font-semibold text-white transition-colors" style={{ backgroundColor: "var(--leaf)" }}>
                Enquire about {b.name}
              </Link>
              <Link to="/live/enquire" className="mt-3 block text-center py-3 rounded-full font-semibold transition-colors" style={{ border: "1.5px solid var(--forest)", color: "var(--forest)" }}>
                ⤓ Download Brochure
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Available homes */}
      <section className="pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>Available at {b.name}</h2>
          {homes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {homes.map((p) => <PropertyCard key={p.slug} p={p} />)}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--forest)", opacity: 0.6 }}>No homes currently available — please enquire for upcoming releases.</p>
          )}
        </div>
      </section>

      {/* Your 15 Minute City */}
      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--forest)" }}>Your 15-minute town</h2>
          <p className="text-base mb-8 max-w-2xl" style={{ color: "var(--ink)", opacity: 0.7 }}>Everything you need is right on your doorstep at {b.name}.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FIFTEEN_MIN.map((c) => (
              <Link key={c.label} to={c.to} className="group rounded-3xl p-6 flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: "#fff", boxShadow: "0 8px 30px -18px rgba(28,46,56,0.25)" }}>
                <span className="text-2xl" aria-hidden="true">{c.icon}</span>
                <span className="font-bold" style={{ color: "var(--forest)" }}>{c.label}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--leaf)" }}>
                  Explore <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Location map */}
      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading={`Based in the heart of Maidenhead`} note={`${b.name}, ${b.location}`} query={`${b.name}, Maidenhead`} />
        </div>
      </section>

      {/* Explore other buildings */}
      <section className="pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>Explore our other buildings</h2>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {buildings.filter((x) => x.slug !== b.slug).map((x) => (
              <Link key={x.slug} to={`/live/building/${x.slug}`} className="group relative rounded-3xl overflow-hidden block aspect-[16/9]" style={{ boxShadow: "0 10px 40px -18px rgba(28,46,56,0.4)" }}>
                <img src={x.image} alt={x.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(28,46,56,0.85) 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--sage)" }}>{x.developer}</p>
                  <h3 className="text-2xl font-bold text-white">{x.name}</h3>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white mt-2">Explore <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

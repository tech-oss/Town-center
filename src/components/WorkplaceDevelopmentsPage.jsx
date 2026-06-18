import { useEffect } from "react";
import { Link } from "react-router-dom";
import { workplaceBuildings } from "../Data/work";
import LocationMap from "./LocationMap";

const modeIcon = (mode) =>
  ({ walk: "🚶", train: "🚂", car: "🚗" }[mode] ?? "📍");

function DevelopmentCard({ b }) {
  return (
    <div style={{ backgroundColor: "var(--sand)" }}>

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
        <img src={b.hero} alt={b.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.12) 0%, rgba(28,46,56,0.88) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-12">
          <span
            className="self-start inline-flex items-center mb-3 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "var(--sage)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            {b.developer}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl">{b.name}</h2>
          <p className="text-lg text-white/80 mt-3 max-w-2xl leading-relaxed">{b.tagline}</p>
          {b.website && (
            <div className="mt-5">
              <a href={b.website} target="_blank" rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-full font-semibold transition-colors hover:bg-white/10 text-sm"
                style={{ border: "1.5px solid rgba(255,255,255,0.5)", color: "rgba(255,255,255,0.9)" }}>
                Developer site ↗
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Stats strip */}
      <div style={{ backgroundColor: "var(--forest)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-5 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {b.quickStats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-4 first:pl-0">
              <span className="text-2xl leading-none shrink-0">{s.icon}</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 leading-none mb-0.5">{s.label}</p>
                <p className="text-sm font-bold text-white leading-snug">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About + Gallery */}
      <section className="py-14 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>About the development</p>
            <h3 className="text-2xl md:text-3xl font-bold mb-5 leading-tight" style={{ color: "var(--forest)" }}>About {b.name}</h3>
            {(b.longDescription || [b.description]).map((para, i) => (
              <p key={i} className="text-base leading-relaxed mb-4" style={{ color: "var(--ink)", opacity: 0.82 }}>{para}</p>
            ))}
            {b.website && (
              <a href={b.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold mt-1 transition-opacity hover:opacity-75"
                style={{ color: "var(--leaf)" }}>
                Visit {b.developer} website →
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(b.gallery ?? [b.hero, b.hero, b.hero, b.hero]).slice(0, 4).map((src, i) => (
              <div key={i} className={`overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}
                style={{ boxShadow: "0 6px 24px -10px rgba(28,46,56,0.3)" }}>
                <img src={src} alt={`${b.name} ${i + 1}`} loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-6 md:px-12" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>Specification</p>
          <h3 className="text-2xl md:text-3xl font-bold mb-7" style={{ color: "var(--forest)" }}>Features</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {b.amenities.map((a) => {
              const icon = typeof a === "object" ? a.icon : "✓";
              const text = typeof a === "object" ? a.text : a;
              return (
                <div key={text} className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: "var(--sand)" }}>
                  <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                  <span className="text-sm font-medium leading-snug" style={{ color: "var(--forest)" }}>{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Getting around */}
      {b.nearbyPlaces?.length > 0 && (
        <section className="py-12 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>Connectivity</p>
            <h3 className="text-2xl md:text-3xl font-bold mb-7" style={{ color: "var(--forest)" }}>Getting around</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {b.nearbyPlaces.map((place) => (
                <div key={place.name} className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: "#fff" }}>
                  <span className="text-2xl shrink-0">{modeIcon(place.mode)}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--forest)" }}>{place.name}</p>
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: "var(--leaf)" }}>{place.distance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="py-12 px-6 md:px-12" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>Contact</p>
          <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "var(--forest)" }}>Get in touch</h3>
          <p className="text-base mb-7 max-w-xl" style={{ color: "var(--ink)", opacity: 0.7 }}>
            For availability, pricing and viewings contact the {b.developer} team directly.
          </p>
          <div className="flex flex-wrap gap-4">
            {b.website && (
              <a href={b.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)", minWidth: "200px" }}>
                <span className="text-3xl">🌐</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--leaf)" }}>Website</p>
                  <p className="text-sm font-semibold group-hover:underline" style={{ color: "var(--forest)" }}>Visit developer site ↗</p>
                </div>
              </a>
            )}
            {b.email && (
              <a href={`mailto:${b.email}`}
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)", minWidth: "200px" }}>
                <span className="text-3xl">✉️</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--leaf)" }}>Email</p>
                  <p className="text-sm font-semibold group-hover:underline truncate" style={{ color: "var(--forest)" }}>{b.email}</p>
                </div>
              </a>
            )}
            {b.phone && (
              <a href={`tel:${b.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)", minWidth: "200px" }}>
                <span className="text-3xl">📞</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--leaf)" }}>Telephone</p>
                  <p className="text-sm font-semibold group-hover:underline" style={{ color: "var(--forest)" }}>{b.phone}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Location" note={`${b.name} — ${b.location}`} query={`${b.name}, Maidenhead`} />
        </div>
      </section>
    </div>
  );
}

export default function WorkplaceDevelopmentsPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* Page header */}
      <section className="py-16 md:py-24 px-6 md:px-12" style={{ backgroundColor: "var(--forest)" }}>
        <div className="max-w-6xl mx-auto">
          <nav className="mb-6 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--mint)" }}>
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to="/work" className="hover:text-white transition-colors">Work</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">Workplace Developments</span>
          </nav>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--sage)" }}>Work in Maidenhead</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-3xl mb-4">
            Workplace Developments
          </h1>
          <p className="text-lg text-white/80 max-w-2xl leading-relaxed">
            Discover Maidenhead's leading commercial and workspace developments — from landmark town-centre mixed-use schemes to affordable managed offices for growing businesses.
          </p>
        </div>
      </section>

      {/* Development listings */}
      {workplaceBuildings.map((b, i) => (
        <div key={b.slug}>
          {i > 0 && <div style={{ height: "2px", backgroundColor: "rgba(28,46,56,0.08)" }} />}
          <DevelopmentCard b={b} />
        </div>
      ))}

      {/* CTA footer */}
      <section className="py-16 px-6 md:px-12" style={{ backgroundColor: "var(--forest)" }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--sage)" }}>Work in Maidenhead</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Looking for something else?</h2>
          <p className="text-white/75 mb-8 max-w-xl mx-auto">
            Browse jobs, freelance projects, business networking and more in the Work section.
          </p>
          <Link to="/work"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: "var(--sage)", color: "var(--forest)" }}>
            Explore Work in Maidenhead →
          </Link>
        </div>
      </section>
    </div>
  );
}

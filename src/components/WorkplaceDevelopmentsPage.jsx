import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { getWorkplaceDevelopments, getWorkplaceDevelopmentBySlug } from "../api";
import useFetch from "../hooks/useFetch";
import useTapReveal from "../hooks/useTapReveal";
import LocationMap from "./LocationMap";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";

const modeIcon = (mode) =>
  ({ walk: "🚶", train: "🚂", car: "🚗" }[mode] ?? "📍");

// Framed-photo hover — same "In the Spotlight" treatment used on the
// homepage: a sharp foreground photo that insets on hover/tap to reveal a
// blurred, dimmed frame around it.
function SpotlightImage({ src, alt, className = "" }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div
      onClick={onImageClick}
      className={`spotlight-card group/img block cursor-pointer ${revealed ? "is-revealed" : ""} ${className}`}
    >
      <img src={src} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
      <img src={src} alt={alt} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

function DevelopmentCard({ b }) {
  return (
    <div style={{ backgroundColor: "#ffffff" }}>

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[520px] w-full overflow-hidden">
        <img src={b.hero} alt={b.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.12) 0%, rgba(28,46,56,0.88) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-12">
          <nav className="mb-5 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--mint)" }}>
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to="/work" className="hover:text-white transition-colors">Work</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">{b.name}</span>
          </nav>
          <span
            className="self-start inline-flex items-center mb-3 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.02em]"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "var(--sage)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            {b.developer}
          </span>
          <h1 className="section-heading text-4xl md:text-6xl font-bold text-white leading-tight max-w-3xl">{b.name}</h1>
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
                <p className="text-[10px] font-bold uppercase tracking-[0.02em] text-white/50 leading-none mb-0.5">{s.label}</p>
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
            <p className="section-eyebrow mb-2" style={{ color: "var(--leaf)" }}>About the development</p>
            <h3 className="section-heading text-2xl md:text-3xl font-bold mb-5 leading-tight" style={{ color: "#000000" }}>About {b.name}</h3>
            {(b.longDescription || [b.description]).map((para, i) => (
              <p key={i} className="text-base leading-relaxed mb-4" style={{ color: "#000000" }}>{para}</p>
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
              <SpotlightImage
                key={i}
                src={src}
                alt={`${b.name} ${i + 1}`}
                className={`relative overflow-hidden ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-6 md:px-12" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <p className="section-eyebrow mb-2" style={{ color: "var(--leaf)" }}>Specification</p>
          <h3 className="section-heading text-2xl md:text-3xl font-bold mb-7" style={{ color: "#000000" }}>Features</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {b.amenities.map((a) => {
              const icon = typeof a === "object" ? a.icon : "✓";
              const text = typeof a === "object" ? a.text : a;
              return (
                <div key={text} className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: "var(--sand)" }}>
                  <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                  <span className="text-sm font-medium leading-snug" style={{ color: "#000000" }}>{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Getting around */}
      {b.nearbyPlaces?.length > 0 && (
        <section className="py-12 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
          <div className="max-w-6xl mx-auto">
            <p className="section-eyebrow mb-2" style={{ color: "var(--leaf)" }}>Connectivity</p>
            <h3 className="section-heading text-2xl md:text-3xl font-bold mb-7" style={{ color: "#000000" }}>Getting around</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {b.nearbyPlaces.map((place) => (
                <div key={place.name} className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: "#fff" }}>
                  <span className="text-2xl shrink-0">{modeIcon(place.mode)}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#000000" }}>{place.name}</p>
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
          <p className="section-eyebrow mb-2" style={{ color: "var(--leaf)" }}>Contact</p>
          <h3 className="section-heading text-2xl md:text-3xl font-bold mb-3" style={{ color: "#000000" }}>Get in touch</h3>
          <p className="text-base mb-7 max-w-xl" style={{ color: "#000000" }}>
            For availability, pricing and viewings contact the {b.developer} team directly.
          </p>
          <div className="flex flex-wrap gap-4">
            {b.website && (
              <a href={b.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)", minWidth: "200px" }}>
                <span className="text-3xl">🌐</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.02em] mb-0.5" style={{ color: "var(--leaf)" }}>Website</p>
                  <p className="text-sm font-semibold group-hover:underline" style={{ color: "#000000" }}>Visit developer site ↗</p>
                </div>
              </a>
            )}
            {b.email && (
              <a href={`mailto:${b.email}`}
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)", minWidth: "200px" }}>
                <span className="text-3xl">✉️</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.02em] mb-0.5" style={{ color: "var(--leaf)" }}>Email</p>
                  <p className="text-sm font-semibold group-hover:underline truncate" style={{ color: "#000000" }}>{b.email}</p>
                </div>
              </a>
            )}
            {b.phone && (
              <a href={`tel:${b.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)", minWidth: "200px" }}>
                <span className="text-3xl">📞</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.02em] mb-0.5" style={{ color: "var(--leaf)" }}>Telephone</p>
                  <p className="text-sm font-semibold group-hover:underline" style={{ color: "#000000" }}>{b.phone}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Location" note={`${b.name} — ${b.location}`} query={b.location} lat={b.lat} lng={b.lng} />
        </div>
      </section>
    </div>
  );
}

export default function WorkplaceDevelopmentsPage() {
  const { slug } = useParams();
  const { data: b, loading, error } = useFetch(() => getWorkplaceDevelopmentBySlug(slug), [slug]);
  const { data: developments, loading: loadingList } = useFetch(getWorkplaceDevelopments, []);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  if (loading || loadingList) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  if (!b) return <Navigate to="/work" replace />;

  const others = developments.filter((x) => x.slug !== b.slug);

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* The development */}
      <DevelopmentCard b={b} />

      {/* Other workplace developments — same squared card grid (size,
          spacing, typography) as PlaceDetailLayout's "related" section on
          See & Do, for mobile and desktop alike. */}
      {others.length > 0 && (
        <section className="py-16 md:py-20 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="hero-title uppercase text-2xl md:text-3xl mb-8" style={{ color: "#000000" }}>More Developments In Maidenhead</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 md:gap-8">
              {others.map((x) => (
                <Link
                  key={x.slug}
                  to={`/work/developments/${x.slug}`}
                  className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={x.image} alt={x.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {x.status && (
                      <span
                        className="absolute top-1 left-1 sm:top-3 sm:left-3 inline-flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.02em] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full"
                        style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#000000" }}
                      >
                        {x.status}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 sm:gap-2 p-2 sm:p-6">
                    <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.02em]" style={{ color: "var(--leaf)" }}>{x.developer}</span>
                    <h3 className="font-bold text-xs sm:text-xl leading-snug line-clamp-2" style={{ color: "#000000" }}>{x.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

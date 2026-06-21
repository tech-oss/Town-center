import { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { getBuildingBySlug, getBuildings } from "../api";
import useFetch from "../hooks/useFetch";
import LocationMap from "./LocationMap";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";

const FIFTEEN_MIN = [
  { label: "Eat & Drink", to: "/eat-drink", icon: "🍽" },
  { label: "What's On",  to: "/see-do",    icon: "🎭" },
  { label: "Shopping",   to: "/shop",      icon: "🛍" },
  { label: "See & Do",   to: "/see-do",    icon: "📍" },
];

const modeIcon = (mode) =>
  ({ walk: "🚶", train: "🚂", car: "🚗" }[mode] ?? "📍");

export default function BuildingPage() {
  const { slug } = useParams();
  const { data: b, loading, error } = useFetch(() => getBuildingBySlug(slug), [slug]);
  const { data: buildings, loading: loadingList } = useFetch(getBuildings, []);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  if (loading || loadingList) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  if (!b) return <Navigate to="/live" replace />;

  const otherBuildings = buildings.filter((x) => x.slug !== b.slug);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-[68vh] min-h-[440px] w-full overflow-hidden">
        <img
          src={b.hero}
          alt={b.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.15) 0%, rgba(28,46,56,0.88) 100%)" }}
        />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-14">
          <nav className="mb-5 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--mint)" }}>
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to="/live" className="hover:text-white transition-colors">Live</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">{b.name}</span>
          </nav>
          <span
            className="self-start inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "var(--sage)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            {b.developer}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-3xl">{b.name}</h1>
          <p className="text-lg text-white/85 mt-3 max-w-2xl leading-relaxed">{b.tagline}</p>
          {b.website && (
            <div className="mt-6">
              <a
                href={b.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 rounded-full font-semibold transition-colors hover:bg-white/10"
                style={{ border: "1.5px solid rgba(255,255,255,0.55)", color: "rgba(255,255,255,0.9)" }}
              >
                Developer site ↗
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. QUICK STATS STRIP ────────────────────────────────────────────── */}
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

      {/* ── 3. ABOUT + PHOTO GALLERY ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
              About the development
            </p>
            <h2 className="text-2xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: "var(--forest)" }}>
              About {b.name}
            </h2>
            {(b.longDescription || [b.description]).map((para, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed mb-5" style={{ color: "var(--ink)", opacity: 0.82 }}>
                {para}
              </p>
            ))}
            {b.website && (
              <a
                href={b.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
                style={{ color: "var(--leaf)" }}
              >
                Visit {b.developer} website →
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(b.gallery ?? [b.hero, b.hero, b.hero, b.hero]).slice(0, 4).map((src, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}
                style={{ boxShadow: "0 6px 24px -10px rgba(28,46,56,0.3)" }}
              >
                <img
                  src={src}
                  alt={`${b.name} ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURES GRID ────────────────────────────────────────────────── */}
      <section className="py-14 px-6 md:px-12" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
            Specification
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-tight" style={{ color: "var(--forest)" }}>
            Features
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {b.amenities.map((a) => {
              const icon = typeof a === "object" ? a.icon : "✓";
              const text = typeof a === "object" ? a.text : a;
              return (
                <div
                  key={text}
                  className="flex items-start gap-3 p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)" }}
                >
                  <span className="text-xl leading-none shrink-0 mt-0.5">{icon}</span>
                  <span className="text-sm font-medium leading-snug" style={{ color: "var(--forest)" }}>{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. GETTING AROUND ───────────────────────────────────────────────── */}
      {b.nearbyPlaces && b.nearbyPlaces.length > 0 && (
        <section className="py-14 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
              Connectivity
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>
              Getting around
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {b.nearbyPlaces.map((place) => (
                <div
                  key={place.name}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ backgroundColor: "#fff" }}
                >
                  <span className="text-2xl shrink-0 leading-none">{modeIcon(place.mode)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug" style={{ color: "var(--forest)" }}>
                      {place.name}
                    </p>
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: "var(--leaf)" }}>
                      {place.distance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. YOUR 15-MINUTE TOWN ──────────────────────────────────────────── */}
      <section className="py-14 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
            Lifestyle
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--forest)" }}>
            Your 15-minute town
          </h2>
          <p className="text-base mb-8 max-w-2xl" style={{ color: "var(--ink)", opacity: 0.7 }}>
            Everything you need is right on your doorstep in Maidenhead.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FIFTEEN_MIN.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="group rounded-3xl p-6 flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: "#fff", boxShadow: "0 8px 30px -18px rgba(28,46,56,0.25)" }}
              >
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

      {/* ── 7. DEVELOPER CONTACT ────────────────────────────────────────────── */}
      <section className="py-16 px-6 md:px-12" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
            Developer
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight" style={{ color: "var(--forest)" }}>
            Contact {b.developer}
          </h2>
          <p className="text-base mb-8 max-w-2xl" style={{ color: "var(--ink)", opacity: 0.7 }}>
            For pricing, availability and upcoming releases, contact the {b.developer} team directly.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {b.website && (
              <a
                href={b.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)" }}
              >
                <span className="text-3xl shrink-0">🌐</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--leaf)" }}>Website</p>
                  <p className="text-sm font-semibold truncate group-hover:underline" style={{ color: "var(--forest)" }}>Visit developer site ↗</p>
                </div>
              </a>
            )}
            {b.email && (
              <a
                href={`mailto:${b.email}`}
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)" }}
              >
                <span className="text-3xl shrink-0">✉️</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--leaf)" }}>Email</p>
                  <p className="text-sm font-semibold truncate group-hover:underline" style={{ color: "var(--forest)" }}>{b.email}</p>
                </div>
              </a>
            )}
            {b.phone && (
              <a
                href={`tel:${b.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ backgroundColor: "var(--sand)", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.1)" }}
              >
                <span className="text-3xl shrink-0">📞</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--leaf)" }}>Telephone</p>
                  <p className="text-sm font-semibold group-hover:underline" style={{ color: "var(--forest)" }}>{b.phone}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── 8. LOCATION MAP ─────────────────────────────────────────────────── */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap
            heading="Location"
            note={`${b.name} — ${b.location}`}
            query={b.location}
          />
        </div>
      </section>

      {/* ── 9. OTHER DEVELOPMENTS ───────────────────────────────────────────── */}
      <section className="pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
            Explore more
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>
            More developments in Maidenhead
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {otherBuildings.map((x) => (
              <Link
                key={x.slug}
                to={`/live/building/${x.slug}`}
                className="group relative rounded-3xl overflow-hidden block aspect-[4/3]"
                style={{ boxShadow: "0 10px 40px -18px rgba(28,46,56,0.4)" }}
              >
                <img
                  src={x.image}
                  alt={x.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, transparent 35%, rgba(28,46,56,0.88) 100%)" }}
                />
                {x.status && (
                  <span
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      backgroundColor: x.status === "Coming Soon" ? "rgba(245,200,66,0.9)" : "rgba(47,140,140,0.85)",
                      color: x.status === "Coming Soon" ? "#1a3a42" : "#fff",
                    }}
                  >
                    {x.status}
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--sage)" }}>
                    {x.developer}
                  </p>
                  <h3 className="text-lg font-bold text-white leading-snug">{x.name}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/80 mt-2">
                    Explore <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

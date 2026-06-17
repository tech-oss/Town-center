import { useState, useRef, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { buildingBySlug, buildings, properties } from "../Data/live";
import { PropertyCard } from "./PropertySearch";
import LocationMap from "./LocationMap";

const FIFTEEN_MIN = [
  { label: "Eat & Drink", to: "/eat-drink", icon: "🍽" },
  { label: "What's On",  to: "/see-do",    icon: "🎭" },
  { label: "Shopping",   to: "/shop",      icon: "🛍" },
  { label: "See & Do",   to: "/see-do",    icon: "📍" },
];

const modeIcon = (mode) =>
  ({ walk: "🚶", train: "🚂", car: "🚗" }[mode] ?? "📍");

// Input / textarea base style
const fieldCls = "w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors focus:border-[var(--leaf)]";
const fieldStyle = { background: "var(--sand)", color: "var(--forest)", border: "1.5px solid transparent" };

export default function BuildingPage() {
  const { slug } = useParams();
  const b = buildingBySlug[slug];

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const homesRef   = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  if (!b) return <Navigate to="/live" replace />;

  const homes = properties.filter((p) => p.buildingSlug === b.slug);
  const otherBuildings = buildings.filter((x) => x.slug !== b.slug);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); setSent(true); };

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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
          {/* Breadcrumb */}
          <nav className="mb-5 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--mint)" }}>
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to="/live" className="hover:text-white transition-colors">Live</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">{b.name}</span>
          </nav>

          {/* Developer badge */}
          <span
            className="self-start inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "var(--sage)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            {b.developer}
          </span>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-3xl">{b.name}</h1>
          <p className="text-lg text-white/85 mt-3 max-w-2xl leading-relaxed">{b.tagline}</p>

          {/* Status pill */}
          <div className="flex items-center gap-3 mt-5">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{
                backgroundColor: b.status === "Coming Soon" ? "rgba(255,180,0,0.2)" : "rgba(47,140,140,0.25)",
                color: b.status === "Coming Soon" ? "#f5c842" : "var(--sage)",
                border: `1px solid ${b.status === "Coming Soon" ? "rgba(255,200,0,0.4)" : "rgba(47,140,140,0.5)"}`,
              }}
            >
              <span style={{ fontSize: 8 }}>●</span> {b.status}
            </span>
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap gap-3 mt-6">
            {homes.length > 0 && (
              <button
                onClick={() => scrollTo(homesRef)}
                className="px-7 py-3 rounded-full font-semibold transition-all hover:scale-105 hover:opacity-95"
                style={{ backgroundColor: "var(--sage)", color: "var(--forest)" }}
              >
                View Homes
              </button>
            )}
            <button
              onClick={() => scrollTo(contactRef)}
              className="px-7 py-3 rounded-full font-semibold text-white transition-colors hover:bg-white/20"
              style={{ border: "1.5px solid rgba(255,255,255,0.65)" }}
            >
              {b.status === "Coming Soon" ? "Register Interest" : "Enquire Now"}
            </button>
            {b.website && (
              <a
                href={b.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 rounded-full font-semibold transition-colors hover:bg-white/10"
                style={{ border: "1.5px solid rgba(255,255,255,0.35)", color: "rgba(255,255,255,0.8)" }}
              >
                Developer site ↗
              </a>
            )}
          </div>
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
          {/* Text */}
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
            {b.phone && (
              <a
                href={`tel:${b.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 mt-1 mb-3 text-sm font-semibold"
                style={{ color: "var(--forest)" }}
              >
                <span className="text-base">📞</span> {b.phone}
              </a>
            )}
            {b.website && (
              <div className="mt-3">
                <a
                  href={b.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "var(--leaf)" }}
                >
                  Visit {b.developer} website →
                </a>
              </div>
            )}
          </div>

          {/* Photo mosaic: 1 wide + 3 small */}
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

      {/* ── 4. KEY FEATURES GRID ────────────────────────────────────────────── */}
      <section className="py-14 px-6 md:px-12" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
            Specification
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-tight" style={{ color: "var(--forest)" }}>
            What's included
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

      {/* ── 5. AVAILABLE HOMES ──────────────────────────────────────────────── */}
      <section ref={homesRef} className="py-16 px-6 md:px-12" style={{ scrollMarginTop: "80px" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
            {homes.length > 0 ? "Available now" : b.status}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>
            Homes at {b.name}
          </h2>

          {homes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {homes.map((p) => <PropertyCard key={p.slug} p={p} />)}
            </div>
          ) : (
            <div
              className="rounded-3xl p-10 md:p-14 text-center"
              style={{ backgroundColor: "#fff", boxShadow: "0 8px 30px -18px rgba(28,46,56,0.2)" }}
            >
              <p className="text-4xl mb-4">🏡</p>
              <h3 className="font-bold text-xl mb-2" style={{ color: "var(--forest)" }}>
                Launching Soon
              </h3>
              <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "var(--ink)", opacity: 0.7 }}>
                Homes at {b.name} have not yet been released. Register your interest below and be first to hear when properties become available — including exclusive pre-launch pricing.
              </p>
              <button
                onClick={() => scrollTo(contactRef)}
                className="px-8 py-3 rounded-full font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--leaf)" }}
              >
                Register Interest
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── 6. GETTING AROUND ───────────────────────────────────────────────── */}
      {b.nearbyPlaces && b.nearbyPlaces.length > 0 && (
        <section className="py-14 px-6 md:px-12" style={{ backgroundColor: "#fff" }}>
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
                  style={{ backgroundColor: "var(--sand)" }}
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

      {/* ── 7. YOUR 15-MINUTE TOWN ──────────────────────────────────────────── */}
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

      {/* ── 8. DEVELOPER CONTACT ────────────────────────────────────────────── */}
      <section ref={contactRef} className="py-16 px-6 md:px-12" style={{ backgroundColor: "#fff", scrollMarginTop: "80px" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Developer info panel */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
              Developer
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>
              {b.developer}
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--ink)", opacity: 0.8 }}>
              For more information about {b.name} — including pricing, availability and upcoming releases — get in touch with the {b.developer} team directly.
            </p>

            {/* Feature highlights */}
            <ul className="flex flex-col gap-3 mb-8">
              {(b.amenities ?? []).slice(0, 4).map((a) => {
                const icon = typeof a === "object" ? a.icon : "✓";
                const text = typeof a === "object" ? a.text : a;
                return (
                  <li key={text} className="flex items-center gap-3 text-sm" style={{ color: "var(--ink)", opacity: 0.82 }}>
                    <span className="text-base">{icon}</span> {text}
                  </li>
                );
              })}
            </ul>

            {b.phone && (
              <a
                href={`tel:${b.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 mb-4 text-base font-bold transition-opacity hover:opacity-75"
                style={{ color: "var(--forest)" }}
              >
                <span className="text-xl">📞</span> {b.phone}
              </a>
            )}
            {b.website && (
              <a
                href={b.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--forest)" }}
              >
                Visit {b.developer} site →
              </a>
            )}
          </div>

          {/* Enquiry form */}
          {sent ? (
            <div
              className="rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4"
              style={{ backgroundColor: "var(--sand)", minHeight: "320px", boxShadow: "0 10px 40px -22px rgba(28,46,56,0.15)" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: "rgba(47,140,140,0.15)", color: "#2f8c8c" }}
              >
                ✓
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--forest)" }}>Enquiry received!</h3>
              <p className="text-sm max-w-xs leading-relaxed" style={{ color: "var(--ink)", opacity: 0.7 }}>
                Thank you for your interest in {b.name}. We'll pass your details to the {b.developer} team and be in touch shortly.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl p-7 md:p-8 flex flex-col gap-4"
              style={{ backgroundColor: "var(--sand)", boxShadow: "0 10px 40px -22px rgba(28,46,56,0.15)" }}
            >
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: "var(--forest)" }}>
                  {b.status === "Coming Soon" ? "Register your interest" : "Enquire about this development"}
                </h3>
                <p className="text-xs" style={{ color: "var(--ink)", opacity: 0.6 }}>
                  We'll respond within one working day.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={set("name")}
                  className={fieldCls}
                  style={fieldStyle}
                />
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={set("email")}
                  className={fieldCls}
                  style={fieldStyle}
                />
              </div>
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={form.phone}
                onChange={set("phone")}
                className={fieldCls}
                style={fieldStyle}
              />
              <textarea
                rows={4}
                placeholder={`Tell us about your interest in ${b.name}…`}
                value={form.message}
                onChange={set("message")}
                className={fieldCls + " resize-none"}
                style={fieldStyle}
              />
              <button
                type="submit"
                className="py-3.5 rounded-full font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--leaf)" }}
              >
                Send Enquiry
              </button>
              <p className="text-[11px] text-center" style={{ color: "var(--ink)", opacity: 0.45 }}>
                Your information is treated in accordance with our privacy policy and will not be shared with third parties without consent.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── 9. LOCATION MAP ─────────────────────────────────────────────────── */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap
            heading="Location"
            note={`${b.name} — ${b.location}`}
            query={`${b.name}, Maidenhead`}
          />
        </div>
      </section>

      {/* ── 10. OTHER BUILDINGS ─────────────────────────────────────────────── */}
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
                {/* Status badge */}
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

import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { propertyBySlug, buildingBySlug, properties, fmtPrice } from "../Data/live";
import { PropertyCard } from "./PropertySearch";
import BookingForm from "./BookingForm";
import LocationMap from "./LocationMap";

export default function PropertyPage() {
  const { slug } = useParams();
  const p = propertyBySlug[slug];
  const [active, setActive] = useState(0);

  useEffect(() => { window.scrollTo(0, 0); setActive(0); }, [slug]);

  if (!p) return <Navigate to="/live/for-sale" replace />;
  const b = buildingBySlug[p.buildingSlug];
  const similar = properties.filter((x) => x.status === p.status && x.slug !== p.slug).slice(0, 3);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* Gallery hero */}
      <section className="px-6 md:px-12 pt-6 md:pt-10">
        <div className="max-w-6xl mx-auto">
          <nav className="mb-5 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to="/live" className="hover:opacity-70">Live</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to={p.status === "rent" ? "/live/for-rent" : "/live/for-sale"} className="hover:opacity-70">{p.status === "rent" ? "For Rent" : "For Sale"}</Link>
          </nav>
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-black shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
            <img src={p.gallery[active]} alt={`${p.bedLabel} at ${p.building}`} className="w-full h-full object-cover" />
            <span className="absolute top-4 left-4 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full" style={{ backgroundColor: p.status === "rent" ? "var(--teal-deep)" : "var(--forest)", color: "#fff" }}>
              {p.status === "rent" ? "To Rent" : "For Sale"}
            </span>
          </div>
          <div className="flex gap-3 mt-3 overflow-x-auto scrollbar-none">
            {p.gallery.map((g, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}
                className="shrink-0 w-24 h-16 md:w-28 md:h-20 rounded-xl overflow-hidden border-2 transition-all"
                style={{ borderColor: i === active ? "var(--sage)" : "transparent", opacity: i === active ? 1 : 0.7 }}>
                <img src={g} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-14">
          {/* Main */}
          <div>
            <p className="text-3xl md:text-4xl font-bold" style={{ color: "var(--forest)" }}>{fmtPrice(p.price, p.status)}</p>
            <h1 className="text-xl md:text-2xl font-semibold mt-1 mb-1" style={{ color: "var(--leaf)" }}>{p.bedLabel} property · {p.building}</h1>
            <p className="text-sm mb-6" style={{ color: "var(--ink)", opacity: 0.6 }}>{p.location}</p>

            {/* Key facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[["Bedrooms", p.beds === 0 ? "Studio" : p.beds === 99 ? "Penthouse" : p.beds], ["Bathrooms", p.baths], ["Size", `${p.sqft} sq ft`], ["Floor", p.floor]].map(([k, v]) => (
                <div key={k} className="rounded-2xl p-4 text-center" style={{ backgroundColor: "#fff", boxShadow: "0 4px 16px -10px rgba(28,46,56,0.25)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{k}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: "var(--forest)" }}>{v}</p>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--forest)" }}>About this home</h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--ink)", opacity: 0.82 }}>{p.description}</p>

            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--forest)" }}>Features</h2>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 mb-8">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--ink)", opacity: 0.82 }}>
                  <span style={{ color: "var(--sage)" }}>✓</span> {f}
                </li>
              ))}
            </ul>

            {/* Development link + brochure */}
            <div className="flex flex-wrap items-center gap-4">
              <Link to={`/live/building/${b.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--leaf)" }}>
                More about {b.name}
                <span>→</span>
              </Link>
              <Link to="/live/enquire" className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full" style={{ border: "1.5px solid var(--forest)", color: "var(--forest)" }}>
                ⤓ Download Brochure
              </Link>
            </div>
          </div>

          {/* Booking sidebar */}
          <aside className="lg:sticky lg:top-28 self-start">
            <BookingForm title="Book a Viewing" subtitle={`Arrange a viewing of this ${p.bedLabel.toLowerCase()} at ${p.building}.`} propertyName={`${p.bedLabel} at ${p.building}`} />
          </aside>
        </div>
      </section>

      {/* Location map */}
      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Location" note={`${p.building}, ${p.location}`} query={`${p.building}, Maidenhead`} />
        </div>
      </section>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="pb-20 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>Similar homes</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {similar.map((x) => <PropertyCard key={x.slug} p={x} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

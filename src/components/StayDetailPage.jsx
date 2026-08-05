import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getHotelBySlug, getAccommodationBySlug } from "../api";
import useFetch from "../hooks/useFetch";
import LocationMap from "./LocationMap";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";

const STARS = (n) => "★".repeat(n) + "☆".repeat(5 - n);

export default function StayDetailPage({ kind }) {
  const isHotels = kind === "hotels";
  const { slug } = useParams();
  const fetcher = isHotels ? () => getHotelBySlug(slug) : () => getAccommodationBySlug(slug);
  const { data: item, loading, error } = useFetch(fetcher, [slug, kind]);
  const [active, setActive] = useState(0);

  // Reset the gallery to the first image when navigating to a different item.
  const [seenSlug, setSeenSlug] = useState(slug);
  if (slug !== seenSlug) { setSeenSlug(slug); setActive(0); }

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  if (loading) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  if (!item) return <Navigate to={isHotels ? "/live/stay/hotels" : "/live/stay/accommodation"} replace />;

  const gallery = item.gallery?.length ? item.gallery : [item.image];
  const address = item.address ?? item.area;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.mapQuery)}`;

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* Gallery hero */}
      <section className="px-6 md:px-12 pt-6 md:pt-10">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-black shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
            <img src={gallery[active]} alt={item.name} className="w-full h-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-3 mt-3 overflow-x-auto scrollbar-none">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}
                  className="shrink-0 w-24 h-16 md:w-28 md:h-20 rounded-xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: i === active ? "var(--sage)" : "transparent", opacity: i === active ? 1 : 0.7 }}>
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Body + sidebar */}
      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
          {/* Main */}
          <div>
            {/* Breadcrumb */}
            <nav className="mb-5 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
              <Link to="/" className="hover:opacity-70">Home</Link>
              <span className="mx-2 opacity-40">/</span>
              <Link to="/live" className="hover:opacity-70">Live &amp; Stay</Link>
              <span className="mx-2 opacity-40">/</span>
              <Link to={isHotels ? "/live/stay/hotels" : "/live/stay/accommodation"} className="hover:opacity-70">
                {isHotels ? "Hotels" : "Accommodation"}
              </Link>
              <span className="mx-2 opacity-40">/</span>
              <span style={{ color: "#000000" }}>{item.name}</span>
            </nav>

            {isHotels ? (
              <span className="text-sm font-bold" style={{ color: "#c9962c" }}>{STARS(item.stars)}</span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-[0.02em]" style={{ color: "var(--leaf)" }}>{item.type}</span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-5 leading-tight" style={{ color: "#000000" }}>{item.name}</h1>
            <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: "#000000" }}>{item.tagline}</p>

            <p className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{item.description}</p>

            {!isHotels && (
              <p className="text-sm mt-6" style={{ color: "rgba(0,0,0,0.6)" }}>
                {item.guests} guests · {item.bedrooms} bedroom{item.bedrooms !== 1 ? "s" : ""} · {item.host}
              </p>
            )}

            {item.amenities?.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl md:text-2xl font-bold mb-4 leading-tight" style={{ color: "#000000" }}>
                  {isHotels ? "Amenities" : "What this place offers"}
                </h2>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {item.amenities.map((a) => (
                    <li key={a} className="flex items-start gap-2.5 text-sm" style={{ color: "#000000" }}>
                      <span style={{ color: "var(--sage)" }}>✓</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28 self-start flex flex-col gap-6">
            <div className="rounded-3xl p-7" style={{ backgroundColor: "#fff", boxShadow: "0 10px 40px -22px rgba(28,46,56,0.3)" }}>
              <h3 className="text-xs font-bold uppercase tracking-[0.02em] mb-3" style={{ color: "var(--leaf)" }}>Find It</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#000000" }}>{address}</p>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                className="block text-center py-3 rounded-full font-semibold text-white transition-colors"
                style={{ backgroundColor: "var(--leaf)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}>
                Get Directions
              </a>
              {isHotels && item.website && (
                <a href={item.website} target="_blank" rel="noopener noreferrer"
                  className="block text-center py-3 rounded-full font-semibold mt-3 transition-colors"
                  style={{ border: "1.5px solid var(--leaf)", color: "var(--leaf)" }}>
                  Visit hotel website & book ↗
                </a>
              )}
              {!isHotels && (
                <p className="text-[11px] leading-relaxed mt-4" style={{ color: "rgba(0,0,0,0.5)" }}>
                  Example listing — contact the town centre team to enquire about a real booking.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* Map */}
      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Location" note={address} query={item.mapQuery} />
        </div>
      </section>
    </div>
  );
}

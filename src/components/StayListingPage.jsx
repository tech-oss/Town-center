import { Link } from "react-router-dom";
import { useEffect } from "react";
import { getHotels, getAccommodations } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";

const STARS = (n) => "★".repeat(n) + "☆".repeat(5 - n);

function HotelCard({ h }) {
  return (
    <Link
      to={`/live/stay/hotels/${h.slug}`}
      className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
      style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={h.image} alt={h.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span
          className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#c9962c" }}
        >
          {STARS(h.stars)}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-6 flex-1">
        <h3 className="font-bold text-lg leading-snug" style={{ color: "#000000" }}>{h.name}</h3>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#000000" }}>{h.tagline}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto pt-2" style={{ color: "var(--leaf)" }}>
          View hotel
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

function AccommodationCard({ a }) {
  return (
    <Link
      to={`/live/stay/accommodation/${a.slug}`}
      className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
      style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={a.image} alt={a.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span
          className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-[0.02em] px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#000000" }}
        >
          {a.type}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-6 flex-1">
        <h3 className="font-bold text-lg leading-snug" style={{ color: "#000000" }}>{a.name}</h3>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#000000" }}>{a.tagline}</p>
        <p className="text-xs" style={{ color: "rgba(0,0,0,0.55)" }}>{a.guests} guests · {a.bedrooms} bedroom{a.bedrooms !== 1 ? "s" : ""}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto pt-2" style={{ color: "var(--leaf)" }}>
          View stay
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

export default function StayListingPage({ kind }) {
  const isHotels = kind === "hotels";
  const { data: hotels } = useFetch(getHotels, []);
  const { data: accommodations } = useFetch(getAccommodations, []);
  const items = isHotels ? hotels : accommodations;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      {/* Hero band */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 overflow-hidden"
        style={{ backgroundColor: "var(--forest)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(47,164,164,0.28) 0%, transparent 70%)",
          }}
        />
        <span className="relative text-xs font-bold uppercase tracking-[0.02em] mb-4" style={{ color: "var(--sage)" }}>
          Live &amp; Stay
        </span>
        <h1 className="relative text-4xl md:text-6xl font-bold leading-tight mb-6 text-white">
          {isHotels ? "Hotels in Maidenhead" : "Accommodation in Maidenhead"}
        </h1>
        <p className="relative text-base md:text-lg max-w-xl leading-relaxed" style={{ color: "var(--mint)" }}>
          {isHotels
            ? "Where to stay in and around the town centre, from budget chains to riverside hotels — every listing links to the hotel's own site for booking."
            : "Privately-owned homes and rooms to stay in around Maidenhead — example listings shown here; get in touch to arrange a real booking channel."}
        </p>
      </section>

      {/* Body */}
      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-10 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to="/live" className="hover:opacity-70 transition-opacity">Live &amp; Stay</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>{isHotels ? "Hotels" : "Accommodation"}</span>
          </nav>

          {!items ? (
            <Loading minHeight="30vh" />
          ) : items.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>Nothing listed yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {isHotels
                ? items.map((h) => <HotelCard key={h.slug} h={h} />)
                : items.map((a) => <AccommodationCard key={a.slug} a={a} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

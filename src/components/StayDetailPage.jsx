import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { getHotelBySlug, getAccommodationBySlug } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";
import PlaceDetailLayout from "./PlaceDetailLayout";
import NewsOffers from "./NewsOffers";
import { STAY_DISCOVER } from "../Data/stayDiscover";

// Gold star row — 4 of 5 → "★★★★☆". Rendered as its own badge alongside the
// category pill, same pill styling as the rest of the layout.
function StarBadge({ stars }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-1.5 rounded-full"
      style={{ backgroundColor: "#fff", color: "#000000", boxShadow: "0 4px 16px -8px rgba(28,46,56,0.3)" }}
    >
      <span style={{ color: "#c9962c" }}>{"★".repeat(stars) + "☆".repeat(5 - stars)}</span>
      {stars}-Star Hotel
    </span>
  );
}

function buildSocial(item) {
  const s = item.social;
  if (!s) return null;
  return [
    s.instagram && { icon: "instagram", href: s.instagram, label: "Instagram" },
    s.facebook && { icon: "facebook", href: s.facebook, label: "Facebook" },
    s.x && { icon: "x", href: s.x, label: "X" },
  ].filter(Boolean);
}

// Categorised amenities section — a clean checklist grouped under its own
// category (Property Facilities / Room Facilities / Travel Group), mirroring
// the same three categories the business owner selects from on the business
// dashboard. No per-item icon or blurb — just the name and a checkmark, kept
// deliberately quiet so a long list still reads as premium, not busy.
// Rendered via PlaceDetailLayout's afterGallery slot, directly below the
// photo grid.
function AmenityCategory({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="bg-white rounded-2xl p-6 md:p-7" style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)" }}>
      <h3
        className="text-xs font-bold uppercase tracking-[0.08em] pb-3 mb-4"
        style={{ color: "var(--leaf)", borderBottom: "1px solid rgba(28,46,56,0.1)" }}
      >
        {title}
      </h3>
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {items.map((a) => (
          <li key={a} className="flex items-start gap-2.5 text-sm leading-snug" style={{ color: "#000000" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AmenitiesSection({ categories, heading }) {
  const populated = categories.filter((c) => c.items?.length);
  if (!populated.length) return null;
  return (
    <section className="py-16 md:py-20 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-5xl mx-auto">
        <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>Lifestyle</p>
        <h2 className="hero-title uppercase text-3xl md:text-5xl mb-4" style={{ color: "#000000" }}>{heading}</h2>
        <p className="text-base md:text-lg leading-relaxed mb-10 max-w-xl" style={{ color: "#000000" }}>
          Thoughtful amenities designed to elevate your comfort, convenience, and stay.
        </p>
        <div className="flex flex-col gap-5">
          {populated.map((c) => (
            <AmenityCategory key={c.title} title={c.title} items={c.items} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function StayDetailPage({ kind }) {
  const isHotels = kind === "hotels";
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const backTo = searchParams.get("back");
  const fetcher = isHotels ? () => getHotelBySlug(slug) : () => getAccommodationBySlug(slug);
  const { data: item, loading, error } = useFetch(fetcher, [slug, kind]);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (loading) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  if (!item) return <Navigate to={isHotels ? "/live/stay/hotels" : "/live/stay/accommodation"} replace />;

  const listPath = isHotels ? "/live/stay/hotels" : "/live/stay/accommodation";
  const gallery = item.gallery?.length ? item.gallery : [item.image];
  const address = item.address ?? item.area;

  // Tagline renders above the hero (PlaceDetailLayout's first description
  // paragraph); guest/host details (accommodation only) and the full
  // description render below it, same as any listing with multiple
  // description paragraphs.
  const description = [
    item.tagline,
    ...(!isHotels ? [`${item.guests} guests · ${item.bedrooms} bedroom${item.bedrooms !== 1 ? "s" : ""} · ${item.host}`] : []),
    ...(item.description ? item.description.split("\n\n") : []),
  ].filter(Boolean);

  return (
    <PlaceDetailLayout
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: "Live & Stay", to: "/live" },
        { label: isHotels ? "Hotels" : "Accommodation", to: listPath },
        { label: item.name },
      ]}
      categoryLabel={isHotels ? "Hotel" : item.type}
      extraBadges={isHotels ? <StarBadge stars={item.stars} /> : null}
      title={item.name}
      heroImage={gallery[0]}
      extraImages={gallery.slice(1)}
      backLink={backTo ? { to: backTo, label: "Back to results" } : undefined}
      description={description}
      address={address}
      phone={item.phone}
      email={item.email}
      social={buildSocial(item)}
      website={item.website}
      directionsQuery={item.mapQuery}
      shareInActions
      stickyBooking={isHotels && !!item.website}
      relatedHeading="Stay Here & Discover"
      relatedBackground="#ffffff"
      related={STAY_DISCOVER}
      afterGallery={
        <AmenitiesSection
          categories={[
            { title: "Property Facilities", items: item.facilities },
            { title: "Room Facilities", items: item.roomFacilities },
            { title: "Travel Group", items: item.travelGroup },
          ]}
          heading={isHotels ? "Amenities" : "What This Place Offers"}
        />
      }
      afterMap={<NewsOffers item={item} />}
    />
  );
}

import { useParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { getHotelBySlug, getAccommodationBySlug, getHotels, getAccommodations } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";
import PlaceDetailLayout from "./PlaceDetailLayout";

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

// Same-style checklist section as the original amenities block, now
// rendered via PlaceDetailLayout's afterMap slot so it sits in the shared
// layout's rhythm (between the map and the related grid) with matching
// heading typography to the "Related" section beneath it.
function buildSocial(item) {
  const s = item.social;
  if (!s) return null;
  return [
    s.instagram && { icon: "instagram", href: s.instagram, label: "Instagram" },
    s.facebook && { icon: "facebook", href: s.facebook, label: "Facebook" },
    s.x && { icon: "x", href: s.x, label: "X" },
  ].filter(Boolean);
}

function AmenitiesSection({ amenities, heading }) {
  if (!amenities?.length) return null;
  return (
    <section className="pb-16 md:pb-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="hero-title uppercase text-2xl md:text-3xl mb-8" style={{ color: "#000000" }}>{heading}</h2>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          {amenities.map((a) => (
            <li key={a} className="flex items-start gap-2.5 text-sm md:text-base" style={{ color: "#000000" }}>
              <span style={{ color: "var(--sage)" }}>✓</span> {a}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function StayDetailPage({ kind }) {
  const isHotels = kind === "hotels";
  const { slug } = useParams();
  const fetcher = isHotels ? () => getHotelBySlug(slug) : () => getAccommodationBySlug(slug);
  const { data: item, loading, error } = useFetch(fetcher, [slug, kind]);
  const { data: siblings, loading: loadingSiblings } = useFetch(isHotels ? getHotels : getAccommodations, [kind]);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (loading || loadingSiblings) return <Loading minHeight="70vh" />;
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
    item.description,
  ].filter(Boolean);

  const related = (siblings ?? [])
    .filter((s) => s.slug !== item.slug)
    .slice(0, 3)
    .map((s) => ({
      slug: s.slug,
      to: `${listPath}/${s.slug}`,
      image: s.image,
      category: isHotels ? `${s.stars}-Star Hotel` : s.type,
      name: s.name,
    }));

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
      description={description}
      address={address}
      phone={item.phone}
      email={item.email}
      social={buildSocial(item)}
      website={item.website}
      directionsQuery={item.mapQuery}
      relatedHeading={isHotels ? "More Hotels in Maidenhead" : "More Accommodation in Maidenhead"}
      related={related}
      afterMap={
        <AmenitiesSection
          amenities={item.amenities}
          heading={isHotels ? "Amenities" : "What This Place Offers"}
        />
      }
    />
  );
}

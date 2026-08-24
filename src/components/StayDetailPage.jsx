import { useParams, Navigate } from "react-router-dom";
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

// ── Amenity icons — thin-line, matching the reference design's stroke
// weight and circular mint-tinted background. ──
function AmenityIcon({ name }) {
  const p = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "var(--leaf)", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "wifi": return (<svg {...p}><path d="M2 8.5a16 16 0 0120 0" /><path d="M5.5 12a11 11 0 0113 0" /><path d="M9 15.5a6 6 0 016 0" /><circle cx="12" cy="19" r="1" fill="var(--leaf)" stroke="none" /></svg>);
    case "swim": return (<svg {...p}><circle cx="18" cy="6" r="1.5" fill="var(--leaf)" stroke="none" /><path d="M4 12l3-3 3 2 3-3 3 2 3-3" /><path d="M3 18c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" /></svg>);
    case "restaurant": return (<svg {...p}><path d="M3 17a9 6 0 0118 0" /><path d="M2 17h20M12 17V6" /></svg>);
    case "garden": return (<svg {...p}><path d="M12 21V10" /><path d="M12 10C12 6 9 4 6 4c0 4 2.5 6.5 6 6z" /><path d="M12 13c0-3.5 2.5-5.5 6-6 0 3.5-2.5 6-6 6z" /></svg>);
    case "parking": return (<svg {...p}><rect x="3" y="7" width="18" height="11" rx="2" /><path d="M7 18v2M17 18v2M3 12h18" /><path d="M6.5 12V9h2a1.5 1.5 0 010 3h-2z" /></svg>);
    case "family": return (<svg {...p}><circle cx="8" cy="8" r="3" /><path d="M2 20a6 6 0 0112 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15 20a5 5 0 016-4.5" /></svg>);
    case "kitchen": return (<svg {...p}><path d="M4 3v7a3 3 0 006 0V3M7 10v11" /><path d="M15 3c-1 2-1 4 0 6s1 4 0 6M15 3v18" /></svg>);
    case "laundry": return (<svg {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="13" r="4" /><circle cx="8" cy="6.5" r="0.8" fill="var(--leaf)" stroke="none" /></svg>);
    case "river": return (<svg {...p}><path d="M2 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /><path d="M2 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /><path d="M2 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /></svg>);
    case "walk": return (<svg {...p}><circle cx="14" cy="4" r="1.6" fill="var(--leaf)" stroke="none" /><path d="M10 22l1.5-6L9 14l1-5 3 1 3 4-2 1-1-2-1.5 2 2 2-1 5" /></svg>);
    case "pet": return (<svg {...p}><circle cx="7" cy="9" r="1.6" /><circle cx="11.5" cy="6.5" r="1.6" /><circle cx="16" cy="9" r="1.6" /><circle cx="18" cy="13.5" r="1.6" /><path d="M6 19c0-3 3-4 6-4s6 1 6 4c0 1.5-1.5 2-3 1.5-2-1-4-1-6 0-1.5.5-3 0-3-1.5z" /></svg>);
    case "door": return (<svg {...p}><rect x="5" y="2" width="14" height="20" rx="1" /><circle cx="14.5" cy="12" r="1" fill="var(--leaf)" stroke="none" /></svg>);
    case "cup": return (<svg {...p}><path d="M4 8h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" /><path d="M17 9h1.5a2.5 2.5 0 010 5H17M7 3c0 1-1 1-1 2M11 3c0 1-1 1-1 2" /></svg>);
    case "bbq": return (<svg {...p}><path d="M12 3s5 4 5 9a5 5 0 01-10 0c0-1.5.5-2.5 1.5-3.5C9 10 9.5 11 9.5 11S9 6 12 3z" /></svg>);
    case "conference": return (<svg {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M3 12h18" /></svg>);
    case "shield": return (<svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>);
    default: return (<svg {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /></svg>);
  }
}

// Keyword → {icon, blurb} for each amenity label, so the section reads as a
// curated feature list rather than a bare checklist. Matched in order —
// first hit wins — with a generic fallback for anything unmapped.
const AMENITY_META = [
  [/wi-?fi/i, "wifi", "Stay connected with Wi-Fi throughout your stay."],
  [/spa|pool|swim/i, "swim", "Relax and unwind with the on-site spa and pool."],
  [/restaurant|bar/i, "restaurant", "Enjoy a meal or drink without leaving the building."],
  [/garden/i, "garden", "Step outside to a private, landscaped garden."],
  [/parking/i, "parking", "Secure, convenient parking on site."],
  [/family/i, "family", "Spacious rooms well suited to families and groups."],
  [/kitchen/i, "kitchen", "Cook your own meals in a fully equipped kitchen."],
  [/washer|dryer/i, "laundry", "Laundry facilities on hand for longer stays."],
  [/river|thames|waterside/i, "river", "Soak up riverside views just steps away."],
  [/station|walk/i, "walk", "A short, easy walk from the station and town centre."],
  [/pet/i, "pet", "Bring your pet along — this stay welcomes them."],
  [/entrance/i, "door", "A private entrance for added privacy and ease."],
  [/kettle|microwave/i, "cup", "Handy extras on hand for tea, coffee and quick snacks."],
  [/bbq|furniture/i, "bbq", "Outdoor furniture and a BBQ for al fresco evenings."],
  [/conference/i, "conference", "Well-equipped spaces for meetings and events."],
  [/guarantee/i, "shield", "Book with confidence, backed by a satisfaction guarantee."],
];
function amenityMeta(label) {
  const hit = AMENITY_META.find(([re]) => re.test(label));
  return hit ? { icon: hit[1], blurb: hit[2] } : { icon: "star", blurb: "A thoughtful extra included with your stay." };
}

// Feature-card amenities section — icon, title, one-line blurb and a
// checkmark per amenity, matching the reference design exactly. Rendered via
// PlaceDetailLayout's afterGallery slot, directly below the photo grid.
function AmenitiesSection({ amenities, heading }) {
  if (!amenities?.length) return null;
  return (
    <section className="py-16 md:py-20 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-5xl mx-auto">
        <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>Lifestyle</p>
        <h2 className="hero-title uppercase text-3xl md:text-5xl mb-4" style={{ color: "#000000" }}>{heading}</h2>
        <p className="text-base md:text-lg leading-relaxed mb-10 max-w-xl" style={{ color: "#000000" }}>
          Thoughtful amenities designed to elevate your comfort, convenience, and stay.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {amenities.map((a) => {
            const { icon, blurb } = amenityMeta(a);
            return (
              <div
                key={a}
                className="bg-white rounded-2xl p-5 flex items-center gap-4"
                style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)" }}
              >
                <span
                  className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--mint)" }}
                >
                  <AmenityIcon name={icon} />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base mb-1" style={{ color: "#000000" }}>{a}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.65)" }}>{blurb}</p>
                </div>
                <span
                  className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
                  style={{ borderColor: "var(--leaf)", color: "var(--leaf)" }}
                >
                  ✓
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function StayDetailPage({ kind }) {
  const isHotels = kind === "hotels";
  const { slug } = useParams();
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
    item.description,
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
          amenities={item.amenities}
          heading={isHotels ? "Amenities" : "What This Place Offers"}
        />
      }
      afterMap={<NewsOffers item={item} />}
    />
  );
}

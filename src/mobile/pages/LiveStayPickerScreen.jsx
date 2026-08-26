import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { featuredHotels, featuredAccommodations } from "../../Data/featuredStay";

// Same 4 properties spotlighted on the web Hotels/Accommodation listing
// pages' "Featured" sections — shown together here since the app doesn't
// split hotels and accommodation onto separate landing pages the way the
// website does.
const FEATURED = [
  ...featuredHotels.map((place) => ({ kind: "hotels", place, tag: "Hotel" })),
  ...featuredAccommodations.map((place) => ({ kind: "accommodation", place, tag: "Accommodation" })),
];

// Same pattern as Services: Hotels and Accommodation are genuinely different
// listing types on the website (/live/stay/hotels vs /live/stay/accommodation,
// each with their own filters — star rating vs property type, amenities).
// Asking first avoids merging them into one messy combined list.
const OPTIONS = [
  {
    key: "hotels",
    label: "Hotels",
    description: "Budget chains to riverside hotels, star-rated",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" /><path d="M3 18v3M21 18v3" /><path d="M3 12V7a1 1 0 0 1 1-1h5v6" />
      </svg>
    ),
  },
  {
    key: "accommodation",
    label: "Accommodation",
    description: "Privately-owned homes and rooms to stay in",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
];

export default function LiveStayPickerScreen() {
  return (
    <MobileShell title="Live & Stay" onBack backFallback="/mobile/explore">
      <div className="flex flex-col gap-6 mobile-stagger">
        <div>
          <h1 className="text-xl font-bold leading-snug mb-1.5" style={{ color: "#000000" }}>
            What are you looking for?
          </h1>
          <p className="text-sm font-medium" style={{ color: "#000000" }}>
            Choose a category to see local listings and filters for just that group.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map((o) => (
            <Link
              key={o.key}
              to={`/mobile/live/${o.key}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white active:opacity-85"
              style={{ boxShadow: "0 10px 26px -12px rgba(28,46,56,0.45)" }}
            >
              <span
                className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(140deg, var(--forest), var(--teal-deep))" }}
              >
                {o.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-base font-bold" style={{ color: "#000000" }}>{o.label}</span>
                <span className="block text-xs mt-0.5 leading-snug font-medium" style={{ color: "#000000" }}>{o.description}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ opacity: 0.35 }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>

        {FEATURED.length > 0 && (
          <div>
            <p className="section-eyebrow mb-3" style={{ color: "var(--teal-deep)" }}>Featured Stay</p>
            <div className="flex flex-col gap-3">
              {FEATURED.map(({ kind, place, tag }) => (
                <Link
                  key={place.slug}
                  to={`/mobile/stay/${kind}/${place.slug}`}
                  className="relative overflow-hidden rounded-2xl h-36 flex items-end active:opacity-90"
                  style={{ boxShadow: "0 10px 26px -12px rgba(28,46,56,0.5)" }}
                >
                  <img src={place.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0) 35%, rgba(12,20,24,0.88) 100%)" }} />
                  <div className="relative p-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--mint)", textShadow: "0 1px 6px rgba(0,0,0,0.65)" }}>{tag}</span>
                    <p className="text-base font-bold leading-snug text-white mt-0.5">{place.name}</p>
                    <p className="text-xs mt-0.5 leading-snug font-medium line-clamp-1" style={{ color: "rgba(255,255,255,0.85)" }}>{place.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

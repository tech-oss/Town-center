import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";

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
          <p className="text-sm font-medium" style={{ color: "#000000", opacity: 0.7 }}>
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
                <span className="block text-xs mt-0.5 leading-snug font-medium" style={{ color: "#000000", opacity: 0.65 }}>{o.description}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ opacity: 0.35 }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}

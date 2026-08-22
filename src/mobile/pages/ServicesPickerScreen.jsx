import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";

// Services covers three genuinely different audiences — tradespeople,
// professionals and freelancers — each with their own category set on the
// website (/services/tradespeople, /services/professionals,
// /services/freelancers). Cramming all three into one combined list on
// mobile (the old behaviour) got messy fast, so this screen asks which one
// the user wants first, then hands off to that group's own dedicated
// listing + filters — matching the website's structure instead of
// flattening it.
const OPTIONS = [
  {
    key: "tradespeople",
    label: "Tradesperson",
    description: "Builders, electricians, plumbers, decorators & more",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a4 4 0 0 0 5.1 5.1l-7 7a2.8 2.8 0 0 1-4-4l7-7Z" /><path d="m5.5 18.5 1 1" />
      </svg>
    ),
  },
  {
    key: "professionals",
    label: "Professional",
    description: "Accountants, solicitors, financial advisers & more",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" />
      </svg>
    ),
  },
  {
    key: "freelancers",
    label: "Freelancer",
    description: "Designers, developers, photographers, tutors & more",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
];

export default function ServicesPickerScreen() {
  return (
    <MobileShell title="Services" onBack backFallback="/mobile/explore">
      <div className="flex flex-col gap-6 mobile-stagger">
        <div>
          <h1 className="text-xl font-bold leading-snug mb-1.5" style={{ color: "#000000" }}>
            What service are you looking for?
          </h1>
          <p className="text-sm font-medium" style={{ color: "#000000" }}>
            Choose a category to see local listings and filters for just that group.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {OPTIONS.map((o) => (
            <Link
              key={o.key}
              to={`/mobile/services/${o.key}`}
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
      </div>
    </MobileShell>
  );
}

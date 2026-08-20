import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { work } from "../Data/work";

/* ── Icons (Lucide-style line icons) ── */
const ic = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
const CategoryIcon = ({ name }) => {
  switch (name) {
    case "briefcase": return (<svg {...ic}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>);
    case "tools": return (<svg {...ic}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>);
    case "building": return (<svg {...ic}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4M10 10h4M10 14h4M10 18h4" /></svg>);
    case "handshake": return (<svg {...ic}><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></svg>);
    case "services": return (<svg {...ic}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M9 7h6M9 11h6" /></svg>);
    case "cap": return (<svg {...ic}><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2.5 9 2.5 12 0v-5" /><path d="M22 10v6" /></svg>);
    case "people": return (<svg {...ic}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
    default: return null;
  }
};

// What's coming when the jobs/freelance marketplace launches — reuses the
// same category set already authored in Data/work.js so this list stays in
// sync with the real thing once it ships.
const PREVIEW_CATEGORIES = work.categories.slice(0, 5);

// Other live parts of the site, so a visitor landing here isn't stranded.
const EXPLORE_ELSEWHERE = [
  { label: "See & Do", to: "/see-do" },
  { label: "Eat & Drink", to: "/eat-drink" },
  { label: "Shop", to: "/shop" },
  { label: "Live & Stay", to: "/live" },
];

export default function WorkPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* ── Hero — "Coming Soon" ── */}
      <section
        className="relative w-full h-[70vh] min-h-[560px] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{ backgroundColor: "var(--forest)" }}
      >
        <img src={work.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(47,164,164,0.28) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <span
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "var(--sage)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--sage)" }} />
            Coming Soon
          </span>

          <h1 className="hero-title uppercase text-white text-4xl md:text-6xl leading-tight mb-5" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
            Work In Maidenhead
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-xl leading-relaxed mb-9">
            We're building a home for local jobs, freelance projects and business
            opportunities. It isn't quite ready to launch — but it's on its way.
          </p>

          {/* Notify me */}
          {submitted ? (
            <p className="text-sm font-semibold" style={{ color: "var(--sage)" }}>
              Thanks — we'll let you know the moment it's live.
            </p>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubmitted(true); }}
              className="w-full max-w-md flex flex-col sm:flex-row gap-3 sm:bg-white sm:rounded-full sm:p-1.5 sm:shadow-2xl"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Email address"
                className="flex-1 min-w-0 px-5 py-3.5 rounded-full sm:rounded-full text-sm outline-none bg-white"
                style={{ color: "#000000" }}
              />
              <button
                type="submit"
                className="shrink-0 px-6 py-3.5 rounded-full font-semibold text-sm text-white transition-colors"
                style={{ backgroundColor: "var(--leaf)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
              >
                Notify Me
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── What's coming — a teaser of the categories, greyed out (not
          clickable) so visitors know what to expect without landing on
          broken/empty listing pages. ── */}
      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="section-eyebrow mb-2 text-center" style={{ color: "var(--leaf)" }}>What's on the way</p>
          <h2 className="section-heading text-2xl md:text-3xl font-bold mb-10 text-center" style={{ color: "#000000" }}>
            A New Home For Work In Maidenhead
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {PREVIEW_CATEGORIES.map((c) => (
              <div
                key={c.id}
                className="relative bg-white rounded-2xl p-5 md:p-6 flex flex-col items-center text-center overflow-hidden"
                style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.18)", border: "1px solid rgba(28,46,56,0.06)" }}
              >
                <span className="mb-3" style={{ color: "rgba(28,46,56,0.35)" }}>
                  <CategoryIcon name={c.icon} />
                </span>
                <span className="font-bold text-sm md:text-base leading-tight" style={{ color: "rgba(28,46,56,0.55)" }}>{c.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Explore elsewhere ── */}
      <section className="pb-16 md:pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6" style={{ backgroundColor: "var(--sand)" }}>
          <div>
            <h2 className="section-heading text-xl md:text-2xl font-bold mb-1.5" style={{ color: "#000000" }}>In the meantime, explore Maidenhead</h2>
            <p className="max-w-xl" style={{ color: "#000000" }}>Discover what's already open across the town centre.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            {EXPLORE_ELSEWHERE.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-center px-6 py-3 rounded-full font-semibold text-sm transition-colors"
                style={{ backgroundColor: "#ffffff", color: "#000000", boxShadow: "0 2px 8px -4px rgba(28,46,56,0.15)" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

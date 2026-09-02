import { Link } from "react-router-dom";
import { guides } from "../Data/guides";
import useTapReveal from "../hooks/useTapReveal";

// Three hand-picked guides spanning different interests — family days out,
// food & drink and hidden gems — so the homepage teaser doesn't just repeat
// whatever happens to be first in the data file.
const FEATURED_SLUGS = [
  "10-things-to-do-with-kids-in-maidenhead",
  "date-night-in-maidenhead",
  "hidden-gems-of-maidenhead",
];
const featuredGuides = FEATURED_SLUGS.map((slug) => guides.find((g) => g.slug === slug)).filter(Boolean);

// ── One guide card — same 4:3 spotlight-hover image treatment as the What's
// On event cards, so the two sections read as one consistent system.
function GuideCard({ guide }) {
  const { revealed, onImageClick } = useTapReveal();
  const to = `/guides/${guide.slug}`;
  return (
    <div className="md:col-span-4">
      <Link
        to={to}
        onClick={onImageClick}
        className={`spotlight-card group block ${revealed ? "is-revealed" : ""}`}
      >
        <div
          className="relative w-full overflow-hidden aspect-[4/3]"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <img
            src={guide.cardImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover"
          />
          <img
            src={guide.cardImage}
            alt={guide.title}
            loading="lazy"
            className="spotlight-photo absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </Link>

      <div className="mt-4">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.02em] mb-1"
          style={{ color: "var(--leaf)" }}
        >
          {guide.category}
        </p>
        <h3
          className="text-base md:text-lg leading-snug mb-2.5"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "#000000" }}
        >
          {guide.title}
        </h3>

        <p className="text-xs leading-relaxed" style={{ color: "#000000" }}>
          {guide.summary}
        </p>
      </div>

      <Link
        to={to}
        className="group/more inline-flex items-center gap-1.5 text-sm font-semibold mt-3"
        style={{ color: "#000000" }}
      >
        Read more
        <span className="transition-transform duration-200 group-hover/more:translate-x-1">→</span>
      </Link>
    </div>
  );
}

export default function GuidesGrid() {
  return (
    <section id="guides" className="py-14 md:py-16 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="section-eyebrow mb-2" style={{ color: "var(--leaf)" }}>
              Explore Maidenhead
            </p>
            <h2 className="home-section-title text-3xl md:text-5xl leading-tight" style={{ color: "#000000" }}>
              NEIGHBOURHOOD GUIDES
            </h2>
          </div>
        </div>
        <div className="mb-10 -mt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.14)" }} />

        {/* Cards — same side-by-side portfolio treatment as What's On,
            three per row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-12">
          {featuredGuides.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>

        {/* View all — primary pill button */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/guides"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
            style={{ backgroundColor: "var(--forest)" }}
          >
            View All Guides <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

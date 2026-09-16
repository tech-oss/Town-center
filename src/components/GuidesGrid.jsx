import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { getGuides } from "../api";
import useTapReveal from "../hooks/useTapReveal";

// Homepage teaser for the neighbourhood guides. Shows the guides admin has
// switched on in Admin → Neighbourhood Guides ("Show on Homepage"), newest
// first; if none are switched on it falls back to the first three published
// guides so the section is never empty. Same treatment as the app's home
// screen and the What's On cards above it.
const SLOTS = 3;

function GuideCard({ guide }) {
  const { revealed, onImageClick } = useTapReveal();
  const to = `/guides/${guide.slug}`;
  const image = guide.cardImage || guide.heroImage;
  return (
    <div className="md:col-span-4">
      <Link to={to} onClick={onImageClick} className={`spotlight-card group block ${revealed ? "is-revealed" : ""}`}>
        <div className="relative w-full overflow-hidden aspect-[4/3]" style={{ backgroundColor: "#1a1a1a" }}>
          <img src={image} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
          <img src={image} alt={guide.title} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
        </div>
      </Link>

      <div className="mt-4">
        {guide.category && (
          <p className="text-[11px] font-medium uppercase tracking-[0.02em] mb-1" style={{ color: "var(--leaf)" }}>
            {guide.category}
          </p>
        )}
        <h3 className="text-base md:text-lg leading-snug mb-2.5" style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "#000000" }}>
          {guide.title}
        </h3>
        {guide.summary && <p className="text-xs leading-relaxed" style={{ color: "#000000" }}>{guide.summary}</p>}
      </div>

      <Link to={to} className="group/more inline-flex items-center gap-1.5 text-sm font-semibold mt-3" style={{ color: "#000000" }}>
        Read more
        <span className="transition-transform duration-200 group-hover/more:translate-x-1">→</span>
      </Link>
    </div>
  );
}

export default function GuidesGrid() {
  const { data: guides } = useFetch(getGuides, []);
  const all = guides ?? [];
  const chosen = all.filter((g) => g.showOnHomepage);
  const featured = (chosen.length ? chosen : all).slice(0, SLOTS);

  if (!featured.length) return null;

  return (
    <section id="guides" className="py-14 md:py-16 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="section-eyebrow mb-2" style={{ color: "var(--leaf)" }}>Explore Maidenhead</p>
            <h2 className="home-section-title text-3xl md:text-5xl leading-tight" style={{ color: "#000000" }}>
              NEIGHBOURHOOD GUIDES
            </h2>
          </div>
        </div>
        <div className="mb-10 -mt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.14)" }} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-12">
          {featured.map((g) => <GuideCard key={g.slug} guide={g} />)}
        </div>

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

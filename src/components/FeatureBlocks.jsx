import { Link } from "react-router-dom";
import { getStories } from "../api";
import useFetch from "../hooks/useFetch";
import useTapReveal from "../hooks/useTapReveal";

// ── One featured story card — a 60vw image with its caption set beside it in
// the remaining white space (opposite the image on alternating rows), rather
// than stacked underneath. The image keeps the "In the Spotlight" hover: a
// sharp foreground photo that insets to reveal a blurred, dimmed frame. On
// touch devices the image itself doesn't navigate — a tap only toggles that
// reveal; "Read more" is the actual link on mobile.
function FeatureCard({ story, align }) {
  const reversed = align === "right";
  const { revealed, onImageClick } = useTapReveal();
  const to = `/story/${story.slug}`;
  return (
    <div className={`flex flex-col ${reversed ? "md:flex-row-reverse" : "md:flex-row"} md:items-center gap-6 md:gap-12 w-full`}>
      <Link
        to={to}
        onClick={onImageClick}
        className={`spotlight-card group/img shrink-0 block w-full md:w-[60vw] ${revealed ? "is-revealed" : ""}`}
      >
        <div
          className="relative w-full overflow-hidden aspect-[6/4]"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <img
            src={story.cardImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover"
          />
          <img
            src={story.cardImage}
            alt={story.cardHeading}
            loading="lazy"
            className="spotlight-photo absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </Link>

      <div className={`flex-1 min-w-0 px-6 md:px-0 ${reversed ? "md:text-right" : ""}`}>
        <p
          className="text-[11px] font-medium uppercase tracking-[0.02em] mb-3"
          style={{ color: "var(--leaf)" }}
        >
          {story.eyebrow}
        </p>
        <h3
          className="text-2xl md:text-3xl leading-snug mb-4"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "#000000" }}
        >
          {story.cardHeading}
        </h3>
        <p className="text-sm md:text-base leading-relaxed" style={{ color: "#000000" }}>
          {story.cardBody}
        </p>
        <Link
          to={to}
          className={`group/more inline-flex items-center gap-1.5 text-sm font-semibold mt-5 ${reversed ? "md:flex-row-reverse" : ""}`}
          style={{ color: "#000000" }}
        >
          Read more
          <span className="transition-transform duration-200 group-hover/more:translate-x-1">→</span>
        </Link>
      </div>
    </div>
  );
}

export default function FeatureBlocks() {
  const { data: allFeatures } = useFetch(getStories, []);
  const features = (allFeatures ?? []).filter((f) => f.homepage);

  return (
    <section className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>
                In Focus
              </p>
              <h2 className="home-section-title text-3xl md:text-5xl leading-tight" style={{ color: "#000000" }}>
                FEATURED STORIES
              </h2>
            </div>
            <p
              className="text-sm md:text-base text-right md:text-left md:max-w-xs md:mt-28"
              style={{ color: "#000000", fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Meet the people, discover the places, share the moments.
            </p>
          </div>
          <div className="mt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.14)" }} />
        </div>
      </div>

      {/* Cards break out of the max-w-6xl container so each can size itself
          relative to the full viewport width, not just the text column. */}
      <div className="flex flex-col gap-y-12">
        {(features ?? []).map((story, i) => (
          <FeatureCard key={story.slug} story={story} align={i % 2 === 1 ? "right" : "left"} />
        ))}
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { getStories } from "../api";
import useFetch from "../hooks/useFetch";

// ── One featured story card — a 60vw image with its caption set beside it in
// the remaining white space (opposite the image on alternating rows), rather
// than stacked underneath. The image keeps the "In the Spotlight" hover: a
// sharp foreground photo that insets to reveal a blurred, dimmed frame.
function FeatureCard({ story, align }) {
  const reversed = align === "right";
  return (
    <Link
      to={`/story/${story.slug}`}
      className={`group flex flex-col ${reversed ? "md:flex-row-reverse" : "md:flex-row"} md:items-center gap-6 md:gap-12 w-full`}
    >
      <div className="spotlight-card shrink-0 w-full md:w-[60vw]">
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
      </div>

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
      </div>
    </Link>
  );
}

export default function FeatureBlocks() {
  const { data: features } = useFetch(getStories, []);

  return (
    <section className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 md:mb-16">
          <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>
            In Focus
          </p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "#000000" }}>
            Featured Stories
          </h2>
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

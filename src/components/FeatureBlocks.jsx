import { Link } from "react-router-dom";
import { getStories } from "../api";
import useFetch from "../hooks/useFetch";

// ── One featured story card — image + caption (title left / excerpt right),
// matching the "In the Spotlight" portfolio treatment: sharp foreground
// photo that insets on hover to reveal a blurred, dimmed copy as a frame.
function FeatureCard({ story, align }) {
  return (
    <Link
      to={`/story/${story.slug}`}
      className={`spotlight-card group block w-full md:w-1/2 ${align === "right" ? "md:ml-auto" : "md:mr-auto"}`}
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

      <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-6">
        <div className="sm:max-w-[52%]">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.02em] mb-1"
            style={{ color: "var(--leaf)" }}
          >
            {story.eyebrow}
          </p>
          <h3
            className="text-base md:text-lg leading-snug"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "#000000" }}
          >
            {story.cardHeading}
          </h3>
        </div>
        <p
          className="text-xs leading-relaxed sm:max-w-[44%] sm:text-right"
          style={{ color: "#000000" }}
        >
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

        <div className="flex flex-col gap-y-12">
          {(features ?? []).map((story, i) => (
            <FeatureCard key={story.slug} story={story} align={i % 2 === 1 ? "right" : "left"} />
          ))}
        </div>
      </div>
    </section>
  );
}

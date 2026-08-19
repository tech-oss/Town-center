import { Link } from "react-router-dom";
import { useEffect } from "react";
import { getArticles } from "../api";
import useFetch from "../hooks/useFetch";
import useTapReveal from "../hooks/useTapReveal";

// Story card — keeps the "In the Spotlight" framed-photo hover: a sharp
// foreground photo that insets on hover/tap to reveal a blurred, dimmed
// frame around it, matching the homepage Featured Stories treatment.
function StoryCard({ story }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div className="bg-white rounded-3xl overflow-hidden flex flex-col" style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}>
      <Link
        to={`/news/${story.slug}`}
        onClick={onImageClick}
        className={`spotlight-card group block ${revealed ? "is-revealed" : ""}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
          <img src={story.image} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
          <img src={story.image} alt={story.title} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
          <span
            className="absolute top-3 left-3 z-10 text-[11px] font-bold uppercase tracking-[0.02em] px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#000000" }}
          >
            {story.category}
          </span>
        </div>
      </Link>
      <div className="flex flex-col gap-2 p-6 flex-1">
        <p className="text-[11px] font-medium" style={{ color: "#000000" }}>{story.date}</p>
        <h3 className="font-bold text-lg leading-snug" style={{ color: "#000000" }}>{story.title}</h3>
        <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#000000" }}>{story.excerpt}</p>
        <Link to={`/news/${story.slug}`} className="group/more inline-flex items-center gap-1.5 text-sm font-semibold mt-auto pt-2" style={{ color: "var(--leaf)" }}>
          Read more
          <span className="transition-transform duration-200 group-hover/more:translate-x-1">→</span>
        </Link>
      </div>
    </div>
  );
}

export default function NewsIndexPage() {
  const { data: articles } = useFetch(getArticles, []);
  // Show the hand-written, real stories (Coppa Club, COCOBA, …) rather than the
  // auto-generated per-business placeholders (which end in -offer / -news / -event).
  const stories = (articles ?? []).filter((a) => !/-(offer|news|event)$/.test(a.slug));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      {/* Hero band */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 overflow-hidden"
        style={{ backgroundColor: "var(--forest)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(47,164,164,0.28) 0%, transparent 70%)",
          }}
        />
        <span className="relative text-xs font-bold uppercase tracking-[0.02em] mb-4" style={{ color: "var(--sage)" }}>
          From the Journal
        </span>
        <h1 className="relative text-4xl md:text-6xl font-bold leading-tight mb-6 text-white">
          In the Spotlight
        </h1>
        <p className="relative text-base md:text-lg max-w-xl leading-relaxed" style={{ color: "var(--mint)" }}>
          News, offers and events from Maidenhead's independent businesses — the latest on what's new,
          what's on and what's worth discovering in town.
        </p>
      </section>

      {/* Body */}
      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-10 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Journal</span>
          </nav>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {stories.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

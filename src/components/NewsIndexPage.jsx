import { Link } from "react-router-dom";
import { useEffect } from "react";
import { allArticles } from "../Data/pages";

// Show the hand-written, real stories (Coppa Club, COCOBA, …) rather than the
// auto-generated per-business placeholders (which end in -offer / -news / -event).
const stories = allArticles.filter((a) => !/-(offer|news|event)$/.test(a.slug));

export default function NewsIndexPage() {
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
        <span className="relative text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--sage)" }}>
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
          <nav className="mb-10 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Journal</span>
          </nav>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {stories.map((story) => (
              <Link
                key={story.slug}
                to={`/news/${story.slug}`}
                className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={story.image} alt={story.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span
                    className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "var(--forest)" }}
                  >
                    {story.category}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-6 flex-1">
                  <p className="text-[11px] font-medium" style={{ color: "var(--ink)", opacity: 0.5 }}>{story.date}</p>
                  <h3 className="font-bold text-lg leading-snug" style={{ color: "var(--forest)" }}>{story.title}</h3>
                  <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--ink)", opacity: 0.72 }}>{story.excerpt}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto pt-2" style={{ color: "var(--leaf)" }}>
                    Read more
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

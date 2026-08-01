import { Link } from "react-router-dom";
import { useEffect } from "react";
import { getStories, getArticles } from "../api";
import { blogCards } from "../Data/content";
import useFetch from "../hooks/useFetch";

// Slugs currently live on the homepage's "In the Spotlight" cards, so the
// same "On Homepage" badge used for Featured Stories can be applied here too.
const homepageSpotlightSlugs = new Set(
  blogCards.posts.filter((p) => p.homepage).map((p) => p.href.split("/").pop())
);

function HomepageBadge() {
  return (
    <span
      className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-[0.02em] px-2.5 py-1 rounded-full"
      style={{ backgroundColor: "var(--forest)", color: "#fff" }}
    >
      On Homepage
    </span>
  );
}

function SectionHeading({ eyebrow, title, intro }) {
  return (
    <div className="mb-10 md:mb-12">
      <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>
        {eyebrow}
      </p>
      <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-3" style={{ color: "#000000" }}>
        {title}
      </h2>
      <p className="text-base max-w-2xl leading-relaxed" style={{ color: "#000000" }}>
        {intro}
      </p>
      <div className="mt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.14)" }} />
    </div>
  );
}

export default function OffersPage() {
  const { data: allFeatures } = useFetch(getStories, []);
  const { data: allArticles } = useFetch(getArticles, []);

  // Same real-vs-auto-generated split NewsIndexPage uses, so this page and
  // /news always agree on what counts as a genuine spotlight story.
  const spotlightStories = (allArticles ?? []).filter((a) => !/-(offer|news|event)$/.test(a.slug));
  const featuredStories = allFeatures ?? [];

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
          Offers &amp; Stories
        </span>
        <h1 className="relative text-4xl md:text-6xl font-bold leading-tight mb-6 text-white">
          Every Story, In One Place
        </h1>
        <p className="relative text-base md:text-lg max-w-xl leading-relaxed" style={{ color: "var(--mint)" }}>
          The complete collection of Featured Stories and In the Spotlight articles from Maidenhead's
          independent businesses — including the ones you won't find on the homepage.
        </p>
      </section>

      {/* Body */}
      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-10 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Offers</span>
          </nav>

          {/* ── Featured Stories ── */}
          <SectionHeading
            eyebrow="In Focus"
            title="Featured Stories"
            intro="Long-form editorial pieces on the places shaping Maidenhead — a mix of stories currently on the homepage and others you'll only find here."
          />
          {featuredStories.length === 0 ? (
            <p className="text-sm mb-16" style={{ color: "rgba(0,0,0,0.55)" }}>No featured stories yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20">
              {featuredStories.map((story) => (
                <Link
                  key={story.slug}
                  to={`/story/${story.slug}`}
                  className="group relative bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={story.cardImage} alt={story.cardHeading} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span
                      className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-[0.02em] px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#000000" }}
                    >
                      {story.category}
                    </span>
                    {story.homepage && <HomepageBadge />}
                  </div>
                  <div className="flex flex-col gap-2 p-6 flex-1">
                    <p className="text-[11px] font-medium" style={{ color: "#000000" }}>{story.date}</p>
                    <h3 className="font-bold text-lg leading-snug" style={{ color: "#000000" }}>{story.cardHeading}</h3>
                    <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#000000" }}>{story.cardBody}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto pt-2" style={{ color: "var(--leaf)" }}>
                      Read more
                      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── In the Spotlight ── */}
          <SectionHeading
            eyebrow="From the Journal"
            title="In the Spotlight"
            intro="News, offers and events from Maidenhead's independent businesses — the full archive, not just what's currently live on the homepage."
          />
          {spotlightStories.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(0,0,0,0.55)" }}>No spotlight articles yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {spotlightStories.map((story) => (
                <Link
                  key={story.slug}
                  to={`/news/${story.slug}`}
                  className="group relative bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={story.image} alt={story.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span
                      className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-[0.02em] px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#000000" }}
                    >
                      {story.category}
                    </span>
                    {homepageSpotlightSlugs.has(story.slug) && <HomepageBadge />}
                  </div>
                  <div className="flex flex-col gap-2 p-6 flex-1">
                    <p className="text-[11px] font-medium" style={{ color: "#000000" }}>{story.date}</p>
                    <h3 className="font-bold text-lg leading-snug" style={{ color: "#000000" }}>{story.title}</h3>
                    <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#000000" }}>{story.excerpt}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto pt-2" style={{ color: "var(--leaf)" }}>
                      Read more
                      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

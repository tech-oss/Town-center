import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { getArticles } from "../api";
import useFetch from "../hooks/useFetch";

// Category filter options, in display order.
const CATEGORY_ORDER = ["News", "Offer", "What's On", "Featured"];

function StoryCard({ story }) {
  return (
    <Link
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
        <div className="flex items-center gap-2 flex-wrap">
          {story.business?.name && (
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>
              {story.business.name}
            </span>
          )}
          <p className="text-[11px] font-medium" style={{ color: "var(--ink)", opacity: 0.5 }}>{story.date}</p>
        </div>
        <h3 className="font-bold text-lg leading-snug" style={{ color: "var(--forest)" }}>{story.title}</h3>
        <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--ink)", opacity: 0.72 }}>{story.excerpt}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto pt-2" style={{ color: "var(--leaf)" }}>
          Read more
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

export default function NewsIndexPage() {
  const { data: articles } = useFetch(getArticles, []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  // Show the hand-written, real stories (Coppa Club, COCOBA, …) rather than the
  // auto-generated per-business placeholders (which end in -offer / -news / -event).
  const stories = useMemo(
    () => (articles ?? []).filter((a) => !/-(offer|news|event)$/.test(a.slug)),
    [articles]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Category options actually present in the data (keeps chips relevant).
  const categories = useMemo(() => {
    const present = new Set(stories.map((s) => s.category).filter(Boolean));
    const known = CATEGORY_ORDER.filter((c) => present.has(c));
    const extras = [...present].filter((c) => !CATEGORY_ORDER.includes(c)).sort();
    return ["All", ...known, ...extras];
  }, [stories]);

  // Filter by selected category + free-text business name search.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories.filter((s) => {
      if (category !== "All" && s.category !== category) return false;
      if (q && !(s.business?.name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [stories, query, category]);

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
          <nav className="mb-8 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Journal</span>
          </nav>

          {/* Controls: search + category filter */}
          <div className="mb-10 flex flex-col gap-5">
            {/* Search by business name */}
            <div className="max-w-md">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base" style={{ color: "var(--leaf)", opacity: 0.6 }}>🔍</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by business name…"
                  className="w-full rounded-full pl-11 pr-10 py-3.5 text-sm outline-none transition-shadow focus:shadow-md"
                  style={{ border: "1.5px solid rgba(27,67,50,0.2)", backgroundColor: "#fff", color: "var(--forest)" }}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-70"
                    style={{ backgroundColor: "rgba(27,67,50,0.08)", color: "var(--forest)" }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category filter chips */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: "var(--ink)", opacity: 0.5 }}>Category:</span>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={category === c
                    ? { backgroundColor: "var(--forest)", color: "#fff" }
                    : { backgroundColor: "#fff", color: "var(--forest)", border: "1.5px solid rgba(27,67,50,0.2)" }
                  }
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Result count */}
            <p className="text-xs" style={{ color: "var(--ink)", opacity: 0.6 }}>
              Showing {filtered.length} stor{filtered.length !== 1 ? "ies" : "y"}
              {category !== "All" ? ` in ${category}` : ""}
              {query ? ` matching "${query}"` : ""}
            </p>
          </div>

          {/* Stories grid */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-bold text-lg" style={{ color: "var(--forest)" }}>No stories found</p>
              <p className="text-sm mt-1" style={{ color: "var(--ink)", opacity: 0.6 }}>
                Try a different category or business name.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filtered.map((story) => (
                <StoryCard key={story.slug} story={story} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

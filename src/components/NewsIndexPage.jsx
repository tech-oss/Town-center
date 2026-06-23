import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { getArticles } from "../api";
import useFetch from "../hooks/useFetch";

// Display order for the category groups.
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

  // Show the hand-written, real stories (Coppa Club, COCOBA, …) rather than the
  // auto-generated per-business placeholders (which end in -offer / -news / -event).
  const stories = useMemo(
    () => (articles ?? []).filter((a) => !/-(offer|news|event)$/.test(a.slug)),
    [articles]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Free-text search by business name.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stories;
    return stories.filter((s) => (s.business?.name ?? "").toLowerCase().includes(q));
  }, [stories, query]);

  // Group by category, in the defined display order. Any unknown category is
  // appended after the known ones, alphabetically.
  const grouped = useMemo(() => {
    const byCat = new Map();
    for (const s of filtered) {
      const cat = s.category ?? "Other";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(s);
    }
    const knownOrder = CATEGORY_ORDER.filter((c) => byCat.has(c));
    const extras = [...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort();
    return [...knownOrder, ...extras].map((cat) => [cat, byCat.get(cat)]);
  }, [filtered]);

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

          {/* Search by business name */}
          <div className="mb-12 max-w-md">
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
            {query && (
              <p className="mt-2 text-xs px-1" style={{ color: "var(--ink)", opacity: 0.6 }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
              </p>
            )}
          </div>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-bold text-lg" style={{ color: "var(--forest)" }}>No stories found</p>
              <p className="text-sm mt-1" style={{ color: "var(--ink)", opacity: 0.6 }}>
                No businesses match "{query}". Try a different name.
              </p>
            </div>
          ) : (
            /* Grouped by category */
            <div className="flex flex-col gap-16">
              {grouped.map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center gap-4 mb-7">
                    <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--forest)" }}>{category}</h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(27,67,50,0.08)", color: "var(--leaf)" }}>
                      {items.length}
                    </span>
                    <span className="flex-1 h-px" style={{ backgroundColor: "rgba(27,67,50,0.12)" }} />
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {items.map((story) => (
                      <StoryCard key={story.slug} story={story} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

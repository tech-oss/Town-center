import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { sections, categoryTitles } from "../Data/pages";

export default function CategoryPage() {
  const { section, category } = useParams();
  const sec = sections[section];

  // Scroll to top whenever the page (or category) changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section, category]);

  if (!sec) return <Navigate to="/" replace />;

  // An item appears under its primary `category` plus any extra `categories`.
  const items = category
    ? sec.items.filter((i) => i.category === category || i.categories?.includes(category))
    : sec.items;
  const isCategory = Boolean(category);
  const title = isCategory ? categoryTitles[category] ?? sec.label : sec.landing.title;
  const intro = isCategory
    ? `Browse ${categoryTitles[category]?.toLowerCase() ?? "places"} across Maidenhead town centre.`
    : sec.landing.intro;

  return (
    <div>
      {/* ── Hero banner ── */}
      <section className="relative h-[42vh] min-h-[300px] w-full overflow-hidden">
        <img src={sec.landing.hero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.35) 0%, rgba(28,46,56,0.78) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-12">
          {/* Breadcrumb */}
          <nav className="mb-4 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--mint)" }}>
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <Link to={sec.path} className="hover:text-white transition-colors">{sec.label}</Link>
            {isCategory && (
              <>
                <span className="mx-2 opacity-50">/</span>
                <span className="text-white">{title}</span>
              </>
            )}
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
            {title}
          </h1>
        </div>
      </section>

      {/* ── Intro + content ── */}
      <section className="py-14 md:py-20 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-base md:text-lg leading-relaxed max-w-3xl mb-10" style={{ color: "var(--ink)", opacity: 0.8 }}>
            {intro}
          </p>

          {/* Category filter chips */}
          <div className="flex gap-2.5 overflow-x-auto pb-3 mb-10 -mx-1 px-1 scrollbar-none">
            <FilterChip to={sec.path} active={!isCategory} label="All" />
            {(() => {
              const seen = new Set();
              return sec.columns
                .flatMap((c) => c.links)
                .filter((l) => l.to.includes("/category/") && !seen.has(l.to) && seen.add(l.to))
                .map((l) => {
                  const cat = l.to.split("/category/")[1];
                  return <FilterChip key={l.to} to={l.to} active={category === cat} label={l.label} />;
                });
            })()}
          </div>

          {/* Card grid */}
          {items.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {items.map((it) => (
                <Link
                  key={it.slug}
                  to={`/${it.section}/place/${it.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden" style={it.logo ? { backgroundColor: "var(--mint)" } : undefined}>
                    {it.logo ? (
                      <img src={it.logo} alt={it.name} loading="lazy" className="w-full h-full object-contain p-10 transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-6">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>
                      {it.tag}
                    </span>
                    <h3 className="font-bold text-xl leading-snug" style={{ color: "var(--forest)" }}>
                      {it.name}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-1" style={{ color: "var(--forest)" }}>
                      Read more
                      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-12 text-sm" style={{ color: "var(--forest)", opacity: 0.6 }}>
              Nothing listed here just yet — check back soon.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterChip({ to, active, label }) {
  return (
    <Link
      to={to}
      className="shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap"
      style={active ? { backgroundColor: "var(--forest)", color: "#fff" } : { backgroundColor: "#fff", color: "var(--forest)" }}
    >
      {label}
    </Link>
  );
}

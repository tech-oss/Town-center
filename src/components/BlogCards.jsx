import { Link } from "react-router-dom";
import { blogCards } from "../Data/content";

// Use SPA navigation for internal routes, plain anchor for hash links
function CardLink({ href, className, style, children }) {
  if (href?.startsWith("/")) return <Link to={href} className={className} style={style}>{children}</Link>;
  return <a href={href} className={className} style={style}>{children}</a>;
}

export default function BlogCards() {
  return (
    <section
      className="relative py-24 px-6 md:px-12 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(150,215,211,0.22) 0%, transparent 70%), linear-gradient(135deg, #16252E 0%, #245C63 50%, #2F8C8C 100%)",
      }}
    >
      <div className="relative max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--mint)" }}>
              {blogCards.eyebrow}
            </p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white">
              {blogCards.heading}
            </h2>
          </div>
          <a
            href={blogCards.cta.href}
            className="group inline-flex items-center gap-2 text-sm font-semibold self-start sm:self-auto text-white/90 hover:text-white transition-colors"
          >
            {blogCards.cta.label}
            <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
          </a>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogCards.posts.map((post, i) => {
            const featured = i === 1; // middle card glows
            return (
              <CardLink
                key={post.id}
                href={post.href}
                className="group relative flex flex-row md:flex-col rounded-2xl overflow-hidden p-3 gap-3 md:gap-0
                           transition-all duration-300 ease-out hover:-translate-y-1"
                style={{
                  backgroundColor: "rgba(240,250,250,0.62)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: featured
                    ? "1.5px solid var(--sage)"
                    : "1px solid rgba(255,255,255,0.45)",
                  boxShadow: featured
                    ? "0 0 0 1px var(--sage), 0 10px 40px -8px rgba(82,199,182,0.55)"
                    : "0 8px 28px -12px rgba(22,37,46,0.45)",
                }}
              >
                {/* Image (left on mobile / top on desktop) */}
                <div className="relative shrink-0 w-28 sm:w-32 md:w-full self-stretch md:self-auto overflow-hidden rounded-xl">
                  <img
                    src={post.imageSrc}
                    alt={post.imageAlt}
                    loading="lazy"
                    className="w-full h-full md:h-44 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <span
                    className="absolute top-2 left-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "var(--leaf)" }}
                  >
                    {post.category}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 min-w-0 md:p-3 md:pt-4">
                  <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--ink)", opacity: 0.5 }}>
                    {post.date}
                  </p>
                  <h3
                    className="font-bold text-sm md:text-lg leading-snug mb-2"
                    style={{ color: "var(--forest)", fontFamily: "var(--font-heading)" }}
                  >
                    {post.title}
                  </h3>
                  <p
                    className="text-xs md:text-sm leading-relaxed mb-3 line-clamp-3"
                    style={{ color: "var(--ink)", opacity: 0.72 }}
                  >
                    {post.excerpt}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold mt-auto"
                    style={{ color: "var(--leaf)" }}
                  >
                    Read more
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </CardLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}

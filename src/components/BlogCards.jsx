import { Link } from "react-router-dom";
import { blogCards } from "../Data/content";
import { btn } from "../utils/design";

function CardLink({ href, className, style, children }) {
  if (href?.startsWith("/")) return <Link to={href} className={className} style={style}>{children}</Link>;
  return <a href={href} className={className} style={style}>{children}</a>;
}

// ── Per-item placement on the desktop 12-column scatter ──────────────────────
// Each entry positions one card: its column span, image aspect ratio (which
// sets its relative size), and a vertical offset for the staggered, editorial
// rhythm of the reference. Items that fit a row sit side-by-side via auto-flow:
//   row 1 → big left  + small right     row 2 → medium centre
//   row 3 → small left + big right
const LAYOUT = [
  { col: "md:col-start-1 md:col-end-8",  ratio: "md:aspect-[4/3]",   offset: "" },
  { col: "md:col-start-9 md:col-end-13", ratio: "md:aspect-[4/3]",   offset: "md:mt-20" },
  { col: "md:col-start-4 md:col-end-11", ratio: "md:aspect-[16/10]", offset: "md:mt-10" },
  { col: "md:col-start-1 md:col-end-5",  ratio: "md:aspect-[5/4]",   offset: "md:mt-16" },
  { col: "md:col-start-6 md:col-end-13", ratio: "md:aspect-[16/11]", offset: "" },
];

// ── One scatter item: image + caption (title left / promo text right) ────────
function PortfolioCard({ post, layout }) {
  return (
    <CardLink
      href={post.href}
      className={`group block ${layout.col} ${layout.offset}`}
    >
      {/* Image — the varied aspect ratios give the reference's size contrast */}
      <div className={`relative w-full overflow-hidden aspect-[4/3] ${layout.ratio}`}>
        <img
          src={post.imageSrc}
          alt={post.imageAlt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>

      {/* Caption — title on the left, promotional text on the right (small) */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-6">
        <div className="sm:max-w-[52%]">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.02em] mb-1"
            style={{ color: "var(--leaf)" }}
          >
            {post.category}
          </p>
          <h3
            className="text-base md:text-lg leading-snug"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "#000000" }}
          >
            {post.title}
          </h3>
        </div>
        <p
          className="text-xs leading-relaxed sm:max-w-[44%] sm:text-right"
          style={{ color: "#000000" }}
        >
          {post.excerpt}
        </p>
      </div>
    </CardLink>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
export default function BlogCards() {
  const posts = blogCards.posts.slice(0, 5);

  return (
    <section
      className="relative py-24 px-6 md:px-12"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="relative max-w-6xl mx-auto">
        {/* Header — heading + rule, matching the reference's editorial masthead */}
        <div className="mb-14 md:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>
                {blogCards.eyebrow}
              </p>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "#000000" }}>
                {blogCards.heading}
              </h2>
            </div>
            <CardLink
              href={blogCards.cta.href}
              className={btn.text.className}
              style={{ color: "#000000" }}
            >
              {blogCards.cta.label}
              <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
            </CardLink>
          </div>
          <div className="mt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.14)" }} />
        </div>

        {/* Staggered editorial scatter — single column on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-12 md:gap-y-6 items-start">
          {posts.map((post, i) => (
            <PortfolioCard key={post.id} post={post} layout={LAYOUT[i]} />
          ))}
        </div>
      </div>
    </section>
  );
}

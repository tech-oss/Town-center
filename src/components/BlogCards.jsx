import { Link } from "react-router-dom";
import { blogCards } from "../Data/content";
import { btn } from "../utils/design";
import useTapReveal from "../hooks/useTapReveal";

function CardLink({ href, className, style, onClick, children }) {
  if (href?.startsWith("/")) return <Link to={href} className={className} style={style} onClick={onClick}>{children}</Link>;
  return <a href={href} className={className} style={style} onClick={onClick}>{children}</a>;
}

// ── Per-item placement on the desktop 12-column scatter ──────────────────────
// Each entry positions one card: its column span and a vertical offset for
// the staggered, editorial rhythm of the reference. All three share the same
// 3:4 image ratio.
const LAYOUT = [
  { col: "md:col-start-1 md:col-end-7",  offset: "" },
  { col: "md:col-start-7 md:col-end-13", offset: "" },
  { col: "md:col-start-4 md:col-end-10", offset: "md:mt-6" },
];

// ── One scatter item: image + caption (title left / promo text right) ────────
function PortfolioCard({ post, layout }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div className={`${layout.col} ${layout.offset}`}>
      {/* Image — hover (desktop) or tap (touch) eases the sharp photo inward,
          revealing a blurred, dimmed copy of the same image around its edges
          (a soft framed vignette, not blank space), matching the reference.
          On touch devices the tap only toggles this effect; it doesn't
          navigate — "Read more" below is the actual link on mobile. */}
      <CardLink
        href={post.href}
        onClick={onImageClick}
        className={`spotlight-card group block ${revealed ? "is-revealed" : ""}`}
      >
        <div
          className="relative w-full overflow-hidden aspect-[3/4]"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          {/* Blurred, dimmed copy of the photo — the frame revealed on hover/tap */}
          <img
            src={post.imageSrc}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover"
          />
          {/* Sharp foreground — insets on hover/tap to reveal the blurred frame */}
          <img
            src={post.imageSrc}
            alt={post.imageAlt}
            loading="lazy"
            className="spotlight-photo absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </CardLink>

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

      {/* Read more — the reliable link on every device, including mobile
          where the image itself no longer navigates */}
      <CardLink
        href={post.href}
        className="group/more inline-flex items-center gap-1.5 text-sm font-semibold mt-3"
        style={{ color: "#000000" }}
      >
        Read more
        <span className="transition-transform duration-200 group-hover/more:translate-x-1">→</span>
      </CardLink>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
export default function BlogCards() {
  const posts = blogCards.posts.slice(0, 3);

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

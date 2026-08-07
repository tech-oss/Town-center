import { Link } from "react-router-dom";
import { blogCards } from "../Data/content";
import useTapReveal from "../hooks/useTapReveal";

function CardLink({ href, className, style, onClick, children }) {
  if (href?.startsWith("/")) return <Link to={href} className={className} style={style} onClick={onClick}>{children}</Link>;
  return <a href={href} className={className} style={style} onClick={onClick}>{children}</a>;
}

// ── Per-item vertical offset ─────────────────────────────────────────────────
// The four cards flow into a 2×2; the lower pair is nudged down to keep the
// staggered, editorial rhythm of the reference. All share the same image size.
const OFFSETS = ["", "", "md:mt-6", "md:mt-6"];

// ── One scatter item: image + caption (title left / promo text right) ────────
function PortfolioCard({ post, offset }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div className={offset}>
      {/* Image — hover (desktop) or tap (touch) eases the sharp photo inward,
          revealing a blurred, dimmed copy of the same image around its edges
          (a soft framed vignette, not blank space), matching the reference.
          On touch devices the tap only toggles this effect; it doesn't
          navigate — "Read more" below is the actual link on mobile. */}
      <CardLink
        href={post.href}
        onClick={onImageClick}
        className={`spotlight-card group block w-full ${revealed ? "is-revealed" : ""}`}
      >
        <div
          className="relative w-full h-[345px] md:h-[391px] overflow-hidden"
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

      {/* Caption — width-matched to the image above it so both edges align */}
      <div className="mt-4 w-full flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-6">
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
        className="group/more flex items-center gap-1.5 text-sm font-semibold mt-3 w-full"
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
  const posts = blogCards.posts.filter((p) => p.homepage).slice(0, 4);

  return (
    <section
      className="relative py-24 px-6 md:px-12"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="relative max-w-6xl mx-auto">
        {/* Header — heading + rule, matching the reference's editorial masthead */}
        <div className="mb-14 md:mb-16">
          <p className="text-sm font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>
            {blogCards.eyebrow}
          </p>
          <h2 className="home-section-title text-3xl md:text-5xl leading-tight" style={{ color: "#000000" }}>
            {blogCards.heading}
          </h2>
          <p
            className="mt-4 text-sm md:text-base text-right sm:text-left sm:max-w-xs sm:ml-auto"
            style={{ color: "#000000", fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Exclusive offers, special events and more
          </p>
          <div className="mt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.14)" }} />
        </div>

        {/* Staggered editorial scatter — single column on mobile. On desktop the
            grid is sized to exactly two 450px cards plus the gap and centred, so
            the block sits with equal space either side rather than stretching. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-12 md:gap-y-6 items-start md:max-w-[924px] md:mx-auto">
          {posts.map((post, i) => (
            <PortfolioCard key={post.id} post={post} offset={OFFSETS[i]} />
          ))}
        </div>

        {/* See All Stories — after the last card, right-aligned */}
        <div className="mt-8 flex justify-end">
          <CardLink
            href={blogCards.cta.href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-70"
            style={{ color: "#000000" }}
          >
            {blogCards.cta.label}
            <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "#000000" }}>→</span>
          </CardLink>
        </div>
      </div>
    </section>
  );
}

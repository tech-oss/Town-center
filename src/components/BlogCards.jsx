import { Link } from "react-router-dom";
import { blogCards } from "../Data/content";
import { card, pill, btn } from "../utils/design";

function CardLink({ href, className, style, children }) {
  if (href?.startsWith("/")) return <Link to={href} className={className} style={style}>{children}</Link>;
  return <a href={href} className={className} style={style}>{children}</a>;
}

// Tinted badge — uses a muted sage tint so it reads as part of the palette
function Badge({ label }) {
  return (
    <span
      className={pill.className}
      style={{ backgroundColor: "rgba(47,140,140,0.13)", color: "var(--teal-deep, #1e5f5f)" }}
    >
      {label}
    </span>
  );
}

// ── Featured (large) card — full-bleed hero overlay ───────────────────────
function FeaturedCard({ post }) {
  return (
    <CardLink
      href={post.href}
      className="group relative overflow-hidden flex flex-col md:min-h-0 transition-all duration-300 hover:-translate-y-1"
      style={{ borderRadius: card.radius, boxShadow: card.shadow }}
    >
      {/* Image — mobile: own tall box, fully visible, text follows below.
          Desktop: full-bleed overlay behind the text (unchanged). */}
      <div className="relative w-full aspect-[4/3] md:absolute md:inset-0 md:aspect-auto md:h-full overflow-hidden">
        <img
          src={post.imageSrc}
          alt={post.imageAlt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Category badge — top left */}
        <span className="absolute top-4 left-4 z-10">
          <Badge label={post.category} />
        </span>
      </div>

      {/* Text — mobile: normal flow below the image. Desktop: pinned to bottom, overlaid on the image. */}
      <div className="relative z-10 md:mt-auto p-6 flex flex-col gap-2">
        <p className="text-[11px] font-medium" style={{ color: "rgba(0,0,0,0.6)" }}>{post.date}</p>
        <h3
          className="text-2xl leading-snug"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#000" }}
        >
          {post.title}
        </h3>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "rgba(0,0,0,0.78)" }}>
          {post.excerpt}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-1" style={{ color: "var(--sage)" }}>
          Read more
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </CardLink>
  );
}

// ── Compact card ──────────────────────────────────────────────────────────
function CompactCard({ post }) {
  return (
    <CardLink
      href={post.href}
      className="group flex flex-row sm:flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ borderRadius: card.radius, boxShadow: card.shadow, backgroundColor: "rgba(240,250,250,0.72)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.5)" }}
    >
      {/* Image */}
      <div className="relative shrink-0 w-28 sm:w-full overflow-hidden" style={{ aspectRatio: "16/9", borderRadius: `${card.radius} 0 0 ${card.radius}` }} >
        <img
          src={post.imageSrc}
          alt={post.imageAlt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          style={{ borderRadius: "inherit" }}
        />
        <span className="hidden sm:inline-flex absolute top-2.5 left-2.5">
          <Badge label={post.category} />
        </span>
      </div>
      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <span className="sm:hidden"><Badge label={post.category} /></span>
        <p className="text-[10px] font-medium" style={{ color: "var(--ink)", opacity: 0.5 }}>{post.date}</p>
        <h3 className="text-base leading-snug" style={{ color: "var(--forest)", fontFamily: "var(--font-heading)", fontWeight: 700 }}>
          {post.title}
        </h3>
        <p className="text-xs leading-relaxed line-clamp-2 hidden sm:block" style={{ color: "var(--ink)", opacity: 0.7 }}>
          {post.excerpt}
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: "var(--leaf)" }}>
          Read more
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </CardLink>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
export default function BlogCards() {
  const [featured, ...rest] = blogCards.posts;

  return (
    <section
      className="relative py-24 px-6 md:px-12 overflow-hidden"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>
              {blogCards.eyebrow}
            </p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "var(--forest)" }}>
              {blogCards.heading}
            </h2>
          </div>
          {/* Text link — not a button */}
          <CardLink
            href={blogCards.cta.href}
            className={btn.text.className}
            style={{ color: "var(--forest)" }}
          >
            {blogCards.cta.label}
            <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
          </CardLink>
        </div>

        {/* Asymmetric editorial grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
          {/* Large featured card */}
          <FeaturedCard post={featured} />

          {/* Two compact cards stacked */}
          <div className="flex flex-col gap-5">
            {rest.map((post) => (
              <CompactCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { card, pill } from "../utils/design";
import FeaturedTag from "./FeaturedTag";

// The one business listing card, used by every listing on the website and in
// the app so they all show the same things: photo (or logo tile), Featured
// tag, category pill, name, date, address, a one-line description and
// "Read more".

// One colour per See & Do category, reused wherever a category dot is shown.
const CATEGORY_COLORS = {
  "art-culture": "#8b5cf6",
  community: "#f59e0b",
  family: "#ec4899",
  "fashion-beauty": "#e11d48",
  film: "#1c2e38",
  gaming: "#6366f1",
  learning: "#2563eb",
  "sport-wellness": "#22c55e",
};

// Demo brands only have a logo, shown contained on a mint tile. A registered
// business with a hero image shows that photo instead.
const logoTile = (it) => it.logo && !it.hasHero;

const iconProps = { width: 11, height: 11, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: "shrink-0" };

export default function ListingCard({
  item: it,
  to,
  tag = it.tag,
  tagColor = CATEGORY_COLORS[it.category] ?? "var(--leaf)",
  address = it.address,
  description = it.hideDescription ? null : (it.paragraphs?.[0] || it.description || it.tagline),
  radius = "0px",
}) {
  return (
    <Link
      to={to}
      className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
      style={{ borderRadius: radius, boxShadow: card.shadow }}
    >
      <div
        className="relative aspect-[4/3] sm:aspect-square overflow-hidden"
        style={{ borderRadius: `${radius} ${radius} 0 0`, backgroundColor: logoTile(it) ? "var(--mint)" : undefined }}
      >
        {it.featured && <FeaturedTag overlay />}
        {logoTile(it) ? (
          <img src={it.logo} alt={it.name} loading="lazy" className="w-full h-full object-contain p-5 sm:p-8 transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-col gap-1 sm:gap-0.5 p-2.5">
        {tag && (
          <span
            className={`${pill.className} !text-[9px] !px-2 !py-0.5`}
            style={{ color: "#000000", backgroundColor: "#ffffff", boxShadow: "0 1px 4px rgba(13,42,51,0.12)", alignSelf: "flex-start" }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
            {tag}
          </span>
        )}
        <h3 className="listing-card-title text-xs sm:text-sm leading-snug sm:leading-tight line-clamp-2 sm:line-clamp-1" style={{ color: "#000000", fontFamily: "var(--font-heading)" }}>
          {it.name}
        </h3>
        {it.date && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px]" style={{ color: "#000000" }}>
            <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            <span className="line-clamp-1">{it.date}</span>
          </span>
        )}
        {address && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px]" style={{ color: "#000000" }}>
            <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <span className="line-clamp-1">{address}</span>
          </span>
        )}
        {description && (
          <p className="text-[11px] leading-snug line-clamp-1" style={{ color: "#000000" }}>{description}</p>
        )}
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold mt-0.5" style={{ color: "#000000" }}>
          Read more
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

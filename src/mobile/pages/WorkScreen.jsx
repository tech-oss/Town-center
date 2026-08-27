import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { workplaceBuildings } from "../../Data/work";

// While Work itself is still "coming soon", surface the two workplace
// developments already added to the site — One Maidenhead and Trehus —
// linking to their existing detail pages at /work/developments/:slug.
const DEVELOPMENTS = workplaceBuildings.map((b) => ({
  slug: b.slug,
  title: b.name,
  blurb: b.tagline,
  image: b.image,
  to: `/mobile/work/developments/${b.slug}`,
}));

export default function WorkScreen() {
  return (
    <MobileShell title="Work" onBack backFallback="/mobile/explore">
      <div className="flex flex-col items-center text-center gap-5 pt-6 mobile-stagger">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ backgroundColor: "rgba(28,46,56,0.045)", color: "var(--leaf)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--leaf)" }} />
          Coming Soon
        </span>

        <h1 className="text-2xl font-bold leading-tight" style={{ color: "#000000" }}>
          A New Home For Work In Maidenhead
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>
          We're building a home for local jobs, freelance projects and business
          opportunities. It isn't quite ready to launch — but it's on its way.
        </p>

        <div className="w-full text-left mt-2">
          <p className="section-eyebrow mb-3" style={{ color: "var(--teal-deep)" }}>Developments</p>
          <div className="flex flex-col gap-4">
            {DEVELOPMENTS.map((d) => (
              <Link
                key={d.slug}
                to={d.to}
                className="relative overflow-hidden rounded-2xl h-36 flex items-end active:opacity-90"
                style={{ boxShadow: "0 10px 26px -12px rgba(28,46,56,0.45)" }}
              >
                <img src={d.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0) 30%, rgba(12,20,24,0.9) 100%)" }} />
                <div className="relative p-4">
                  <p className="text-base font-bold leading-snug text-white">{d.title}</p>
                  <p className="text-xs mt-0.5 leading-snug font-medium line-clamp-1" style={{ color: "rgba(255,255,255,0.85)" }}>{d.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Link
          to="/mobile/explore"
          className="w-full text-center py-3.5 rounded-2xl text-sm font-bold active:opacity-80 mt-2"
          style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
        >
          Explore Maidenhead Instead
        </Link>
      </div>
    </MobileShell>
  );
}

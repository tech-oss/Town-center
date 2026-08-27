import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { liveStory } from "../../Data/live";

// While Work itself is still "coming soon", surface the two development
// stories that already exist elsewhere on the site — Waterside Quarter (a
// live building on /live/building/:slug) and Nicholson Quarter (the town's
// flagship regeneration story, already mobile-friendly at
// /mobile/explore/the-future) — so the page isn't a dead end.
const DEVELOPMENTS = [
  {
    slug: "waterside-quarter",
    title: "Waterside Quarter",
    blurb: "Waterside living in the heart of the town centre.",
    image: "/images/live/ext-waterside.jpg",
    to: "/live/building/waterside-quarter",
  },
  {
    slug: "nicholson-quarter",
    title: "Nicholson Quarter",
    blurb: liveStory.nicholson.heading,
    image: liveStory.nicholson.image,
    to: "/mobile/explore/the-future",
  },
];

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

import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import useFetch from "../../hooks/useFetch";
import { getStories } from "../../api";
import { heroImage, homeCategories } from "../data/mobileMock";

function CatIcon({ name }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "var(--leaf)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "compass": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-2 6-6 2 2-6z" /></svg>;
    case "cup": return <svg {...p}><path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" /><path d="M16 9h2a2 2 0 0 1 0 4h-2" /><path d="M7 3v2M11 3v2" /></svg>;
    case "bag": return <svg {...p}><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
    case "pin": return <svg {...p}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "services": return <svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
    case "home": return <svg {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>;
    case "tag": return <svg {...p}><path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" /><circle cx="7.5" cy="7.5" r="1" /></svg>;
    case "book": return <svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M9 7h6M9 11h6" /></svg>;
    default: return null;
  }
}

export default function HomeScreen() {
  const { data: stories } = useFetch(getStories, []);
  const featured = stories?.[0];

  return (
    <MobileShell noPadding>
    <div className="flex flex-col gap-6 mobile-stagger" style={{ paddingBottom: 24 }}>
      {/* Hero banner */}
      <div className="relative">
        <img src={heroImage} alt="Maidenhead riverside" className="w-full h-52 object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.25) 0%, rgba(20,33,42,0.05) 55%, #ffffff 100%)" }} />
        <div className="absolute top-3 left-5 right-5 flex items-center justify-between">
          <img src="/logo-mark.svg" alt="" className="h-7 w-auto" />
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.3)" }} aria-label="Notifications">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 -mt-2">
        {/* Featured story chip — real "In the Spotlight" content */}
        {featured && (
          <a href={`/story/${featured.slug}`}>
            <MobileCard className="flex items-center gap-3 p-3 active:opacity-90">
              <img src={featured.cardImage} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{featured.eyebrow}</p>
                <p className="text-sm font-bold leading-snug line-clamp-1" style={{ color: "#000000" }}>{featured.cardHeading}</p>
                <span className="text-xs font-semibold inline-flex items-center gap-1 mt-0.5" style={{ color: "var(--leaf)" }}>
                  Find Out More <span>→</span>
                </span>
              </div>
            </MobileCard>
          </a>
        )}

        {/* Welcome */}
        <div>
          <p className="section-eyebrow mb-1.5" style={{ color: "var(--leaf)" }}>Welcome to</p>
          <h1 className="section-heading text-3xl font-bold mb-3" style={{ color: "#000000" }}>Maidenhead</h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.65)" }}>
            A fast-growing riverside town set on the banks of the Thames, with excellent Elizabeth Line links into central London.
          </p>
        </div>

        {/* Category tiles */}
        <div className="grid grid-cols-4 gap-3">
          {homeCategories.map((c) => (
            <Link key={c.id} to={c.to} className="flex flex-col items-center gap-2 active:opacity-70">
              <div className="w-full aspect-square rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(82,199,182,0.14)" }}>
                <CatIcon name={c.icon} />
              </div>
              <span className="text-[11px] font-semibold text-center" style={{ color: "#000000" }}>{c.label}</span>
            </Link>
          ))}
        </div>

        <Link
          to="/mobile/whats-on"
          className="w-full text-center py-3.5 rounded-2xl text-sm font-bold active:opacity-80"
          style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
        >
          Explore What's On
        </Link>
      </div>
    </div>
    </MobileShell>
  );
}

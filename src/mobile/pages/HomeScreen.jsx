import { Link } from "react-router-dom";
import MobileCard from "../components/MobileCard";
import { featuredSpot, heroImage } from "../data/mobileMock";

export default function HomeScreen() {
  return (
    <div className="flex flex-col gap-6 -mt-6 -mx-5">
      {/* Hero banner */}
      <div className="relative">
        <img src={heroImage} alt="Maidenhead riverside" className="w-full h-48 object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0) 40%, var(--forest) 100%)" }} />
        <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
          <img src="/logo-mark.svg" alt="" className="h-7 w-auto" />
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            aria-label="Notifications"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5">
        {/* Featured location chip */}
        <MobileCard className="flex items-center gap-3 p-3">
          <img src={featuredSpot.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{featuredSpot.eyebrow}</p>
            <p className="text-sm font-bold truncate" style={{ color: "var(--forest)" }}>{featuredSpot.title}</p>
            <Link to={featuredSpot.to} className="text-xs font-semibold inline-flex items-center gap-1 mt-0.5" style={{ color: "var(--leaf)" }}>
              Find Out More <span>→</span>
            </Link>
          </div>
        </MobileCard>

        {/* Welcome */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: "var(--sage)" }}>Welcome to</p>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "#fff" }}>Maidenhead</h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            A fast-growing riverside town set on the banks of the Thames, with excellent Elizabeth Line links into central London.
          </p>
        </div>

        <Link
          to="/mobile/whats-on"
          className="w-full text-center py-3.5 rounded-2xl text-sm font-bold transition-opacity active:opacity-80"
          style={{ backgroundColor: "var(--sage)", color: "var(--forest)" }}
        >
          Explore What's On
        </Link>
      </div>
    </div>
  );
}

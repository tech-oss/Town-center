import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { exploreSections, exploreInfo } from "../data/mobileMock";

function BigCard({ link }) {
  return (
    <Link to={link.to} className="relative rounded-2xl overflow-hidden h-32 flex items-end active:scale-[0.98] transition-transform" style={{ boxShadow: "0 8px 24px -8px rgba(0,0,0,0.4)" }}>
      <img src={link.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0) 30%, rgba(12,20,24,0.9) 100%)" }} />
      <div className="relative p-4">
        <p className="text-base font-bold text-white">{link.title}</p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>{link.blurb}</p>
      </div>
    </Link>
  );
}

export default function ExploreScreen() {
  return (
    <MobileShell>
      <div className="flex flex-col gap-5 mobile-stagger">
        <div>
          <h1 className="text-2xl font-bold mb-1.5" style={{ color: "#fff" }}>Explore</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>Discover more about Maidenhead and plan your visit.</p>
        </div>

        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--sage)" }}>Discover</p>
        <div className="flex flex-col gap-4">
          {exploreSections.map((l) => <BigCard key={l.id} link={l} />)}
        </div>

        <p className="text-xs font-bold uppercase tracking-wide mt-1" style={{ color: "var(--sage)" }}>Plan</p>
        <div className="flex flex-col gap-4">
          {exploreInfo.map((l) => <BigCard key={l.id} link={l} />)}
        </div>
      </div>
    </MobileShell>
  );
}

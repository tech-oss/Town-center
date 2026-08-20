import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { guides } from "../../Data/guides";

export default function GuidesScreen() {
  return (
    <MobileShell title="Neighbourhood Guides" onBack>
      <div className="flex flex-col gap-4 mobile-stagger">
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>
          Curated guides to eating, drinking and spending time in Maidenhead.
        </p>

        <div className="flex flex-col gap-3">
          {guides.map((g) => (
            <Link key={g.slug} to={`/mobile/guides/${g.slug}`}>
              <MobileCard className="flex items-stretch overflow-hidden active:opacity-90">
                <img src={g.cardImage} alt="" className="w-24 h-24 object-cover shrink-0" />
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{g.category}</span>
                  <p className="text-sm font-bold leading-snug mt-0.5" style={{ color: "#000000" }}>{g.title}</p>
                  <p className="text-xs mt-1 leading-snug line-clamp-2" style={{ color: "rgba(0,0,0,0.6)" }}>{g.summary}</p>
                </div>
              </MobileCard>
            </Link>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}

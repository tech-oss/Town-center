import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import useFetch from "../../hooks/useFetch";
import { getHotels, getAccommodations } from "../../api";

export default function LiveScreen() {
  const { data: hotels } = useFetch(getHotels, []);
  const { data: accommodations } = useFetch(getAccommodations, []);

  const places = [
    ...(hotels ?? []).map((s) => ({ ...s, kind: "Hotel", stayKind: "hotels" })),
    ...(accommodations ?? []).map((s) => ({ ...s, kind: s.type, stayKind: "accommodation" })),
  ];

  return (
    <MobileShell title="Live & Stay" onBack>
      <div className="flex flex-col gap-4 mobile-stagger">
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>
          Hotels and accommodation in and around Maidenhead.
        </p>

        <div className="flex flex-col gap-3">
          {places.map((p) => (
            <Link key={p.slug} to={`/mobile/stay/${p.stayKind}/${p.slug}`}>
              <MobileCard className="flex items-stretch overflow-hidden active:opacity-90">
                <img src={p.image} alt="" className="w-24 h-24 object-cover shrink-0" />
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{p.kind}</span>
                  <p className="text-sm font-bold leading-snug mt-0.5" style={{ color: "#000000" }}>{p.name}</p>
                  <p className="text-xs mt-1 leading-snug line-clamp-2" style={{ color: "rgba(0,0,0,0.6)" }}>{p.tagline}</p>
                </div>
              </MobileCard>
            </Link>
          ))}
          {places.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "rgba(0,0,0,0.45)" }}>Loading places to stay…</p>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

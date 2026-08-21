import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import useFetch from "../../hooks/useFetch";
import { getArticles } from "../../api";

export default function OffersScreen() {
  const { data: articles } = useFetch(getArticles, []);

  return (
    <MobileShell title="Offers & News" onBack>
      <div className="flex flex-col gap-4 mobile-stagger">
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>
          The latest offers, news and updates from businesses around Maidenhead.
        </p>

        <div className="flex flex-col gap-3">
          {(articles ?? []).slice(0, 20).map((a) => (
            <Link key={a.slug} to={`/mobile/news/${a.slug}`}>
              <MobileCard className="flex items-stretch overflow-hidden active:opacity-90">
                <img src={a.image} alt="" className="w-24 h-24 object-cover shrink-0" />
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{a.category} · {a.business?.name}</span>
                  <p className="text-sm font-bold leading-snug mt-0.5 line-clamp-2" style={{ color: "#000000" }}>{a.title}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(0,0,0,0.55)" }}>{a.date}</p>
                </div>
              </MobileCard>
            </Link>
          ))}
          {articles === null && (
            <p className="text-sm text-center py-8" style={{ color: "rgba(0,0,0,0.45)" }}>Loading offers…</p>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

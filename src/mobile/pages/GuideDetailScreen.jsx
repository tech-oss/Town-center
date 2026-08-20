import { useParams, Navigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { getGuideBySlug } from "../../Data/guides";

export default function GuideDetailScreen() {
  const { slug } = useParams();
  const guide = getGuideBySlug(slug);

  if (!guide) return <Navigate to="/mobile/guides" replace />;

  return (
    <MobileShell noPadding>
      <div className="flex flex-col">
        <div className="relative">
          <img src={guide.heroImage} alt="" className="w-full h-48 object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.3) 0%, rgba(20,33,42,0.05) 45%, #ffffff 100%)" }} />
          <button onClick={() => window.history.back()} className="absolute top-3 left-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        </div>

        <div className="px-5 pt-2 flex flex-col gap-4 pb-8 mobile-stagger">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{guide.category}</span>
            <h1 className="text-xl font-bold mt-1 leading-snug" style={{ color: "#000000" }}>{guide.title}</h1>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.72)" }}>{guide.intro[0]}</p>

          <div className="flex flex-col gap-3">
            {guide.sections.slice(0, 4).map((s) => (
              <MobileCard key={s.id} className="flex items-center gap-3 p-3">
                <img src={s.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{s.eyebrow}</p>
                  <p className="text-sm font-bold leading-snug" style={{ color: "#000000" }}>{s.title}</p>
                </div>
              </MobileCard>
            ))}
          </div>

          <a
            href={`/guides/${guide.slug}`}
            className="w-full text-center py-3.5 rounded-2xl text-sm font-bold active:opacity-80"
            style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
          >
            Read the Full Guide
          </a>
        </div>
      </div>
    </MobileShell>
  );
}

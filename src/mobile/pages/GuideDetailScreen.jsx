import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { getGuideBySlug } from "../../Data/guides";
import useMobileBack from "../hooks/useMobileBack";

export default function GuideDetailScreen() {
  const { slug } = useParams();
  const guide = getGuideBySlug(slug);
  const [toast, setToast] = useState(false);

  const goBack = useMobileBack("/mobile/guides");
  if (!guide) return <Navigate to="/mobile/guides" replace />;

  async function handleShare() {
    const url = `${window.location.origin}/guides/${guide.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: guide.title, text: guide.summary, url });
      } catch {
        /* user cancelled — no-op */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast(true);
      setTimeout(() => setToast(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <MobileShell noPadding>
      <div className="flex flex-col">
        <div className="relative">
          <img src={guide.heroImage} alt="" className="w-full h-48 object-cover" />
          <button onClick={goBack} className="absolute top-3 left-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button onClick={handleShare} className="absolute top-3 right-4 w-9 h-9 rounded-full flex items-center justify-center active:opacity-80" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} aria-label="Share this guide">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" />
            </svg>
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

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ bottom: 88, backgroundColor: "rgba(15,26,32,0.95)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>
          Link copied to clipboard
        </div>
      )}
    </MobileShell>
  );
}

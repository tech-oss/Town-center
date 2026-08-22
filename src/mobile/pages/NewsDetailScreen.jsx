import { useParams, Navigate, Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import useFetch from "../../hooks/useFetch";
import { getArticleBySlug } from "../../api";
import useMobileBack from "../hooks/useMobileBack";

export default function NewsDetailScreen() {
  const { slug } = useParams();
  const { data: article, loading } = useFetch(() => getArticleBySlug(slug), [slug]);

  const goBack = useMobileBack("/mobile/offers");
  if (!loading && !article) return <Navigate to="/mobile/offers" replace />;
  if (loading || !article) return null;

  const biz = article.business;
  const more = (biz?.news ?? []).filter((a) => a.slug !== article.slug).slice(0, 3);
  const bizLink = biz?.section && biz?.slug ? `/mobile/place/${biz.slug}` : null;

  return (
    <MobileShell noPadding onBack={goBack}>
      <div className="flex flex-col">
        <div className="relative">
          <img src={article.image} alt={article.title} className="w-full h-56 object-cover" />
        </div>

        <div className="px-5 -mt-2 relative flex flex-col gap-5 pb-8 mobile-stagger">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(28,46,56,0.06)", color: "#000000" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--leaf)" }} />
                {article.category}
              </span>
              {article.date && <span className="text-xs" style={{ color: "#000000" }}>{article.date}</span>}
            </div>
            <h1 className="text-xl font-bold leading-snug" style={{ color: "#000000" }}>{article.title}</h1>
            {biz && (
              <p className="text-sm mt-1.5" style={{ color: "#000000" }}>
                At {bizLink ? <Link to={bizLink} className="font-semibold" style={{ color: "var(--leaf)" }}>{biz.name}</Link> : biz.name} · {biz.tag}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {article.body?.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{p}</p>
            ))}
          </div>

          {biz && bizLink && (
            <Link to={bizLink} className="flex items-center gap-3 p-3 bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
              <img src={biz.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{biz.tag}</p>
                <p className="text-sm font-bold leading-snug" style={{ color: "#000000" }}>{biz.name}</p>
                {biz.address && <p className="text-xs truncate" style={{ color: "#000000" }}>{biz.address}</p>}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </Link>
          )}

          {more.length > 0 && (
            <div className="mt-2">
              <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>More from {biz?.name}</p>
              <div className="flex flex-col gap-3">
                {more.map((a) => (
                  <Link key={a.slug} to={`/mobile/news/${a.slug}`} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                    <img src={a.image} alt="" className="w-20 h-20 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{a.category}</span>
                      <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{a.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

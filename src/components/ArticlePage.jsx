import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { sections } from "../Data/pages";
import { getArticleBySlug } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";

export default function ArticlePage() {
  const { articleSlug } = useParams();
  const { data: article, loading, error } = useFetch(() => getArticleBySlug(articleSlug), [articleSlug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [articleSlug]);

  if (loading) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  if (!article) return <Navigate to="/" replace />;

  const biz = article.business;
  const sec = sections[biz.section];
  const bizPath = `/${biz.section}/place/${biz.slug}`;

  // Other articles from the same business
  const more = (biz.news ?? []).filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* ── Cover ── */}
      <section className="px-6 md:px-12 pt-6 md:pt-10">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-5 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to={sec.path} className="hover:opacity-70 transition-opacity">{sec.label}</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to={bizPath} className="hover:opacity-70 transition-opacity">{biz.name}</Link>
          </nav>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full" style={{ backgroundColor: "var(--mint)", color: "var(--forest)" }}>
              {article.category}
            </span>
            <span className="text-sm" style={{ color: "var(--ink)", opacity: 0.55 }}>{article.date}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-2" style={{ color: "var(--forest)" }}>
            {article.title}
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--ink)", opacity: 0.6 }}>
            At <Link to={bizPath} className="font-semibold underline-offset-2 hover:underline" style={{ color: "var(--leaf)" }}>{biz.name}</Link> · {biz.tag}
          </p>

          {/* Cover image */}
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-black shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <article className="flex flex-col gap-5">
            {article.body.map((para, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.85 }}>
                {para}
              </p>
            ))}
          </article>

          {/* Back-to-business CTA */}
          <div className="mt-10 rounded-3xl p-7 flex flex-col sm:flex-row sm:items-center gap-5 sm:justify-between" style={{ backgroundColor: "#fff", boxShadow: "0 10px 40px -22px rgba(28,46,56,0.3)" }}>
            <div className="flex items-center gap-4 min-w-0">
              <img src={biz.image} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>{biz.tag}</p>
                <p className="font-bold text-lg leading-tight" style={{ color: "var(--forest)" }}>{biz.name}</p>
                <p className="text-sm truncate" style={{ color: "var(--ink)", opacity: 0.6 }}>{biz.address}</p>
              </div>
            </div>
            <Link
              to={bizPath}
              className="shrink-0 text-center px-6 py-3 rounded-full font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--leaf)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
            >
              View {biz.name}
            </Link>
          </div>
        </div>
      </section>

      {/* ── More from this business ── */}
      {more.length > 0 && (
        <section className="pb-20 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>More from {biz.name}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {more.map((a) => (
                <Link
                  key={a.slug}
                  to={`/news/${a.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={a.image} alt={a.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "var(--leaf)" }}>
                      {a.category}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 p-5">
                    <span className="text-[11px]" style={{ color: "var(--ink)", opacity: 0.5 }}>{a.date}</span>
                    <h3 className="font-bold text-base leading-snug" style={{ color: "var(--forest)" }}>{a.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

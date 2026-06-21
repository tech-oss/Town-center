import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { getStoryBySlug, getStories } from "../api";
import useFetch from "../hooks/useFetch";
import Loading from "./ui/Loading";
import ErrorState from "./ui/ErrorState";

// Renders a body block's text (heading + paragraphs + optional bullets).
function BlockText({ block }) {
  return (
    <div className="flex flex-col gap-4">
      {block.heading && (
        <h2 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: "var(--forest)" }}>
          {block.heading}
        </h2>
      )}
      {block.paras?.map((p, pi) => (
        <p key={pi} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.85 }}>{p}</p>
      ))}
      {block.bullets && (
        <ul className="flex flex-col gap-2 pl-1">
          {block.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.85 }}>
              <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--leaf)" }} />
              {b}
            </li>
          ))}
        </ul>
      )}
      {block.parasAfter?.map((p, pi) => (
        <p key={pi} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.85 }}>{p}</p>
      ))}
    </div>
  );
}

export default function FeatureArticlePage() {
  const { slug } = useParams();
  const { data: story, loading, error } = useFetch(() => getStoryBySlug(slug), [slug]);
  const { data: stories, loading: loadingList } = useFetch(getStories, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading || loadingList) return <Loading minHeight="70vh" />;
  if (error) return <ErrorState minHeight="70vh" />;
  if (!story) return <Navigate to="/" replace />;

  const more = stories.filter((f) => f.slug !== story.slug);
  const websiteUrl = `https://${story.website.replace(/^https?:\/\//, "")}`;

  // Weave gallery images through the body: pair each image with a substantial
  // section (skip the short intro block), alternating image left/right.
  const imageForBlock = {};
  const gallery = story.gallery ?? [];
  const startIdx = story.body[0]?.heading ? 0 : 1; // skip headless intro block
  const candidates = story.body
    .map((b, i) => i)
    .filter((i) => i >= startIdx);
  if (candidates.length > 0) {
    gallery.forEach((src, gi) => {
      // spread images evenly across the eligible blocks
      const pos = Math.floor(((gi + 0.5) / gallery.length) * candidates.length);
      const blockIdx = candidates[Math.min(pos, candidates.length - 1)];
      imageForBlock[blockIdx] = { src, side: gi % 2 === 0 ? "right" : "left" };
    });
  }

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* ── Cover ── */}
      <section className="px-6 md:px-12 pt-6 md:pt-10">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-5 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to="/news" className="hover:opacity-70 transition-opacity">Journal</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>{story.eyebrow}</span>
          </nav>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full" style={{ backgroundColor: "var(--mint)", color: "var(--forest)" }}>
              {story.category}
            </span>
            <span className="text-sm" style={{ color: "var(--ink)", opacity: 0.55 }}>{story.date}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4" style={{ color: "var(--forest)" }}>
            {story.title}
          </h1>

          {/* Cover image */}
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-black shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
            <img src={story.heroImage} alt={story.title} className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Standfirst */}
          <p className="max-w-3xl mx-auto text-lg md:text-2xl leading-relaxed mb-14 font-medium text-center" style={{ color: "var(--forest)" }}>
            {story.standfirst}
          </p>

          <article className="flex flex-col gap-12 md:gap-16">
            {story.body.map((block, i) => {
              const img = imageForBlock[i];
              if (img) {
                const imageRight = img.side === "right";
                return (
                  <div key={i} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className={imageRight ? "md:order-2" : ""}>
                      <div className="rounded-3xl overflow-hidden bg-black h-72 md:h-full md:min-h-[24rem] shadow-[0_24px_60px_-30px_rgba(28,46,56,0.55)]">
                        <img src={img.src} alt={block.heading || story.title} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <BlockText block={block} />
                  </div>
                );
              }
              return (
                <div key={i} className="max-w-3xl mx-auto w-full">
                  <BlockText block={block} />
                </div>
              );
            })}
          </article>

          {/* CTA */}
          <div className="mt-16 rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6" style={{ backgroundColor: "var(--forest)", color: "white" }}>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--sage)" }}>{story.eyebrow}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--mint)" }}>{story.location}</p>
            </div>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-7 py-3.5 rounded-full font-semibold text-sm transition-colors"
              style={{ backgroundColor: "var(--leaf)", color: "white" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
            >
              Visit official website →
            </a>
          </div>
        </div>
      </section>

      {/* ── More stories ── */}
      {more.length > 0 && (
        <section className="pb-20 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>More stories</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {more.map((f) => (
                <Link
                  key={f.slug}
                  to={`/story/${f.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img src={f.cardImage} alt={f.cardHeading} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "var(--leaf)" }}>
                      {f.eyebrow}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 p-5">
                    <h3 className="font-bold text-base leading-snug" style={{ color: "var(--forest)" }}>{f.cardHeading}</h3>
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

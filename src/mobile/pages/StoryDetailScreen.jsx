import { useParams, Navigate, Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import useFetch from "../../hooks/useFetch";
import { getStoryBySlug, getStories } from "../../api";
import useMobileBack from "../hooks/useMobileBack";
import ShareButton from "../components/ShareButton";
import { typeColor } from "../lib/typeColors";

function BlockText({ block }) {
  return (
    <div className="flex flex-col gap-3">
      {block.heading && (
        <h2 className="section-heading text-lg font-bold leading-snug" style={{ color: "#000000" }}>{block.heading}</h2>
      )}
      {block.paras?.map((p, pi) => (
        <p key={pi} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{p}</p>
      ))}
      {block.bullets && (
        <ul className="flex flex-col gap-2">
          {block.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "#000000" }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--leaf)" }} />
              {b}
            </li>
          ))}
        </ul>
      )}
      {block.parasAfter?.map((p, pi) => (
        <p key={pi} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{p}</p>
      ))}
    </div>
  );
}

export default function StoryDetailScreen() {
  const { slug } = useParams();
  const { data: story, loading } = useFetch(() => getStoryBySlug(slug), [slug]);
  const { data: stories } = useFetch(getStories, []);

  const goBack = useMobileBack("/mobile/offers");
  if (!loading && !story) return <Navigate to="/mobile/home" replace />;
  if (loading || !story) return null;

  const more = (stories ?? []).filter((f) => f.slug !== story.slug).slice(0, 3);
  const websiteUrl = story.website ? `https://${story.website.replace(/^https?:\/\//, "")}` : null;
  const titleSplit = story.title.split(/:\s+/);
  const heroTitle = titleSplit[0];
  const heroSubtitle = titleSplit.length > 1 ? titleSplit.slice(1).join(": ") : null;

  return (
    <MobileShell noPadding onBack={goBack}>
      <div className="flex flex-col">
        <div className="relative">
          <img src={story.heroImage} alt={story.title} className="w-full h-56 object-cover" />
        </div>

        <div className="px-5 pt-4 relative flex flex-col gap-5 pb-8 mobile-stagger">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: typeColor(story.category) }}>{story.category}</span>
                <h1 className="text-xl font-bold mt-1 leading-snug" style={{ color: "#000000" }}>{heroTitle}</h1>
                {heroSubtitle && <p className="text-xs uppercase tracking-wide mt-1" style={{ color: "#000000" }}>{heroSubtitle}</p>}
                {story.date && <p className="text-xs mt-2" style={{ color: "#000000" }}>{story.date}</p>}
              </div>
              <ShareButton path={`/story/${story.slug}`} title={story.title} text={story.standfirst} className="mt-0.5" />
            </div>

            {story.standfirst && (
              <p className="text-base font-medium leading-relaxed" style={{ color: "#000000" }}>{story.standfirst}</p>
            )}

            <div className="flex flex-col gap-6">
              {story.body?.map((block, i) => <BlockText key={i} block={block} />)}
            </div>

            {story.gallery?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {story.gallery.slice(0, 4).map((src, i) => (
                  <img key={i} src={src} alt="" className="w-full aspect-square object-cover rounded-xl" />
                ))}
              </div>
            )}

            {websiteUrl && (
              <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ backgroundColor: "var(--forest)" }}>
                {story.location && <p className="text-sm" style={{ color: "var(--mint)" }}>{story.location}</p>}
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center py-3 rounded-full text-sm font-bold active:opacity-80"
                  style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
                >
                  Visit Official Website
                </a>
              </div>
            )}

            {more.length > 0 && (
              <div className="mt-2">
                <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>More Stories</p>
                <div className="flex flex-col gap-3">
                  {more.map((f) => (
                    <Link key={f.slug} to={`/mobile/story/${f.slug}`} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                      <img src={f.cardImage} alt="" className="w-20 h-20 object-cover shrink-0" />
                      <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: typeColor("Featured") }}>{f.eyebrow}</span>
                        <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{f.cardHeading}</p>
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

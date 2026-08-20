import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import useTapReveal from "../../hooks/useTapReveal";
import useFetch from "../../hooks/useFetch";
import { getStories, getEvents } from "../../api";
import { hero, blogCards } from "../../Data/content";
import { categoryColors } from "../../Data/events";
import { homeCategories } from "../data/mobileMock";

const slide = hero.slides[0];

function CatIcon({ name }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "var(--leaf)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "compass": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-2 6-6 2 2-6z" /></svg>;
    case "cup": return <svg {...p}><path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" /><path d="M16 9h2a2 2 0 0 1 0 4h-2" /><path d="M7 3v2M11 3v2" /></svg>;
    case "bag": return <svg {...p}><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
    case "pin": return <svg {...p}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case "services": return <svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
    case "home": return <svg {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>;
    case "tag": return <svg {...p}><path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" /><circle cx="7.5" cy="7.5" r="1" /></svg>;
    case "book": return <svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M9 7h6M9 11h6" /></svg>;
    default: return null;
  }
}

// Same framed-photo tap-reveal used throughout the desktop site.
function SpotlightImage({ src, alt, className = "" }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div onClick={onImageClick} className={`spotlight-card relative overflow-hidden ${revealed ? "is-revealed" : ""} ${className}`}>
      <img src={src} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
      <img src={src} alt={alt} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

export default function HomeScreen() {
  const videoRef = useRef(null);
  const { data: stories } = useFetch(getStories, []);
  const { data: events } = useFetch(getEvents, []);
  const spotlightPosts = blogCards.posts.filter((p) => p.homepage).slice(0, 4);
  const upcomingEvents = (events ?? []).slice(0, 3);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    const play = () => v.play().catch(() => {});
    play();
    v.addEventListener("canplay", play, { once: true });
  }, []);

  return (
    <MobileShell noPadding>
      <div className="flex flex-col gap-9 mobile-stagger" style={{ paddingBottom: 32 }}>
        {/* ── Hero — same looping video as the website's mobile cut ── */}
        <div className="relative h-72 overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/hero-mobile.mp4"
            poster="/images/hero-poster-mobile.jpg"
            muted
            loop
            playsInline
            autoPlay
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0.35) 0%, rgba(12,20,24,0.15) 45%, #ffffff 100%)" }} />
          <div className="absolute top-3 left-5 right-5 flex items-center justify-between">
            <img src="/logo-mark.svg" alt="" className="h-7 w-auto" />
            <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.3)" }} aria-label="Notifications">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </div>
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 text-white/85">{slide.eyebrow}</p>
            <h1 className="text-3xl font-bold leading-tight text-white" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.35)" }}>{slide.headline}</h1>
          </div>
        </div>

        <div className="flex flex-col gap-9 px-5">
          {/* ── Category tiles (QuickLinks equivalent) ── */}
          <div>
            <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>Find Your Way Around</p>
            <div className="grid grid-cols-4 gap-3">
              {homeCategories.map((c) => (
                <Link key={c.id} to={c.to} className="flex flex-col items-center gap-2 active:opacity-70">
                  <div className="w-full aspect-square rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(28,46,56,0.045)" }}>
                    <CatIcon name={c.icon} />
                  </div>
                  <span className="text-[11px] font-semibold text-center" style={{ color: "#000000" }}>{c.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Featured Stories ── */}
          {stories?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="section-eyebrow" style={{ color: "var(--leaf)" }}>Featured Stories</p>
                <Link to="/mobile/offers" className="text-xs font-semibold" style={{ color: "var(--leaf)" }}>See all</Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-5 px-5">
                {stories.slice(0, 6).map((s) => (
                  <a key={s.slug} href={`/story/${s.slug}`} className="shrink-0 w-48 flex flex-col gap-2">
                    <SpotlightImage src={s.cardImage} alt={s.cardHeading} className="w-48 h-36" />
                    <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{s.cardHeading}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── In the Spotlight ── */}
          {spotlightPosts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="section-eyebrow" style={{ color: "var(--leaf)" }}>{blogCards.eyebrow}</p>
                <Link to="/mobile/offers" className="text-xs font-semibold" style={{ color: "var(--leaf)" }}>See all</Link>
              </div>
              <h2 className="section-heading text-xl font-bold mb-3" style={{ color: "#000000" }}>In The Spotlight</h2>
              <div className="flex flex-col gap-3">
                {spotlightPosts.map((post) => (
                  <a key={post.id} href={post.href} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                    <img src={post.imageSrc} alt="" className="w-24 h-24 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{post.category}</span>
                      <p className="text-sm font-bold leading-snug mt-0.5 line-clamp-2" style={{ color: "#000000" }}>{post.title}</p>
                      <p className="text-xs mt-1" style={{ color: "rgba(0,0,0,0.55)" }}>{post.date}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── What's On teaser ── */}
          {upcomingEvents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="section-eyebrow" style={{ color: "var(--leaf)" }}>What's On</p>
                <Link to="/mobile/whats-on" className="text-xs font-semibold" style={{ color: "var(--leaf)" }}>See all</Link>
              </div>
              <div className="flex flex-col gap-3">
                {upcomingEvents.map((e) => (
                  <a key={e.slug} href={`/event/${e.slug}`} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                    <img src={e.image} alt="" className="w-20 h-20 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wide w-fit px-2 py-0.5 rounded-full mb-1"
                        style={{ backgroundColor: `${categoryColors[e.category]}1A`, color: categoryColors[e.category] }}
                      >
                        {e.category}
                      </span>
                      <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{e.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(0,0,0,0.55)" }}>{e.date}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <Link
            to="/mobile/whats-on"
            className="w-full text-center py-3.5 rounded-2xl text-sm font-bold active:opacity-80"
            style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
          >
            Explore What's On
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}

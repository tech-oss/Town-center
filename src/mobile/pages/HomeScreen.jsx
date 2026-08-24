import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import NotificationTray, { NOTIFICATIONS } from "../components/NotificationTray";
import useTapReveal from "../../hooks/useTapReveal";
import useFetch from "../../hooks/useFetch";
import { getEvents, getStories } from "../../api";
import { blogCards } from "../../Data/content";
import { categoryColors } from "../../Data/events";
import { guides } from "../../Data/guides";
import { homeCategories } from "../data/mobileMock";

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

// Small corner badge marking a card as an Offer — same tag glyph as the
// bottom nav's Offers tab, so the icon language stays consistent app-wide.
function OfferTag() {
  return (
    <span
      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: "var(--teal-deep)", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
      aria-label="Offer"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" />
        <circle cx="7.5" cy="7.5" r="1.2" fill="#fff" />
      </svg>
    </span>
  );
}

function SectionHead({ eyebrow, to, linkLabel = "See all" }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <p className="section-eyebrow" style={{ color: "var(--teal-deep)" }}>{eyebrow}</p>
      {to && (
        <Link to={to} className="text-xs font-bold" style={{ color: "var(--teal-deep)" }}>{linkLabel}</Link>
      )}
    </div>
  );
}

export default function HomeScreen() {
  const videoRef = useRef(null);
  const { data: events } = useFetch(getEvents, []);
  const { data: stories } = useFetch(getStories, []);
  const appOffers = blogCards.posts.filter((p) => p.homepage).slice(0, 4);
  const upcomingEvents = (events ?? []).slice(0, 3);
  const featuredGuides = guides.slice(0, 3);
  const featuredStories = (stories ?? []).filter((s) => s.homepage);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;
  const [videoPlaying, setVideoPlaying] = useState(true);
  const stallTimer = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVideoPlaying(false);
      return;
    }
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    const play = () => v.play().catch(() => {});
    play();
    v.addEventListener("canplay", play, { once: true });

    // If playback stalls (buffering hang, decode error, connection drop)
    // for more than a couple of seconds, stop treating it as "playing" —
    // pause for real and surface the play button so the user has an
    // obvious way to retry instead of staring at a frozen frame.
    const armStallTimer = () => {
      clearTimeout(stallTimer.current);
      stallTimer.current = setTimeout(() => {
        v.pause();
        setVideoPlaying(false);
      }, 2500);
    };
    const clearStallTimer = () => clearTimeout(stallTimer.current);

    v.addEventListener("waiting", armStallTimer);
    v.addEventListener("stalled", armStallTimer);
    v.addEventListener("error", () => { clearStallTimer(); setVideoPlaying(false); });
    v.addEventListener("playing", () => { clearStallTimer(); setVideoPlaying(true); });
    v.addEventListener("pause", () => setVideoPlaying(false));

    return () => {
      clearStallTimer();
      v.removeEventListener("canplay", play);
      v.removeEventListener("waiting", armStallTimer);
      v.removeEventListener("stalled", armStallTimer);
    };
  }, []);

  function toggleVideo() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setVideoPlaying(true);
    } else {
      v.pause();
      setVideoPlaying(false);
    }
  }

  return (
    <MobileShell hideHeader noPadding>
      <div className="flex flex-col gap-8 mobile-stagger" style={{ paddingBottom: 32 }}>
        {/* ── Hero — same looping video as the website's mobile cut, kept
            compact so the content below starts high on the screen. ── */}
        <div className="relative h-56 overflow-hidden">
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
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0.45) 0%, rgba(12,20,24,0.05) 40%, rgba(12,20,24,0.15) 65%, rgba(12,20,24,0.7) 100%)" }} />

          {/* Plays by default; if playback stalls it pauses itself and this
              button flips to "play" so the user has something to tap
              instead of a frozen frame. Also doubles as a manual toggle. */}
          <button
            type="button"
            onClick={toggleVideo}
            aria-label={videoPlaying ? "Pause background video" : "Play background video"}
            className="absolute top-1/2 right-6 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center active:opacity-80"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          >
            {videoPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5.5v13l11-6.5-11-6.5z" /></svg>
            )}
          </button>
          <div className="absolute top-3 left-5 right-3 flex items-center justify-between">
            <img src="/logo-mark.svg" alt="" className="h-7 w-auto" />
            <div className="flex items-center gap-2">
              <Link
                to="/mobile/search"
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
                aria-label="Search"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white"
                    style={{ backgroundColor: "var(--leaf)", border: "2px solid rgba(0,0,0,0.42)" }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            {/* Same "Welcome to / MAIDENHEAD / Riverside · Connected ·
                Thriving" caption the website's Hero.jsx renders — that
                component doesn't use Data/content.js's hero.slides text at
                all, so mirroring the slide's eyebrow/headline here was
                showing different copy than the site actually displays. */}
            <p className="text-xs font-medium mb-1 text-white" style={{ letterSpacing: "-0.01em", textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}>Welcome to</p>
            <h1
              className="hero-title uppercase leading-none text-white"
              style={{
                // Fluid instead of a fixed text-4xl: on the narrowest phones
                // — or with a browser/accessibility text-size boost — a flat
                // 36px plus this face's letter-spacing pushed "MAIDENHEAD"
                // past the right edge of the hero. Scaling with viewport
                // width keeps it inside the same left-5/right-5 padding on
                // every screen instead of only the ones this got tested on.
                fontSize: "clamp(1.65rem, 9.5vw, 2.25rem)",
                letterSpacing: "0.03em",
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              Maidenhead
            </h1>
            <p className="text-xs font-medium uppercase mt-2 text-white" style={{ letterSpacing: "-0.01em", textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}>Riverside · Connected · Thriving</p>
          </div>
        </div>

        <div className="flex flex-col gap-8 px-5">
          {/* ── Quick Links ── */}
          <div>
            <p className="section-eyebrow mb-3" style={{ color: "var(--teal-deep)" }}>Quick Links</p>
            <div className="grid grid-cols-4 gap-3">
              {homeCategories.map((c) => (
                <Link key={c.id} to={c.to} className="flex flex-col items-center gap-2 active:opacity-70">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
                    <img src={c.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    {/* Bottom-weighted tint so a light photo still reads as a
                        crisp tile, matching the tab bar's dark-teal accent. */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0) 45%, rgba(12,20,24,0.35) 100%)" }} />
                  </div>
                  <span className="text-[11px] font-bold text-center leading-tight" style={{ color: "#000000" }}>{c.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Offers & Promotions — the homepage's headline CTA. ── */}
          <Link
            to="/mobile/offers"
            className="relative overflow-hidden rounded-2xl px-5 py-5 flex items-center gap-4 active:opacity-90"
            style={{ backgroundColor: "var(--teal-deep)" }}
          >
            {/* Decorative tag motif, echoing the reference apps' offers banner. */}
            <svg className="absolute -right-4 -top-3 opacity-[0.13]" width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.4" aria-hidden="true">
              <path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" />
              <circle cx="7.5" cy="7.5" r="1.2" />
            </svg>
            <div className="relative flex-1 min-w-0">
              <p className="text-lg font-bold leading-tight text-white">Looking for Offers &amp; Promotions?</p>
              <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                See what's on offer across the town centre right now.
              </p>
            </div>
            <span
              className="relative shrink-0 px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide"
              style={{ backgroundColor: "#ffffff", color: "var(--forest)" }}
            >
              SEE ALL
            </span>
          </Link>

          {/* ── App Offers & News ── */}
          {appOffers.length > 0 && (
            <div>
              <SectionHead eyebrow="App Offers & News" to="/mobile/offers" />
              <div className="flex flex-col gap-3">
                {appOffers.map((post) => (
                  <Link key={post.id} to={`/mobile${post.href}`} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 10px 26px -12px rgba(28,46,56,0.45)" }}>
                    <div className="relative w-28 h-28 shrink-0">
                      <img src={post.imageSrc} alt="" className="w-full h-full object-cover" />
                      {post.category?.includes("Offer") && <OfferTag />}
                    </div>
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--teal-deep)" }}>{post.category}</span>
                      <p className="text-sm font-bold leading-snug mt-0.5 line-clamp-2" style={{ color: "#000000" }}>{post.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-medium" style={{ color: "#000000" }}>{post.date}</p>
                        <span className="inline-flex items-center gap-0.5 shrink-0 text-[10px] font-bold" style={{ color: "var(--leaf)" }}>
                          Read more
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── What's On ── */}
          {upcomingEvents.length > 0 && (
            <div>
              <SectionHead eyebrow="What's On" to="/mobile/whats-on" />
              <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-5 px-5">
                {upcomingEvents.map((e) => (
                  <Link key={e.slug} to={`/mobile/event/${e.slug}`} className="shrink-0 w-56 flex flex-col overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 10px 26px -12px rgba(28,46,56,0.45)" }}>
                    <img src={e.image} alt="" className="w-full h-36 object-cover" />
                    <div className="p-3 flex flex-col gap-1">
                      <span
                        className="text-[9px] font-extrabold uppercase tracking-wide w-fit px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: categoryColors[e.category], color: "#ffffff" }}
                      >
                        {e.category}
                      </span>
                      <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{e.title}</p>
                      <p className="text-xs font-medium truncate" style={{ color: "#000000" }}>{e.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Neighbourhood Guides — three guides to tap straight into. ── */}
          {featuredGuides.length > 0 && (
            <div>
              <SectionHead eyebrow="Neighbourhood Guides" to="/mobile/guides" />
              <div className="flex flex-col gap-3">
                {featuredGuides.map((g) => (
                  <Link
                    key={g.slug}
                    to={`/mobile/guides/${g.slug}`}
                    className="relative overflow-hidden rounded-2xl h-36 flex items-end active:opacity-90"
                    style={{ boxShadow: "0 10px 26px -12px rgba(28,46,56,0.5)" }}
                  >
                    <img src={g.cardImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0) 35%, rgba(12,20,24,0.88) 100%)" }} />
                    <div className="relative p-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--mint)", textShadow: "0 1px 6px rgba(0,0,0,0.65)" }}>{g.category}</span>
                      <p className="text-base font-bold leading-snug text-white mt-0.5">{g.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Featured Stories — the website's "In Focus" section
              (FeatureBlocks.jsx), as a horizontal scroller like What's On
              rather than the alternating full-width rows desktop has room
              for. Each card links to the same /mobile/story/:slug detail
              page the "See all" listing on Offers already surfaces. ── */}
          {featuredStories.length > 0 && (
            <div>
              <SectionHead eyebrow="Featured Stories" to="/mobile/offers" />
              <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-5 px-5">
                {featuredStories.map((s) => (
                  <div key={s.slug} className="shrink-0 w-64 flex flex-col overflow-hidden bg-white" style={{ borderRadius: 16, boxShadow: "0 10px 26px -12px rgba(28,46,56,0.45)" }}>
                    <SpotlightImage src={s.cardImage} alt={s.cardHeading} className="w-full h-40" />
                    <div className="p-3.5 flex flex-col gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--teal-deep)" }}>{s.eyebrow}</span>
                      <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{s.cardHeading}</p>
                      <p className="text-xs leading-snug line-clamp-2 font-medium" style={{ color: "#000000" }}>{s.cardBody}</p>
                      <Link to={`/mobile/story/${s.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold mt-1" style={{ color: "var(--teal-deep)" }}>
                        Read more
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Parking & Transport signposting ── */}
          <div>
            <p className="section-eyebrow mb-3" style={{ color: "var(--teal-deep)" }}>Practical Info</p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/mobile/parking"
                className="flex flex-col gap-2 p-4 rounded-2xl active:opacity-85"
                style={{ backgroundColor: "var(--forest)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 18V6h4.5a3.5 3.5 0 0 1 0 7H8" /></svg>
                <span className="text-sm font-bold text-white leading-tight">Parking</span>
                <span className="text-[11px] font-medium leading-snug" style={{ color: "rgba(255,255,255,0.8)" }}>Car parks &amp; directions</span>
              </Link>
              <Link
                to="/mobile/transport"
                className="flex flex-col gap-2 p-4 rounded-2xl active:opacity-85"
                style={{ backgroundColor: "var(--teal-deep)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M5 11h14M9 16l-2 4M15 16l2 4" /></svg>
                <span className="text-sm font-bold text-white leading-tight">Getting Here</span>
                <span className="text-[11px] font-medium leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>Trains, buses &amp; driving</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <NotificationTray open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </MobileShell>
  );
}

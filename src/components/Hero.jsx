import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { hero } from "../Data/content";
import SmartLink from "./SmartLink";

// Per-device hero media — a native 16:9 cut for landscape screens and a 9:16
// cut for portrait phones, so object-cover fills each with almost no crop.
const DESKTOP_MEDIA = { src: "/videos/hero.mp4", poster: "/images/hero-poster.jpg" };
const MOBILE_MEDIA = { src: "/videos/hero-mobile.mp4", poster: "/images/hero-poster-mobile.jpg" };
const DESKTOP_QUERY = "(min-width: 768px)";

// Feature-card wrapper: SPA <Link> for internal routes (cta.to), <a> for hash anchors
function CardLink({ cta, className, children }) {
  if (cta.to) return <Link to={cta.to} className={className}>{children}</Link>;
  return <a href={cta.href} className={className}>{children}</a>;
}

const s = hero.slides[0];

// Honour reduced-motion: skip video autoplay (poster stays) for users who ask
// for less motion. Evaluated once at load — this is a CSR (Vite) app.
const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Hero() {
  const videoRef = useRef(null);

  // Always-on tap fallback: if the video is paused (e.g. iOS Low Power Mode
  // blocked autoplay), a tap anywhere in the hero starts it. Taps bubble up to
  // the section, so this catches the native play-button tap too.
  const handleHeroTap = () => {
    const v = videoRef.current;
    if (!v || !v.paused) return;
    v.muted = true;
    v.playsInline = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  // Pick the orientation-matched source. matchMedia keeps only ONE video in the
  // DOM at a time, so the other device's file is never downloaded.
  const [media, setMedia] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(DESKTOP_QUERY).matches
      ? DESKTOP_MEDIA
      : MOBILE_MEDIA
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setMedia(e.matches ? DESKTOP_MEDIA : MOBILE_MEDIA);
    onChange(mql);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Robustness fallback: some engines (Safari, mobile power-saving) don't honour
  // the autoplay attribute alone even when muted. Nudge playback once the video
  // can play — unless the user prefers reduced motion, in which case the poster
  // frame stays. Rejections (e.g. autoplay policy) are swallowed silently.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const v = videoRef.current;
    if (!v) return;
    // iOS Safari only allows muted autoplay when the muted *property* is set on
    // the element (React's `muted` attribute alone is frequently NOT reflected
    // to the property — that's what makes Safari block autoplay and overlay a
    // play button). Force it, along with inline playback, before play().
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    tryPlay();
    // Retry once the media is ready — covers power-saving / late-decode cases.
    v.addEventListener("loadeddata", tryPlay, { once: true });
    v.addEventListener("canplay", tryPlay, { once: true });

    // ── iOS Low Power Mode ──
    // Safari blocks ALL autoplay in Low Power Mode (unavoidable) and shows a
    // native play button. Tapping it did nothing because the caption/overlay
    // layer sits above the video and swallows the gesture. So we listen for the
    // first user interaction anywhere — in the CAPTURE phase, so no overlay can
    // stop it — and start playback then (a tap is a valid user activation that
    // Low Power Mode allows for muted inline video). Retries on every gesture
    // until playback actually begins, then detaches.
    const gestureOpts = { capture: true, passive: true };
    const onGesture = () => tryPlay();
    document.addEventListener("pointerdown", onGesture, gestureOpts);
    document.addEventListener("touchstart", onGesture, gestureOpts);
    const onPlaying = () => {
      document.removeEventListener("pointerdown", onGesture, gestureOpts);
      document.removeEventListener("touchstart", onGesture, gestureOpts);
    };
    v.addEventListener("playing", onPlaying, { once: true });

    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("playing", onPlaying);
      document.removeEventListener("pointerdown", onGesture, gestureOpts);
      document.removeEventListener("touchstart", onGesture, gestureOpts);
    };
  }, [media.src]);

  return (
    <section aria-label="Hero" className="hero-section relative w-full overflow-hidden" onClick={handleHeroTap}>
      {/* ── Fullscreen background video ──
          Covers the whole viewport, autoplays muted + looping, plays inline on
          mobile, no controls. The poster paints instantly and is the fallback
          when autoplay is suppressed (reduced-motion / power-saving). */}
      <video
        key={media.src}
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={media.src}
        poster={media.poster}
        autoPlay={!prefersReducedMotion}
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        disableRemotePlayback
        controls={false}
        // Paint the poster (and a brand-dark fallback) as the element's own
        // background so there is never a grey flash before the video decodes.
        style={{
          backgroundColor: "#1C2E38",
          backgroundImage: `url(${media.poster})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ── Readability overlays (balanced for centred caption) ──
          Flat tint for overall contrast + a soft radial vignette that darkens
          the edges so the white caption reads crisply over any video frame. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: "rgba(12,20,24,0.34)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 92% 72% at 50% 46%, rgba(12,20,24,0) 34%, rgba(12,20,24,0.5) 100%)",
        }}
      />

      {/* ── Caption (centred over the video) ── */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h1
          className="text-white uppercase"
          style={{ fontFamily: "var(--font-heading)", textShadow: "0 2px 32px rgba(0,0,0,0.55)" }}
        >
          <span
            className="block text-base sm:text-lg md:text-2xl font-medium mb-3 md:mb-5"
            style={{ letterSpacing: "-0.01em", color: "#ffffff" }}
          >
            Welcome to
          </span>
          <span className="hero-title block text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-none">
            Maidenhead
          </span>
        </h1>

        <div className="flex items-center gap-3 md:gap-4 mt-6 md:mt-8">
          <span className="hidden sm:block" style={{ height: 1, width: 36, background: "rgba(255,255,255,0.55)" }} />
          <p
            className="text-base sm:text-lg md:text-2xl font-medium uppercase"
            style={{
              letterSpacing: "-0.01em",
              color: "#ffffff",
              textShadow: "0 1px 12px rgba(0,0,0,0.5)",
            }}
          >
            Riverside · Connected · Thriving
          </p>
          <span className="hidden sm:block" style={{ height: 1, width: 36, background: "rgba(255,255,255,0.55)" }} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURE CARD ("Waterfront Dining & Bars") — COMMENTED OUT per request.
          To restore, delete the opening marker below and the closing marker at
          the end of this block; both the mobile (inline) and desktop (absolute)
          cards render exactly as before.
      ─────────────────────────────────────────────────────────────────────────
      {s.featureCard && (
        <CardLink
          cta={s.featureCard.cta}
          className="md:hidden absolute left-4 right-4 bottom-8 flex items-center gap-3 bg-white rounded-2xl shadow-xl p-3 group z-10"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
            <img src={s.featureCard.image} alt={s.featureCard.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="section-eyebrow mb-0.5" style={{ color: "var(--sage)" }}>{s.featureCard.label}</p>
            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--forest)" }}>{s.featureCard.title}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: "var(--leaf)" }}>{s.featureCard.cta.label}</p>
          </div>
          <span className="text-lg shrink-0" style={{ color: "var(--sage)" }}>→</span>
        </CardLink>
      )}
      {s.featureCard && (
        <CardLink
          cta={s.featureCard.cta}
          className="hidden md:flex absolute bottom-10 right-12 w-72 rounded-2xl overflow-hidden shadow-2xl flex-col bg-white group z-10"
        >
          <div className="h-36 overflow-hidden">
            <img src={s.featureCard.image} alt={s.featureCard.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
          <div className="p-4 flex items-start justify-between gap-3">
            <div>
              <p className="section-eyebrow mb-1" style={{ color: "var(--sage)" }}>{s.featureCard.label}</p>
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--forest)" }}>{s.featureCard.title}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: "var(--leaf)" }}>{s.featureCard.cta.label}</p>
            </div>
            <span className="text-xl shrink-0 mt-1 transition-transform duration-150 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
          </div>
        </CardLink>
      )}
      ═══ end feature card ═══ */}
    </section>
  );
}

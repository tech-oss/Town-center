import { useEffect, useRef, useState } from "react";

// A looping background video that only downloads once it is near the screen.
//
// The homepage carried six of these plus the Instagram reels, every one with
// `preload="auto"` and `autoPlay`, so the browser fetched all of them in full
// while the visitor was still looking at the hero — tens of megabytes for
// sections most people never scroll to.
//
// Here the <video> starts with no `src` at all, which is the only reliable way
// to stop a browser fetching it. The poster shows in its place, so the card
// looks finished from the first paint. An IntersectionObserver sets the source
// shortly before the card arrives on screen, and playback stops again when it
// leaves, which keeps a long page from decoding a dozen videos at once.
//
// Anyone who has asked for reduced motion keeps the poster and never downloads
// the video at all.

const PRELOAD_MARGIN = "300px";

export default function LazyVideo({
  src,
  poster,
  className = "",
  ariaLabel,
  // The hero is the exception: it is the first thing on screen, so waiting for
  // an observer only delays it.
  eager = false,
  ...rest
}) {
  const ref = useRef(null);
  const [load, setLoad] = useState(eager);

  useEffect(() => {
    if (load) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    // No observer (old browser): fall back to loading it rather than showing a
    // still image forever.
    if (typeof IntersectionObserver === "undefined") { setLoad(true); return undefined; }

    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setLoad(true); io.disconnect(); } },
      { rootMargin: PRELOAD_MARGIN }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  // Play only while on screen. A dozen looping videos decoding at once is what
  // makes a long page stutter, even after the bytes have arrived.
  useEffect(() => {
    if (!load) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play?.().catch(() => {});
        else el.pause?.();
      },
      { rootMargin: "50px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  return (
    <video
      ref={ref}
      // Set only once it is wanted — a `src` present at mount is downloaded
      // whatever `preload` says.
      {...(load ? { src } : {})}
      poster={poster}
      autoPlay={load}
      loop
      muted
      playsInline
      preload={load ? "auto" : "none"}
      aria-label={ariaLabel}
      className={className}
      {...rest}
    />
  );
}

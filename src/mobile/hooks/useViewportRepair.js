import { useEffect } from "react";

// Keeps the pinned app exactly as tall as the screen.
//
// The app is a fixed, full-screen frame (.mobile-root). On iPhone, when the
// app is covered by a full-screen viewer — an agreement PDF opened from the
// claim flow, a Safari sheet — and then shown again (often restored from the
// back/forward cache, so nothing re-renders), Safari can keep the shorter
// height it had while covered. The frame then stops short and leaves a white
// band under the tab bar until the app is reloaded.
//
// Every time the app comes back (pageshow, visibilitychange, focus) or the
// screen changes size, the real height is measured and written to
// --app-height, which .mobile-root uses. It is measured again a few times
// over the next second, since Safari settles its own size in stages, and
// the page is nudged to the top so no stale scroll offset is left behind.
export default function useViewportRepair() {
  useEffect(() => {
    const root = document.documentElement;
    let timers = [];

    const measure = () => {
      const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
      // Never shrink the frame to a sliver while the keyboard is up: only
      // the full window height counts as the app's height.
      const full = Math.max(h, window.innerHeight);
      if (full > 0) root.style.setProperty("--app-height", `${full}px`);
      if (window.scrollY || window.scrollX) window.scrollTo(0, 0);
    };

    const repair = () => {
      timers.forEach(clearTimeout);
      measure();
      timers = [60, 250, 600, 1200].map((ms) => setTimeout(measure, ms));
    };

    const onVisible = () => { if (document.visibilityState === "visible") repair(); };

    repair();
    window.addEventListener("pageshow", repair);
    window.addEventListener("focus", repair);
    window.addEventListener("resize", repair);
    window.addEventListener("orientationchange", repair);
    window.visualViewport?.addEventListener("resize", repair);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("pageshow", repair);
      window.removeEventListener("focus", repair);
      window.removeEventListener("resize", repair);
      window.removeEventListener("orientationchange", repair);
      window.visualViewport?.removeEventListener("resize", repair);
      document.removeEventListener("visibilitychange", onVisible);
      root.style.removeProperty("--app-height");
    };
  }, []);
}

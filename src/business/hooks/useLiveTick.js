import { useEffect, useState } from "react";

// A counter that goes up every `ms` and whenever the visitor comes back to the
// tab. Put it in a data-loading effect's dependencies and the figures refresh
// on their own — so a page view recorded while the analytics are open shows up
// within seconds, and switching back to the tab never shows stale numbers.
export default function useLiveTick(ms = 30_000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const id = setInterval(bump, ms);
    const onVisible = () => { if (document.visibilityState === "visible") bump(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", bump);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", bump);
    };
  }, [ms]);
  return tick;
}

import { useEffect, useState } from "react";

// A counter that goes up every `ms` and whenever the visitor comes back to the
// tab. Put it in a data-loading effect's dependencies and the figures refresh
// on their own.
//
// Only while the tab is actually on screen. A dashboard left open in a
// background tab used to keep polling all night — every tick is a set of API
// requests, and every request is a line in Supabase's log ingestion, which is
// what was eating the free plan's 1 GB. Now a hidden tab makes no requests at
// all, and catches up once, the moment it's looked at again.
const MIN_GAP_MS = 10_000;

export default function useLiveTick(ms = 120_000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let last = Date.now();
    const bump = () => {
      if (document.visibilityState !== "visible") return;
      // Returning to a tab fires both "visibilitychange" and "focus"; one
      // refresh is enough.
      if (Date.now() - last < MIN_GAP_MS) return;
      last = Date.now();
      setTick((t) => t + 1);
    };
    const id = setInterval(bump, ms);
    document.addEventListener("visibilitychange", bump);
    window.addEventListener("focus", bump);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", bump);
      window.removeEventListener("focus", bump);
    };
  }, [ms]);
  return tick;
}

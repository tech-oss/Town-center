import { useState, useEffect, useRef } from "react";
import { useLiveVersion } from "../lib/liveUpdates";

// Single, consistent async data hook for the api/ layer.
//
//   const { data, loading, error } = useFetch(() => getProperties({ status }), [status]);
//
// `loader` is a function returning a Promise (an api/ resource function).
// `deps` re-runs the loader when they change (same contract as useEffect deps).
// An in-flight request is ignored if the component unmounts or deps change,
// preventing stale state updates.
//
// On the public site and app, live updates (lib/liveUpdates.js) re-run the
// loader when admin changes content. That refresh is silent: the current data
// stays on screen until the new data arrives, and a failed refresh keeps it.
export default function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  // When deps change, reset to the loading state during render (no extra paint,
  // and avoids a synchronous setState inside the effect below).
  const key = JSON.stringify(deps);
  const [seenKey, setSeenKey] = useState(key);
  if (key !== seenKey) {
    setSeenKey(key);
    setState({ data: null, loading: true, error: null });
  }

  const liveVersion = useLiveVersion();
  const loadedVersion = useRef(liveVersion);

  useEffect(() => {
    let alive = true;
    const silent = loadedVersion.current !== liveVersion;
    loadedVersion.current = liveVersion;
    Promise.resolve()
      .then(loader)
      .then((data) => { if (alive) setState({ data, loading: false, error: null }); })
      .catch((error) => {
        if (!alive) return;
        if (silent) return; // keep what's on screen if a background refresh fails
        setState({ data: null, loading: false, error });
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, liveVersion]);

  return state;
}

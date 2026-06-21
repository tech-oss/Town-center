import { useState, useEffect } from "react";

// Single, consistent async data hook for the api/ layer.
//
//   const { data, loading, error } = useFetch(() => getProperties({ status }), [status]);
//
// `loader` is a function returning a Promise (an api/ resource function).
// `deps` re-runs the loader when they change (same contract as useEffect deps).
// An in-flight request is ignored if the component unmounts or deps change,
// preventing stale state updates.
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

  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(loader)
      .then((data) => { if (alive) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (alive) setState({ data: null, loading: false, error }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

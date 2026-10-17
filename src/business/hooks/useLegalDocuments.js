import { useEffect, useState } from "react";
import { getCurrentDocuments } from "../api/agreements";

// The current version of each document a business has to accept (loaded
// once per page). `documents` is null while loading; `error` is set if they
// couldn't be read, in which case nothing can be accepted.
export default function useLegalDocuments() {
  const [state, setState] = useState({ documents: null, error: null });
  useEffect(() => {
    let alive = true;
    getCurrentDocuments()
      .then((documents) => { if (alive) setState({ documents, error: null }); })
      .catch((error) => { if (alive) setState({ documents: [], error }); });
    return () => { alive = false; };
  }, []);
  return state;
}

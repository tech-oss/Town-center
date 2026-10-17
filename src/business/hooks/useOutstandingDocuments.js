import { useEffect, useSyncExternalStore } from "react";
import { getOutstandingDocuments } from "../api/agreements";

// The current legal documents this business hasn't accepted yet — checked
// once per sign-in (and again after accepting), shared by every route guard
// so moving between dashboard pages doesn't re-ask the database.
//
// state: { businessId, status: "loading" | "ready", documents }
let state = { businessId: null, status: "loading", documents: [] };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
function set(next) { state = next; emit(); }

function load(businessId) {
  set({ businessId, status: "loading", documents: [] });
  getOutstandingDocuments(businessId)
    .then((documents) => { if (state.businessId === businessId) set({ businessId, status: "ready", documents }); })
    // Never lock anyone out because the check itself failed: let them in and
    // ask again at the next sign-in.
    .catch((e) => {
      console.warn("Couldn't check for updated terms:", e?.message ?? e);
      if (state.businessId === businessId) set({ businessId, status: "ready", documents: [] });
    });
}

// Re-checks after the business accepts (or admin publishes while signed in).
export function refreshOutstandingDocuments() {
  if (state.businessId) load(state.businessId);
}

export default function useOutstandingDocuments(businessId) {
  const snap = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);
  useEffect(() => {
    if (businessId && state.businessId !== businessId) load(businessId);
  }, [businessId]);
  if (!businessId) return { status: "ready", documents: [] };
  if (snap.businessId !== businessId) return { status: "loading", documents: [] };
  return snap;
}

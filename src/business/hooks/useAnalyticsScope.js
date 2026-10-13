import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useBusinessAuth from "./useBusinessAuth";
import { isAccommodationCompany } from "../../Data/accommodation";
import { listProperties } from "../api/accommodation";

// Which business the Analytics pages show. A standard business always sees
// its own figures. An accommodation company picks "All properties" (its own
// id: the database adds up the company and every property — see
// accommodation_analytics_2026_10.sql) or one property, kept in the page's
// address as ?scope=<property id> so the PDF report and an item's own page
// follow the same choice. The database refuses an id the user can't read.
export default function useAnalyticsScope() {
  const { user } = useBusinessAuth();
  const [params, setParams] = useSearchParams();
  const company = isAccommodationCompany(user);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (!company) return undefined;
    let cancelled = false;
    listProperties(user.id).then((list) => { if (!cancelled) setProperties(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, [company, user.id]);

  const requested = company ? params.get("scope") : null;
  const scopeId = requested || user.id;
  const scopeName = scopeId === user.id
    ? (company ? "All properties" : user.businessName)
    : properties.find((p) => p.id === scopeId)?.name ?? "Property";

  function setScope(id) {
    const next = new URLSearchParams(params);
    if (!id || id === user.id) next.delete("scope"); else next.set("scope", id);
    setParams(next, { replace: true });
  }

  // "?scope=…" to carry the choice onto another analytics page ("" if none).
  const scopeQuery = scopeId !== user.id ? `scope=${encodeURIComponent(scopeId)}` : "";

  return { company, properties, scopeId, scopeName, setScope, scopeQuery };
}

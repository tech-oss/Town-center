// "Search near a postcode" for the Stay listing pages (web and mobile).
//
// This was a hardcoded table of seven outward codes around Maidenhead, and
// anything else was refused with "Postcode area not recognised — try SL6,
// SL4, SL1, SL7, SL8 or RG9". Fine while the only listings were local, but a
// visitor planning a trip types where they are coming *from*, and a table of
// seven can never be "any valid postcode".
//
// So the table stays as an instant, offline answer for the codes people
// actually type here, and anything else is resolved through postcodes.io —
// the Ordnance Survey / ONS open postcode data, free and keyless. Only the
// postcode typed into the search box is sent, which is the whole point of
// the box; nothing else about the visitor goes with it.
//
// If that service can't be reached, the local codes still work and the rest
// report as unresolved rather than silently searching from the wrong place.

export const POSTCODE_COORDS = {
  SL6: { lat: 51.522, lng: -0.72 }, // Maidenhead
  SL4: { lat: 51.484, lng: -0.605 }, // Windsor
  SL1: { lat: 51.511, lng: -0.595 }, // Slough
  SL7: { lat: 51.571, lng: -0.782 }, // Marlow
  SL8: { lat: 51.589, lng: -0.744 }, // Bourne End
  RG9: { lat: 51.536, lng: -0.895 }, // Henley-on-Thames
  RG10: { lat: 51.514, lng: -0.822 }, // Twyford
};
export const RADIUS_OPTIONS = [1, 3, 5, 10];

// UK postcode, full or outward-only: one or two letters, a digit, an
// optional letter or digit, then optionally the inward part (digit + two
// letters). Deliberately permissive about spacing and case.
const FULL_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/;
const OUTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?$/;

export function normalisePostcode(input) {
  return String(input ?? "").toUpperCase().replace(/\s+/g, " ").trim();
}

export function outwardOf(input) {
  const s = normalisePostcode(input).replace(/\s+/g, "");
  // A full postcode's inward part is always the last three characters.
  return FULL_RE.test(normalisePostcode(input)) ? s.slice(0, -3) : s;
}

export function isValidPostcode(input) {
  const s = normalisePostcode(input);
  return FULL_RE.test(s) || OUTCODE_RE.test(s.replace(/\s+/g, ""));
}

// Resolved lookups, so re-typing or re-applying the same postcode doesn't go
// back out to the network. Nulls are cached too — a postcode that doesn't
// exist won't start resolving again on every keystroke.
const cache = new Map();

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.result ?? null;
}

// { lat, lng } for any valid UK postcode, or null if it can't be resolved.
export async function lookupPostcode(input) {
  const s = normalisePostcode(input);
  if (!isValidPostcode(s)) return null;
  if (cache.has(s)) return cache.get(s);

  const outward = outwardOf(s);
  // The local table first: no network, and these are the codes this site is
  // actually about.
  const local = POSTCODE_COORDS[outward];
  if (local) {
    cache.set(s, local);
    return local;
  }

  let coords = null;
  try {
    const compact = s.replace(/\s+/g, "");
    const result = FULL_RE.test(s)
      ? await fetchJson(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`)
      : await fetchJson(`https://api.postcodes.io/outcodes/${encodeURIComponent(compact)}`);
    if (typeof result?.latitude === "number" && typeof result?.longitude === "number") {
      coords = { lat: result.latitude, lng: result.longitude };
    }
  } catch {
    // Offline, blocked, or the service is down. Treated the same as "not
    // found" by the caller, which says so rather than searching from a
    // place the visitor didn't ask for.
    coords = null;
  }

  cache.set(s, coords);
  return coords;
}

export function milesBetween(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

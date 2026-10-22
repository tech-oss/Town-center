// Where a listing is, from its address text, when it has no saved
// coordinates — for the location maps on the website and in the app.
//
// A UK postcode is unique, a street name isn't: "123 high street, SL6 2TD"
// sent to OpenStreetMap's search matched a High Street in Canterbury. So a
// postcode found anywhere in the text is looked up first on postcodes.io (the
// Ordnance Survey / ONS open postcode data, free and keyless), which gives
// that postcode's exact spot (or, for a mistyped one, its area). Only
// without a postcode — or if that lookup fails — is the free text searched,
// limited to Great Britain, dropping the most specific leading part (a farm
// or building name) on a miss.

const POSTCODE_IN_TEXT = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
const cache = new Map();

async function json(url) {
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return null;
  return res.json();
}

const coordsOf = (r) => (typeof r?.latitude === "number" && typeof r?.longitude === "number" ? { lat: r.latitude, lng: r.longitude } : null);

// The postcode's spot; for one that doesn't exist (a typo), the centre of its
// area (SL1, SL6…) — still far closer than a same-named street elsewhere.
async function fromPostcode(text) {
  const m = String(text).match(POSTCODE_IN_TEXT);
  if (!m) return null;
  const outward = m[1].toUpperCase();
  try {
    const full = coordsOf((await json(`https://api.postcodes.io/postcodes/${encodeURIComponent(`${outward}${m[2]}`.toUpperCase())}`))?.result);
    if (full) return full;
    return coordsOf((await json(`https://api.postcodes.io/outcodes/${encodeURIComponent(outward)}`))?.result);
  } catch {
    return null;
  }
}

async function searchOnce(query) {
  try {
    const data = await json(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=gb`);
    return data?.length ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
  } catch {
    return null;
  }
}

export async function geocodePlace(query) {
  const q = String(query ?? "").trim();
  if (!q) return null;
  if (cache.has(q)) return cache.get(q);
  let result = await fromPostcode(q);
  if (!result) {
    const segments = q.split(",").map((s) => s.trim()).filter(Boolean);
    for (let i = 0; i < segments.length && !result; i++) {
      result = await searchOnce(segments.slice(i).join(", "));
    }
  }
  cache.set(q, result);
  return result;
}

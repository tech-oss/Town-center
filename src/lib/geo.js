// Coordinate checks shared by the public site, the app and admin.
//
// A single impossible coordinate is not harmless: leaflet.markercluster turns
// a longitude like -6997804401239999 (a dropped decimal point) into a grid
// cell so large that `j++` no longer changes it, and its neighbour search
// loops forever, freezing the homepage and the app map. So coordinates are
// validated where they're entered, where they're saved, and again where
// they're read.

export const TOWN_CENTRE = { lat: 51.5225, lng: -0.7196 };
const NEARBY_KM = 25;

function toNumber(v) {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

// { lat, lng } as numbers when both are present and on the globe, else null.
export function parseCoords(lat, lng) {
  const a = toNumber(lat);
  const b = toNumber(lng);
  if (a === null || b === null || Number.isNaN(a) || Number.isNaN(b)) return null;
  if (a < -90 || a > 90 || b < -180 || b > 180) return null;
  return { lat: a, lng: b };
}

export function isValidCoords(lat, lng) {
  return parseCoords(lat, lng) !== null;
}

function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Why a lat/lng pair can't be saved, or null when it can. Leaving both blank
// is allowed (no map pin).
export function coordsError(lat, lng) {
  const a = toNumber(lat);
  const b = toNumber(lng);
  if (a === null && b === null) return null;
  if (a === null || b === null) return "Enter both latitude and longitude, or leave both blank.";
  if (Number.isNaN(a) || Number.isNaN(b)) return "Coordinates must be numbers, e.g. 51.5225 and -0.7196.";
  if (a < -90 || a > 90) return `Latitude ${lat} is impossible — it must be between -90 and 90. Check for a missing decimal point.`;
  if (b < -180 || b > 180) return `Longitude ${lng} is impossible — it must be between -180 and 180. Check for a missing decimal point.`;
  return null;
}

// A valid pair that's suspiciously far from Maidenhead (a dropped minus sign
// or swapped fields). Advisory only — doesn't block saving.
export function coordsWarning(lat, lng) {
  const c = parseCoords(lat, lng);
  if (!c) return null;
  const km = distanceKm(TOWN_CENTRE, c);
  return km > NEARBY_KM
    ? `This pin is ${Math.round(km)} km from Maidenhead town centre. Double-check the numbers (a missing minus sign or swapped fields?).`
    : null;
}

// Throws before a save so an impossible coordinate never reaches the database.
export function assertValidCoords(lat, lng) {
  const msg = coordsError(lat, lng);
  if (msg) throw new Error(msg);
}


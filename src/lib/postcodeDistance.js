// Shared "search near a postcode" helpers for the Stay listing pages (web
// and mobile) — a small, local outward-code → centroid lookup for the
// Maidenhead area, enough to power a real postcode-radius filter without a
// live geocoding service. Falls back gracefully (no distance filtering) for
// any postcode outside this list.
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

export function milesBetween(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

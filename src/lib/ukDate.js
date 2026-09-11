// UK date handling for the admin. Dates are stored as ISO (YYYY-MM-DD, or a
// full timestamp) and only ever shown to people as DD/MM/YYYY.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/;

// "2026-09-11" or "2026-09-11T10:00:00Z" → "11/09/2026". Anything that isn't
// an ISO date — a free-text label like "Monthly · 7pm" — is returned as is.
export function formatUK(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toLocaleDateString("en-GB");
  }
  const m = ISO_DATE.exec(String(value));
  if (!m) return String(value);
  // A bare date has no time zone, so read its parts directly rather than via
  // new Date(), which would shift it a day for anyone west of UTC.
  if (String(value).length === 10) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? `${m[3]}/${m[2]}/${m[1]}` : d.toLocaleDateString("en-GB");
}

// "11/09/2026" (also 11-09-2026, 11.09.2026, 1/9/2026) → "2026-09-11", or
// null when it isn't a real calendar date.
export function parseUK(text) {
  const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s*$/.exec(text ?? "");
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function isISODate(value) {
  return typeof value === "string" && ISO_DATE.test(value);
}

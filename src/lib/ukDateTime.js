// Homepage bookings run to the minute in UK time, whatever time zone the
// browser is in. These convert between stored instants and London wall time.

const LONDON = "Europe/London";

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON, hourCycle: "h23",
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
});

function londonParts(date) {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

// Minutes London is ahead of UTC at that instant (0 in winter, 60 in summer).
function londonOffsetMs(date) {
  const p = londonParts(date);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(date.getTime() / 1000) * 1000;
}

// "17/09/2026, 14:30" — UK date and 24-hour time.
export function formatUKDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = londonParts(d);
  const two = (n) => String(n).padStart(2, "0");
  return `${two(p.d)}/${two(p.mo)}/${p.y}, ${two(p.h)}:${two(p.mi)}`;
}

// Instant → "YYYY-MM-DDTHH:mm" London wall time, for <input type="datetime-local">.
export function toLondonInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = londonParts(d);
  const two = (n) => String(n).padStart(2, "0");
  return `${p.y}-${two(p.mo)}-${two(p.d)}T${two(p.h)}:${two(p.mi)}`;
}

// "YYYY-MM-DDTHH:mm" London wall time → Date (null if not a real time).
export function fromLondonInput(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(text ?? "");
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes settle the offset either side of a clock change.
  let guess = new Date(wall - londonOffsetMs(new Date(wall)));
  guess = new Date(wall - londonOffsetMs(guess));
  return Number.isNaN(guess.getTime()) ? null : guess;
}

// "3d 4h 12m", "4h 05m", "12m 30s".
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${String(m).padStart(2, "0")}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

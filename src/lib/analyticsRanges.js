// Shared between businessAnalytics.js (real) and businessAnalyticsMock.js
// (dummy data), plus RangeSelector.jsx and the analytics pages, so all of
// them agree on what a "range" is.
//
// A range is either:
//   { type: "preset", key: "7d" | "30d" | "3m" | "12m" }
//   { type: "custom", from: "YYYY-MM-DD", to: "YYYY-MM-DD" }

export const RANGE_PRESETS = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "3m", label: "3 months", days: 90 },
  { key: "12m", label: "12 months", days: 365 },
];

export const DEFAULT_RANGE = { type: "preset", key: "30d" };

// Builds a local-midnight Date from either a "YYYY-MM-DD" string or an
// existing Date, using explicit y/m/d components throughout (never
// toISOString/Date-string parsing) — that combination is what silently
// shifts the date by a day depending on the viewer's timezone offset from
// UTC, which is exactly the kind of bug that's invisible in one timezone
// and wrong in another.
function toDateOnly(d) {
  if (typeof d === "string") {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// "YYYY-MM-DD" from a Date's *local* components — the inverse of
// toDateOnly's string branch, and never via toISOString (UTC).
function toDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Resolves any range shape into concrete { from, to } Date objects (both
// inclusive, "to" defaulting to today for presets) plus a human-readable
// label for display in headers and the PDF report.
export function resolveRange(range) {
  const today = toDateOnly(new Date());
  if (range?.type === "custom" && range.from && range.to) {
    const from = toDateOnly(range.from);
    const to = toDateOnly(range.to);
    // Guard against an inverted or same-day-only accidental selection —
    // callers (RangeSelector) validate on input, this is just a backstop.
    const [start, end] = from <= to ? [from, to] : [to, from];
    return {
      from: start,
      to: end,
      label: `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    };
  }
  const preset = RANGE_PRESETS.find((r) => r.key === range?.key) ?? RANGE_PRESETS[1];
  const from = new Date(today);
  from.setDate(from.getDate() - (preset.days - 1));
  return { from, to: today, label: `Last ${preset.label}` };
}

// Every day between from/to inclusive, as "YYYY-MM-DD" strings — the shared
// backbone both the mock generator and the real RPC-backed queries bucket
// their results onto.
export function eachDay(from, to) {
  const days = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (cursor <= to) {
    days.push(toDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

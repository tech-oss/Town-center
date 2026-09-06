// Client-side expansion of a recurrence rule into concrete calendar dates.
// Dates are handled as explicit y/m/d components throughout (never via
// `new Date(dateString)` / `toISOString()` round-trips) to avoid the
// UTC-vs-local timezone day-shift bug hit earlier in analyticsRanges.js.

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const ORDINAL_OPTIONS = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
  { value: -1, label: "Last" },
];

function parseDateOnly(str) {
  const [y, m, d] = str.split("-").map(Number);
  return { y, m, d };
}
function toDate({ y, m, d }) {
  return new Date(y, m - 1, d);
}
function toDateString({ y, m, d }) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function addDays({ y, m, d }, n) {
  const date = new Date(y, m - 1, d + n);
  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
}
function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

// Every date matching `weekday` in month (y, m), 1-indexed occurrences.
function weekdaysInMonth(y, m, weekdayIndex) {
  const total = daysInMonth(y, m);
  const out = [];
  for (let d = 1; d <= total; d++) {
    if (new Date(y, m - 1, d).getDay() === weekdayIndex) out.push(d);
  }
  return out;
}

/**
 * Expands a recurrence rule into an array of "YYYY-MM-DD" date strings,
 * inclusive of both `from` and `to` bounds.
 *
 * rule: {
 *   type: "weekly" | "biweekly" | "monthly_by_weekday",
 *   days: ["Sunday", ...],              // weekly/biweekly: 1+ weekdays; monthly: exactly 1
 *   ordinals: [1, 3] | [-1],            // monthly_by_weekday only
 *   startDate: "YYYY-MM-DD",
 *   endDate: "YYYY-MM-DD" | null,
 * }
 */
export function expandRecurrence(rule, { from, to }) {
  const start = parseDateOnly(rule.startDate);
  const rangeFrom = maxDate(parseDateOnly(from), start);
  let rangeTo = parseDateOnly(to);
  if (rule.endDate) rangeTo = minDate(rangeTo, parseDateOnly(rule.endDate));
  if (compareDate(rangeFrom, rangeTo) > 0) return [];

  const dates = [];

  if (rule.type === "weekly" || rule.type === "biweekly") {
    const weekdayIndexes = (rule.days ?? []).map((d) => WEEKDAYS.indexOf(d)).filter((i) => i >= 0);
    const stepDays = rule.type === "biweekly" ? 14 : 7;
    // Anchor each requested weekday to its first occurrence on/after startDate,
    // then step forward by stepDays until past rangeTo.
    for (const weekdayIndex of weekdayIndexes) {
      let cursor = firstOnOrAfterWeekday(start, weekdayIndex);
      while (compareDate(cursor, rangeTo) <= 0) {
        if (compareDate(cursor, rangeFrom) >= 0) dates.push(toDateString(cursor));
        cursor = addDays(cursor, stepDays);
      }
    }
  } else if (rule.type === "monthly_by_weekday") {
    const weekdayIndex = WEEKDAYS.indexOf(rule.days?.[0]);
    if (weekdayIndex < 0) return [];
    const ordinals = rule.ordinals?.length ? rule.ordinals : [1];
    let y = rangeFrom.y, m = rangeFrom.m;
    while (y < rangeTo.y || (y === rangeTo.y && m <= rangeTo.m)) {
      const matches = weekdaysInMonth(y, m, weekdayIndex);
      for (const ord of ordinals) {
        const day = ord === -1 ? matches[matches.length - 1] : matches[ord - 1];
        if (day == null) continue;
        const candidate = { y, m, d: day };
        if (compareDate(candidate, rangeFrom) >= 0 && compareDate(candidate, rangeTo) <= 0) {
          dates.push(toDateString(candidate));
        }
      }
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
  }

  return dates.sort();
}

function firstOnOrAfterWeekday(startYmd, weekdayIndex) {
  let cursor = startYmd;
  while (toDate(cursor).getDay() !== weekdayIndex) cursor = addDays(cursor, 1);
  return cursor;
}
function compareDate(a, b) {
  return toDate(a) - toDate(b);
}
function maxDate(a, b) { return compareDate(a, b) >= 0 ? a : b; }
function minDate(a, b) { return compareDate(a, b) <= 0 ? a : b; }

// Human-readable summary for cards/badges, e.g. "Every Sunday", "Every other
// Sunday", "1st & 3rd Sunday of the month".
export function describeRecurrence(rule) {
  if (!rule?.type) return "";
  const dayList = (rule.days ?? []).join(" & ");
  if (rule.type === "weekly") return `Every ${dayList}`;
  if (rule.type === "biweekly") return `Every other ${dayList}`;
  if (rule.type === "monthly_by_weekday") {
    const ordLabels = (rule.ordinals ?? []).map((o) => ORDINAL_OPTIONS.find((op) => op.value === o)?.label ?? o).join(" & ");
    return `${ordLabels} ${dayList} of the month`;
  }
  return "";
}

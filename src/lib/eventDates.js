// Formats a date the way the hardcoded content did ("Sunday 14 June 2026"),
// used when an event has a real date but no explicit label. Recurring events
// carry their own phrasing ("2nd Sunday of each month") in date_label.
//
// It lives here rather than in api/events.js because the business data layer
// needs it too, and events.js reads businesses — having them import each
// other would make a cycle.
export function formatEventDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// Homepage bookings start and end at set times. Pages already refresh when the
// database changes, but nothing changes in the database when a booking simply
// runs out — so the loaders ask for one extra refresh at the next start/end.

let onDue = null;
let timer = null;
let dueAt = Infinity;

// Called once by lib/liveUpdates with its "refresh everything" function.
export function setHomepageClockHandler(handler) {
  onDue = handler;
}

// Refresh at `when` (a Date, ISO string or ms), unless an earlier one is booked.
export function refreshAt(when) {
  const at = new Date(when).getTime();
  if (!Number.isFinite(at) || at >= dueAt || typeof window === "undefined") return;
  clearTimeout(timer);
  dueAt = at;
  // setTimeout overflows past ~24.8 days; a shorter wait just re-schedules.
  const wait = Math.min(Math.max(at - Date.now(), 0) + 500, 2 ** 31 - 1);
  timer = setTimeout(() => {
    dueAt = Infinity;
    onDue?.();
  }, wait);
}

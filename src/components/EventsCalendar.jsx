import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { events, categoryColors } from "../Data/events";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n) => String(n).padStart(2, "0");

function eventsForDay(y, m, day) {
  const d = new Date(y, m, day);
  const iso = `${y}-${pad(m + 1)}-${pad(day)}`;
  return events.filter(
    (e) => e.iso === iso || (e.recurringWeekday != null && e.recurringWeekday === d.getDay())
  );
}

// Reusable interactive month calendar (used on the See & Do hub and /whats-on).
export default function EventsCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const { y, m } = view;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWeekday = (new Date(y, m, 1).getDay() + 6) % 7; // Monday = 0

  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [startWeekday, daysInMonth]);

  const monthEvents = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      eventsForDay(y, m, d).forEach((e) => list.push({ day: d, e }));
    }
    return list;
  }, [y, m, daysInMonth]);

  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  const isToday = (d) => d && today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} aria-label="Previous month" className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg" style={{ color: "var(--forest)" }}>‹</button>
        <h3 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--forest)" }}>{MONTHS[m]} {y}</h3>
        <button onClick={nextMonth} aria-label="Next month" className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg" style={{ color: "var(--forest)" }}>›</button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-3xl p-3 md:p-5" style={{ boxShadow: "0 10px 40px -22px rgba(28,46,56,0.3)" }}>
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[10px] md:text-xs font-bold uppercase tracking-wide py-2" style={{ color: "var(--leaf)" }}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {cells.map((d, i) => {
            const dayEvents = d ? eventsForDay(y, m, d) : [];
            return (
              <div
                key={i}
                className="min-h-[58px] md:min-h-[96px] rounded-xl p-1.5 md:p-2 flex flex-col gap-1"
                style={{ backgroundColor: d ? "var(--sand)" : "transparent", outline: isToday(d) ? "2px solid var(--leaf)" : "none" }}
              >
                {d && <span className="text-[11px] md:text-sm font-semibold" style={{ color: "var(--forest)" }}>{d}</span>}
                <div className="flex flex-col gap-1 overflow-hidden">
                  {dayEvents.map((e) => (
                    <button
                      key={e.slug}
                      onClick={() => navigate(`/event/${e.slug}`)}
                      title={e.title}
                      className="text-left rounded-md px-1.5 py-1 text-[9px] md:text-[11px] font-semibold leading-tight truncate transition-opacity hover:opacity-80"
                      style={{ backgroundColor: (categoryColors[e.category] || "#2F8C8C") + "22", color: categoryColors[e.category] || "var(--forest)" }}
                    >
                      <span className="hidden md:inline">{e.title}</span>
                      <span className="md:hidden inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColors[e.category] || "var(--forest)" }} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* This month's events list */}
      <h3 className="text-xl font-bold mt-12 mb-5" style={{ color: "var(--forest)" }}>
        {monthEvents.length > 0 ? `Events in ${MONTHS[m]}` : `No events listed in ${MONTHS[m]}`}
      </h3>
      <div className="flex flex-col gap-3">
        {monthEvents.map(({ day, e }) => (
          <Link
            key={`${day}-${e.slug}`}
            to={`/event/${e.slug}`}
            className="group flex items-center gap-4 bg-white rounded-2xl p-3 pr-5 transition-transform hover:-translate-y-0.5"
            style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.28)" }}
          >
            <div className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: "var(--forest)" }}>
              <span className="text-[9px] font-semibold uppercase" style={{ color: "var(--sage)" }}>{MONTHS[m].slice(0, 3)}</span>
              <span className="text-lg font-bold text-white leading-none">{day}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColors[e.category] || "var(--leaf)" }} />
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{e.category}</span>
              </div>
              <p className="font-bold leading-snug truncate" style={{ color: "var(--forest)" }}>{e.title}</p>
              <p className="text-sm truncate" style={{ color: "var(--ink)", opacity: 0.6 }}>{e.location}</p>
            </div>
            <span className="shrink-0 text-xl transition-transform group-hover:translate-x-1" style={{ color: "var(--forest)" }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

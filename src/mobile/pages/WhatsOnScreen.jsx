import { useState, useMemo } from "react";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { events, eventFilters } from "../data/mobileMock";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

function ymd(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function Calendar({ year, month, onMonth, selected, onSelect, eventDates }) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <MobileCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-black/5" aria-label="Previous month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <p className="text-sm font-bold" style={{ color: "#000000" }}>{MONTHS[month]} {year}</p>
        <button onClick={() => onMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-black/5" aria-label="Next month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 mb-1">
        {DOW.map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-center" style={{ color: "#000000" }}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const dateStr = ymd(year, month, d);
          const hasEvent = eventDates.has(dateStr);
          const isSelected = selected === dateStr;
          return (
            <button
              key={i}
              onClick={() => onSelect(isSelected ? null : dateStr)}
              className="relative h-9 flex flex-col items-center justify-center rounded-full mx-auto w-9"
              style={isSelected ? { backgroundColor: "var(--sage)" } : undefined}
            >
              <span className="text-[13px] font-medium" style={{ color: isSelected ? "var(--forest)" : "var(--forest)" }}>{d}</span>
              {hasEvent && !isSelected && (
                <span className="absolute" style={{ bottom: 4, width: 5, height: 5, borderRadius: 5, backgroundColor: "var(--sage)" }} />
              )}
            </button>
          );
        })}
      </div>
    </MobileCard>
  );
}

export default function WhatsOnScreen() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5); // June
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState("All");

  const eventDates = useMemo(() => new Set(events.map((e) => e.date)), []);

  function changeMonth(delta) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y); setSelectedDate(null);
  }

  const listed = useMemo(() => {
    return events.filter((e) => {
      const inMonth = e.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`);
      const matchesDay = selectedDate ? e.date === selectedDate : inMonth;
      const matchesCat = filter === "All" ? true : e.category === filter;
      return matchesDay && matchesCat;
    });
  }, [year, month, selectedDate, filter]);

  return (
    <MobileShell>
      <div className="flex flex-col gap-5 mobile-stagger">
        <div>
          <h1 className="section-heading text-2xl font-bold mb-1.5" style={{ color: "#000000" }}>What's On</h1>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>Find events and activities happening in Maidenhead.</p>
        </div>

        <Calendar
          year={year} month={month} onMonth={changeMonth}
          selected={selectedDate} onSelect={setSelectedDate}
          eventDates={eventDates}
        />

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
          {eventFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
              style={filter === f
                ? { backgroundColor: "var(--leaf)", color: "#ffffff" }
                : { backgroundColor: "rgba(28,46,56,0.06)", color: "rgba(0,0,0,0.65)" }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: "#000000" }}>
            {selectedDate ? "Events on this day" : "Upcoming events"}
          </p>
          {selectedDate && (
            <button onClick={() => setSelectedDate(null)} className="text-xs font-semibold" style={{ color: "var(--leaf)" }}>Clear</button>
          )}
        </div>

        {/* Event listings */}
        <div className="flex flex-col gap-3">
          {listed.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "rgba(0,0,0,0.4)" }}>No events match — try another day or filter.</p>
          ) : (
            listed.map((e) => (
              <MobileCard key={e.id} className="flex items-center gap-3 p-3 active:opacity-90">
                <div className="shrink-0 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: "rgba(82,199,182,0.12)", width: 52, height: 52 }}>
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--leaf)" }}>{e.month}</span>
                  <span className="text-lg font-bold leading-none" style={{ color: "#000000" }}>{e.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{e.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#000000" }}>{e.time}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "#000000" }}>{e.location}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: "rgba(82,199,182,0.12)", color: "var(--leaf)" }}>{e.category}</span>
              </MobileCard>
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}

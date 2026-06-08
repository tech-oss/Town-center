import { useEffect, useState } from "react";
import { planVisit } from "../Data/content";

const { weather } = planVisit;

// WMO weather code → icon + short label
function describe(code) {
  if (code === 0) return { icon: "☀️", label: "Clear" };
  if (code === 1 || code === 2) return { icon: "⛅", label: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", label: "Cloudy" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "Fog" };
  if (code >= 51 && code <= 57) return { icon: "🌦️", label: "Drizzle" };
  if (code >= 61 && code <= 67) return { icon: "🌧️", label: "Rain" };
  if (code >= 71 && code <= 77) return { icon: "🌨️", label: "Snow" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", label: "Showers" };
  if (code === 85 || code === 86) return { icon: "🌨️", label: "Snow" };
  if (code >= 95) return { icon: "⛈️", label: "Storms" };
  return { icon: "🌡️", label: "—" };
}

function dayName(iso, i) {
  if (i === 0) return "Today";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
}

export default function WeatherWidget() {
  const [days, setDays] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${weather.latitude}` +
      `&longitude=${weather.longitude}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=Europe%2FLondon&forecast_days=7`;

    let alive = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!alive) return;
        const d = data.daily;
        const out = d.time.map((iso, i) => ({
          iso,
          name: dayName(iso, i),
          max: Math.round(d.temperature_2m_max[i]),
          min: Math.round(d.temperature_2m_min[i]),
          ...describe(d.weather_code[i]),
        }));
        setDays(out);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      className="rounded-3xl p-5 md:p-6 mb-14 bg-white/70 backdrop-blur"
      style={{ boxShadow: "0 10px 40px -22px rgba(28,46,56,0.35)", border: "1px solid rgba(255,255,255,0.6)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--leaf)" }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p className="text-sm font-bold" style={{ color: "var(--forest)" }}>
            {weather.label} · 7-day forecast
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>
          Local weather
        </span>
      </div>

      {error ? (
        <p className="text-sm text-center py-6" style={{ color: "var(--forest)", opacity: 0.6 }}>
          Weather is unavailable right now — please check back soon.
        </p>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none md:grid md:grid-cols-7 md:gap-3 md:overflow-visible">
          {(days ?? Array.from({ length: 7 })).map((d, i) => (
            <div
              key={d ? d.iso : i}
              className="shrink-0 w-[88px] md:w-auto rounded-2xl flex flex-col items-center gap-1.5 py-4 px-2 transition-transform duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: i === 0 ? "var(--forest)" : "rgba(150,215,211,0.28)" }}
            >
              {d ? (
                <>
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: i === 0 ? "var(--sage)" : "var(--forest)" }}
                  >
                    {d.name}
                  </span>
                  <span className="text-2xl leading-none" aria-hidden="true">{d.icon}</span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: i === 0 ? "rgba(255,255,255,0.7)" : "var(--ink)", opacity: i === 0 ? 1 : 0.6 }}
                  >
                    {d.label}
                  </span>
                  <span className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-bold" style={{ color: i === 0 ? "#fff" : "var(--forest)" }}>
                      {d.max}°
                    </span>
                    <span className="text-xs" style={{ color: i === 0 ? "rgba(255,255,255,0.6)" : "var(--ink)", opacity: i === 0 ? 1 : 0.5 }}>
                      {d.min}°
                    </span>
                  </span>
                </>
              ) : (
                // Skeleton while loading
                <div className="w-full flex flex-col items-center gap-2 animate-pulse">
                  <div className="h-3 w-10 rounded bg-black/10" />
                  <div className="h-6 w-6 rounded-full bg-black/10" />
                  <div className="h-2 w-12 rounded bg-black/10" />
                  <div className="h-4 w-12 rounded bg-black/10" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

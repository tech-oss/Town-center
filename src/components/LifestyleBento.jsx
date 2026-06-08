import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { live } from "../Data/live";

const tiles = live.pillars;

// Shared tile inner content (icon badge, title, bullet lines, link)
function TileContent({ t, big }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.15) 0%, rgba(28,46,56,0.45) 45%, rgba(20,33,42,0.92) 100%)" }} />
      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-7">
        <span className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3"
          style={{ backgroundColor: "rgba(255,255,255,0.16)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
          {t.icon}
        </span>
        <h3 className={`font-bold text-white leading-tight ${big ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}>{t.title}</h3>
        <ul className="mt-3 flex flex-col gap-1.5">
          {t.lines.map((l) => (
            <li key={l} className="text-sm text-white/85">{l}</li>
          ))}
        </ul>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white mt-4">
          {t.link.label}
          <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
        </span>
      </div>
    </>
  );
}

export default function LifestyleBento() {
  // ─── Mobile auto-slider state ───
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const scRef = useRef(null);
  const len = tiles.length;

  // Auto-advance: reschedule a timeout on each index change (self-healing,
  // robust against re-renders/StrictMode). Paused while the user interacts.
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % len), 3500);
    return () => clearTimeout(t);
  }, [idx, len, paused]);

  // Each card is 82% wide → 9% peek on each side. The track translates by
  // 82% per index (deterministic CSS transform — no reliance on native
  // smooth-scroll, so auto-advance animates reliably everywhere).
  const CARD = 82;
  const PEEK = (100 - CARD) / 2;
  const trackStyle = { transform: `translateX(calc(${-idx * CARD}% + ${PEEK}%))` };

  // Touch swipe (left/right) advances the slider and pauses auto-play briefly
  const touchX = useRef(null);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; setPaused(true); };
  const onTouchEnd = (e) => {
    const dx = touchX.current == null ? 0 : e.changedTouches[0].clientX - touchX.current;
    if (dx < -40) setIdx((i) => Math.min(i + 1, len - 1));
    else if (dx > 40) setIdx((i) => Math.max(i - 1, 0));
    touchX.current = null;
    setTimeout(() => setPaused(false), 2500);
  };

  return (
    <div>
      {/* ─────────── Desktop: bento grid ─────────── */}
      <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-5 h-[600px]">
        {tiles.map((t) => (
          <Link key={t.title} to={t.link.to} className={`group relative rounded-3xl overflow-hidden ${t.span}`}
            style={{ boxShadow: "0 14px 50px -26px rgba(28,46,56,0.5)" }}>
            <img src={t.image} alt={t.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <TileContent t={t} big={t.big} />
          </Link>
        ))}
      </div>

      {/* ─────────── Mobile: auto-advancing slider (transform track) ─────────── */}
      <div className="md:hidden">
        <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div ref={scRef} className="flex transition-transform duration-700 ease-out will-change-transform" style={trackStyle}>
            {tiles.map((t) => (
              <div key={t.title} className="w-[82%] shrink-0 px-1.5">
                <Link to={t.link.to} className="group relative block rounded-3xl overflow-hidden aspect-[3/4]"
                  style={{ boxShadow: "0 16px 50px -24px rgba(28,46,56,0.55)" }}>
                  <img src={t.image} alt={t.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  <TileContent t={t} big />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5">
          {tiles.map((t, i) => (
            <button
              key={t.title}
              aria-label={`Go to ${t.title}`}
              onClick={() => { setPaused(true); setIdx(i); setTimeout(() => setPaused(false), 4000); }}
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: i === idx ? 24 : 8, backgroundColor: i === idx ? "var(--leaf)" : "rgba(28,46,56,0.25)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { live } from "../Data/live";

const tabs = live.designedAroundYou;

function Stat({ s }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2" style={{ backgroundColor: "var(--mint)" }}>{s.icon}</span>
      <span className="text-xl font-bold leading-none" style={{ color: "var(--forest)" }}>{s.value}</span>
      <span className="text-[11px] mt-1 leading-tight" style={{ color: "var(--ink)", opacity: 0.6 }}>{s.label}</span>
    </div>
  );
}

export default function DesignedAroundYou() {
  const [tab, setTab] = useState(0);
  const t = tabs[tab];

  return (
    <section className="pb-16 md:pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="mb-7">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: "var(--forest)" }}>Designed around you</h2>
          <p className="text-base mt-2" style={{ color: "var(--ink)", opacity: 0.7 }}>From nature to nightlife, everything is within easy reach.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-none">
          {tabs.map((x, i) => (
            <button key={x.tab} onClick={() => setTab(i)}
              className="shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors"
              style={i === tab ? { backgroundColor: "var(--forest)", color: "#fff" } : { backgroundColor: "#fff", color: "var(--forest)" }}>
              {x.tab}
            </button>
          ))}
        </div>

        {/* ─────────── Desktop: info card + image gallery ─────────── */}
        <div className="hidden md:grid grid-cols-2 gap-5 h-[460px]">
          {/* Info card */}
          <div className="bg-white rounded-3xl p-9 flex flex-col justify-center overflow-hidden h-full" style={{ boxShadow: "0 12px 44px -24px rgba(28,46,56,0.3)" }}>
            <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5" style={{ backgroundColor: "var(--mint)" }}>{t.stats[0].icon}</span>
            <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--forest)" }}>{t.title}</h3>
            <p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: "var(--ink)", opacity: 0.78 }}>{t.body}</p>
            <div className="grid grid-cols-3 gap-4 pt-6" style={{ borderTop: "1px solid rgba(28,46,56,0.1)" }}>
              {t.stats.map((s) => <Stat key={s.label} s={s} />)}
            </div>
          </div>

          {/* Gallery: 1 large + 3 small (heights pinned to 460px) */}
          <div className="grid grid-cols-[1.5fr_1fr] gap-3.5 h-full min-h-0">
            <div className="rounded-3xl overflow-hidden h-full min-h-0">
              <img src={t.images[0]} alt={t.title} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-rows-3 gap-3.5 h-full min-h-0">
              {t.images.slice(1, 4).map((src, i) => (
                <div key={i} className="rounded-2xl overflow-hidden min-h-0">
                  <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─────────── Mobile: card with stats + dots ─────────── */}
        <div className="md:hidden">
          <div className="bg-white rounded-3xl overflow-hidden flex" style={{ boxShadow: "0 12px 44px -24px rgba(28,46,56,0.32)" }}>
            <div className="w-32 shrink-0 self-stretch">
              <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 p-5">
              <h3 className="text-lg font-bold mb-1.5" style={{ color: "var(--forest)" }}>{t.title}</h3>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--ink)", opacity: 0.72 }}>{t.body}</p>
              <div className="flex gap-4">
                {t.stats.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <span className="text-base font-bold leading-none" style={{ color: "var(--forest)" }}>{s.value}</span>
                    <span className="text-[10px] mt-1 leading-tight" style={{ color: "var(--ink)", opacity: 0.6 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dots (synced to active tab) */}
          <div className="flex justify-center gap-2 mt-5">
            {tabs.map((x, i) => (
              <button key={x.tab} aria-label={`Show ${x.tab}`} onClick={() => setTab(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: i === tab ? 24 : 8, backgroundColor: i === tab ? "var(--leaf)" : "rgba(28,46,56,0.25)" }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

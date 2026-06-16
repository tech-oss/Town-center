import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { live, buildings } from "../Data/live";
import LocationMap from "./LocationMap";
import LifestyleBento from "./LifestyleBento";
import DesignedAroundYou from "./DesignedAroundYou";

export default function LivePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* Hero */}
      <section className="relative h-[58vh] min-h-[400px] w-full overflow-hidden">
        <img src={live.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,46,56,0.3) 0%, rgba(28,46,56,0.8) 100%)" }} />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end pb-14">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--mint)" }}>{live.hero.eyebrow}</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-3xl">{live.hero.title}</h1>
          <p className="text-lg text-white/85 mt-4 max-w-2xl leading-relaxed">{live.hero.intro}</p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link to="/live/for-sale" className="px-6 py-3 rounded-full font-semibold transition-transform hover:scale-105" style={{ backgroundColor: "var(--sage)", color: "var(--forest)" }}>Properties For Sale</Link>
            <Link to="/live/for-rent" className="px-6 py-3 rounded-full font-semibold text-white transition-colors" style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}>Properties For Rent</Link>
          </div>
        </div>
      </section>

      {/* Lifestyle bento (desktop) / auto-slider (mobile) */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>Lifestyle</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: "var(--forest)" }}>Life in Maidenhead</h2>
          </div>
          <LifestyleBento />
        </div>
      </section>

      {/* Designed Around You */}
      <DesignedAroundYou />

      {/* Our Buildings */}
      <section className="pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight" style={{ color: "var(--forest)" }}>Our buildings</h2>
          <p className="text-base mb-10 max-w-2xl" style={{ color: "var(--ink)", opacity: 0.7 }}>Explore Maidenhead's leading residential developments.</p>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {buildings.map((b) => (
              <Link key={b.slug} to={`/live/building/${b.slug}`} className="group relative rounded-3xl overflow-hidden block aspect-[3/4]"
                style={{ boxShadow: "0 10px 40px -18px rgba(28,46,56,0.4)" }}>
                <img src={b.image} alt={b.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 35%, rgba(28,46,56,0.88) 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--sage)" }}>{b.developer}</p>
                  <h3 className="text-2xl font-bold text-white">{b.name}</h3>
                  <p className="text-sm text-white/80 mt-1">{b.tagline}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white mt-3">
                    Explore <span className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--sage)" }}>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Location map */}
      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Where you'll live" note="Maidenhead, Berkshire — on the Elizabeth Line, 18 minutes from London Paddington." query="Maidenhead, Berkshire" />
        </div>
      </section>

      {/* Book a Viewing CTA */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto rounded-3xl p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6" style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}>
          <div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Book a viewing</h2>
            <p className="text-white/80 max-w-xl">Speak to the Maidenhead Residential team to arrange a viewing or find out more about availability.</p>
          </div>
          <Link to="/live/enquire" className="shrink-0 text-center px-8 py-4 rounded-full font-semibold transition-transform hover:scale-105" style={{ backgroundColor: "var(--sage)", color: "var(--forest)" }}>Enquire Now</Link>
        </div>
      </section>
    </div>
  );
}

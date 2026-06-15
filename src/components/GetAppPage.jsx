import { Link } from "react-router-dom";
import { useEffect } from "react";
import { header } from "../Data/content";
import AppBadges from "./AppBadges";

const features = [
  { title: "Local deals & offers", text: "Exclusive promotions from independent shops, cafés and restaurants across town." },
  { title: "What's on", text: "Community events, markets and festivals — never miss what's happening in Maidenhead." },
  { title: "Discover & support local", text: "Find places to visit and easy ways to back the businesses that make the town special." },
  { title: "Town updates", text: "The latest news, openings and updates from around the town centre, all in one feed." },
];

export default function GetAppPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 md:px-12 py-16 md:py-24" style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 85% 15%, rgba(82,199,182,0.3) 0%, transparent 70%)" }} />
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div>
            <nav className="mb-5 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--sage)" }}>
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2 opacity-50">/</span>
              <span className="text-white">Get the App</span>
            </nav>
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--sage)" }}>The Maidenhead App</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] text-white mb-6">
              Get the Maidenhead App
            </h1>
            <div className="flex flex-col gap-4 mb-8">
              <p className="text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                Make the most of everything the town has to offer, all from one convenient place.
              </p>
              <p className="text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
                Designed to help you stay connected and informed, the Maidenhead App brings together local
                deals, special promotions, community events, and the latest town updates in a simple,
                easy-to-use platform. Whether you're looking for places to visit, ways to support local
                businesses, a new home or what's happening around town, the app helps you discover more of
                Maidenhead every day.
              </p>
            </div>
            <AppBadges className="flex-col sm:flex-row" />
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center md:justify-end">
            <div className="relative w-[260px] h-[530px] rounded-[2.5rem] p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]" style={{ backgroundColor: "#0d1a20", border: "1px solid rgba(255,255,255,0.12)" }}>
              {/* notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full" style={{ backgroundColor: "#0d1a20" }} />
              {/* screen */}
              <div className="w-full h-full rounded-[2rem] overflow-hidden flex flex-col" style={{ backgroundColor: "var(--sand)" }}>
                <div className="px-5 pt-10 pb-6 flex flex-col items-center text-center" style={{ background: "linear-gradient(160deg, var(--forest), var(--teal-deep))" }}>
                  <img src={header.markSrc} alt="" className="h-10 w-auto mb-1" />
                  <span className="text-white text-sm font-semibold tracking-[0.26em]">{header.logo}</span>
                  <span className="text-[8px] font-semibold uppercase tracking-[0.12em] mt-1" style={{ color: "var(--sage)" }}>{header.tagline}</span>
                </div>
                <div className="flex-1 p-4 flex flex-col gap-3">
                  {["Today's offers", "What's on near you", "New this week", "Explore the town"].map((t, i) => (
                    <div key={t} className="rounded-2xl p-3 bg-white flex items-center gap-3" style={{ boxShadow: "0 6px 20px -14px rgba(28,46,56,0.4)" }}>
                      <div className="w-9 h-9 rounded-xl shrink-0" style={{ backgroundColor: i % 2 ? "var(--mint)" : "var(--leaf)" }} />
                      <div className="flex-1">
                        <div className="h-2.5 rounded-full mb-1.5" style={{ backgroundColor: "var(--forest)", opacity: 0.85, width: "70%" }} />
                        <div className="h-2 rounded-full" style={{ backgroundColor: "var(--ink)", opacity: 0.18, width: "90%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold mb-10 leading-tight" style={{ color: "var(--forest)" }}>
            Everything Maidenhead, in your pocket
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 6px 28px -16px rgba(28,46,56,0.28)" }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--forest)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink)", opacity: 0.75 }}>{f.text}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6" style={{ backgroundColor: "var(--forest)", color: "white" }}>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Download today</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--mint)" }}>Free to download on iOS and Android.</p>
            </div>
            <AppBadges className="flex-col sm:flex-row" />
          </div>
        </div>
      </section>
    </div>
  );
}

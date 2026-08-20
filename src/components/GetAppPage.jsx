import { Link } from "react-router-dom";
import { useEffect } from "react";
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
          {/* Copy — App Store/Play badges are their own grid item below (not
              nested here) so mobile can stack image above them while desktop
              keeps this whole block, image and badges in their usual spots
              via explicit column/row placement. */}
          <div className="md:col-start-1 md:row-start-1">
            <nav className="mb-5 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--sage)" }}>
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2 opacity-50">/</span>
              <span className="text-white">Get the App</span>
            </nav>
            <p className="section-eyebrow mb-4" style={{ color: "var(--sage)" }}>The Maidenhead App</p>
            <h1 className="hero-title uppercase text-3xl md:text-5xl lg:text-6xl leading-tight text-white mb-6" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
              Get the Maidenhead App
            </h1>
            <div className="flex flex-col gap-4">
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
          </div>

          {/* App-in-use photo — soft-masked so its edges dissolve into the
              hero's own dark gradient rather than sitting as a hard-edged
              rectangle photo. Mobile order: copy text, then photo, then
              badges (per request); desktop keeps it beside the copy,
              spanning both rows. */}
          <div className="flex justify-center md:justify-end md:col-start-2 md:row-start-1 md:row-span-2">
            <div className="relative w-full max-w-[560px] h-[380px] md:h-[520px]">
              <img
                src="/images/get-app/app-hero.jpg"
                alt="Using the Maidenhead app on a phone"
                className="w-full h-full"
                style={{ objectFit: "cover", objectPosition: "62% 42%" }}
              />
            </div>
          </div>

          <div className="mt-8 md:mt-0 md:col-start-1 md:row-start-2">
            <AppBadges className="flex-col sm:flex-row" />
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-heading text-2xl md:text-4xl font-bold mb-10 leading-tight" style={{ color: "#000000" }}>
            Everything Maidenhead, in your pocket
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 6px 28px -16px rgba(28,46,56,0.28)" }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: "#000000" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{f.text}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6" style={{ backgroundColor: "var(--forest)", color: "white" }}>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>Download today</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#ffffff" }}>Free to download on iOS and Android.</p>
            </div>
            <AppBadges className="flex-col sm:flex-row" />
          </div>
        </div>
      </section>
    </div>
  );
}

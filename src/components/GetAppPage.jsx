import { Link } from "react-router-dom";
import useSiteSection from "../hooks/useSiteSection";
import { useEffect } from "react";
import AppBadges from "./AppBadges";
import SmartImage from "./SmartImage";


export default function GetAppPage() {
  // Everything on this page is edited in Site Content → Get the App.
  const copy = useSiteSection("get-the-app");
  const intro = Array.isArray(copy.intro) ? copy.intro.filter(Boolean) : [copy.intro].filter(Boolean);
  const features = (copy.features ?? []).filter((f) => f?.title || f?.text);
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
            <p className="section-eyebrow mb-4" style={{ color: "var(--sage)" }}>{copy.eyebrow}</p>
            <h1 className="hero-title uppercase text-3xl md:text-5xl lg:text-6xl leading-tight text-white mb-6" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
              {copy.title}
            </h1>
            <div className="flex flex-col gap-4">
              {intro.map((p, i) => (
                <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: i === 0 ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.78)" }}>{p}</p>
              ))}
            </div>
          </div>

          {/* App-in-use photo — soft-masked so its edges dissolve into the
              hero's own dark gradient rather than sitting as a hard-edged
              rectangle photo. Mobile order: copy text, then photo, then
              badges (per request); desktop keeps it beside the copy,
              spanning both rows. */}
          <div className="flex justify-center md:justify-end md:col-start-2 md:row-start-1 md:row-span-2">
            <div className="relative w-full max-w-[560px] h-[380px] md:h-[520px]">
              {copy.hero && (
                <SmartImage
                  src={copy.hero}
                  alt="Using the Maidenhead app on a phone"
                  size="hero"
                  eager
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="w-full h-full object-cover"
                />
              )}
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
            {copy.featuresHeading}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 6px 28px -16px rgba(28,46,56,0.28)" }}>
                <h3 className="font-bold text-lg mb-2" style={{ color: "#000000" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{f.text}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6" style={{ backgroundColor: "var(--forest)", color: "white" }}>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>{copy.ctaTitle}</h2>
              {copy.ctaText && <p className="text-sm leading-relaxed" style={{ color: "#ffffff" }}>{copy.ctaText}</p>}
            </div>
            <AppBadges className="flex-col sm:flex-row" />
          </div>
        </div>
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useEffect } from "react";
import useSiteSection from "../hooks/useSiteSection";
import TextPageHero from "./TextPageHero";

// Everything on this page is edited in Site Content → Work With Us.
export default function PressPage() {
  const copy = useSiteSection("work-with-us");
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const cards = (copy.cards ?? []).filter((c) => c?.title || c?.body);
  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      <TextPageHero copy={copy} />

      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <nav className="mb-10 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>{copy.title}</span>
          </nav>

          <div className="flex flex-col gap-6 mb-12">
            {(copy.introParagraphs ?? []).filter(Boolean).map((p, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{p}</p>
            ))}
          </div>

          {cards.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-5 mb-14">
              {cards.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 6px 28px -16px rgba(28,46,56,0.28)" }}>
                  <h3 className="font-bold text-lg mb-2" style={{ color: "#000000" }}>{c.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{c.body}</p>
                </div>
              ))}
            </div>
          )}

          {(copy.visibilityHeading || copy.visibilityParagraphs?.length > 0) && (
            <div className="mb-14">
              {copy.visibilityHeading && (
                <h2 className="section-heading text-2xl md:text-3xl font-bold mb-8" style={{ color: "#000000" }}>{copy.visibilityHeading}</h2>
              )}
              <div className="flex flex-col gap-5">
                {(copy.visibilityParagraphs ?? []).filter(Boolean).map((p, i) => (
                  <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{p}</p>
                ))}
              </div>
            </div>
          )}

          {copy.ctaTitle && (
            <div className="rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6"
              style={{ backgroundColor: "var(--forest)", color: "white" }}>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">{copy.ctaTitle}</h2>
                {copy.ctaText && <p className="text-sm leading-relaxed text-white">{copy.ctaText}</p>}
              </div>
              <div className="shrink-0 flex flex-col items-stretch gap-3">
              {copy.ctaEmail && (
                <a href={`mailto:${copy.ctaEmail}`}
                  className="shrink-0 px-7 py-3.5 rounded-full font-semibold text-sm text-center transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--leaf)", color: "white" }}>
                  {copy.ctaEmail}
                </a>
              )}
              {/* Optional second button set in Site Content, directly under
                  the first. */}
              {copy.ctaExtraLabel && copy.ctaExtraUrl && (
                <a href={copy.ctaExtraUrl}
                  className="shrink-0 px-7 py-3.5 rounded-full font-semibold text-sm text-center transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--leaf)", color: "white" }}>
                  {copy.ctaExtraLabel}
                </a>
              )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

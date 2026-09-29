import { Link } from "react-router-dom";
import { useEffect } from "react";
import useSiteSection from "../hooks/useSiteSection";
import TextPageHero from "./TextPageHero";

// Everything on this page is edited in Site Content → About / Our Story.
export default function OurStoryPage() {
  const copy = useSiteSection("about");
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      <TextPageHero copy={copy} />

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <nav className="mb-10 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>{copy.title}</span>
          </nav>

          <div className="flex flex-col gap-7">
            {(copy.body ?? []).filter(Boolean).map((p, i) => {
              // The council disclaimer stands out, as it always has.
              const isDisclaimer = /not affiliated/i.test(p);
              return (
                <p key={i} className={`text-base md:text-lg leading-relaxed ${isDisclaimer ? "italic" : ""}`}
                  style={{ color: isDisclaimer ? "var(--forest)" : "#000000", fontWeight: isDisclaimer ? 500 : undefined }}>
                  {p}
                </p>
              );
            })}
          </div>

          {copy.ctaTitle && (
            <div className="mt-16 rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6"
              style={{ backgroundColor: "var(--forest)", color: "white" }}>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">{copy.ctaTitle}</h2>
                {copy.ctaText && <p className="text-sm leading-relaxed text-white">{copy.ctaText}</p>}
              </div>
              {copy.ctaEmail && (
                <a href={`mailto:${copy.ctaEmail}`}
                  className="shrink-0 px-7 py-3.5 rounded-full font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--leaf)", color: "white" }}>
                  {copy.ctaButton || copy.ctaEmail}
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

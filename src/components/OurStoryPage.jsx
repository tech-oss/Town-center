import { Link } from "react-router-dom";
import { useEffect } from "react";
import useSiteSection from "../hooks/useSiteSection";
import TextPageHero from "./TextPageHero";
import CtaCard from "./CtaCard";

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
            <CtaCard className="mt-16" title={copy.ctaTitle} text={copy.ctaText}
              buttons={[
                { label: copy.ctaEmail && (copy.ctaButton || copy.ctaEmail), href: copy.ctaEmail && `mailto:${copy.ctaEmail}` },
                // Optional second button set in Site Content.
                { label: copy.ctaExtraLabel, href: copy.ctaExtraUrl },
              ]} />
          )}
        </div>
      </section>
    </div>
  );
}

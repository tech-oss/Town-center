import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LEGAL } from "../Data/legal";
import LegalDocument from "./LegalDocument";

// /privacy and /terms — the footer has always linked to them, but neither
// existed. `doc` is "privacy" or "terms".
export default function LegalPage({ doc }) {
  const { title, html } = LEGAL[doc];
  useEffect(() => {
    window.scrollTo(0, 0);
    const previous = document.title;
    document.title = `${title} — Maidenhead`;
    return () => { document.title = previous; };
  }, [title]);
  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      <section className="px-6 md:px-12 pt-14 pb-12 md:pt-20 md:pb-16" style={{ backgroundColor: "var(--forest)" }}>
        <div className="max-w-3xl mx-auto">
          <nav className="mb-6 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--sage)" }}>
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">{title}</span>
          </nav>
          <span className="section-eyebrow" style={{ color: "var(--sage)" }}>Legal</span>
          <h1 className="hero-title uppercase text-3xl md:text-5xl text-white mt-3">{title}</h1>
          <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.8)" }}>Maidenhead.com and The Maidenhead App</p>
        </div>
      </section>
      <section className="px-6 md:px-12 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <LegalDocument html={html} />
        </div>
      </section>
    </div>
  );
}

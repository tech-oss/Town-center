import { useEffect } from "react";
import { Link } from "react-router-dom";
import LegalDocument from "./LegalDocument";
import useLegalDocument from "../hooks/useLegalDocument";

// /privacy and /terms. `doc` is "privacy" or "terms"; the text is the version
// admin edits in Site Content (hooks/useLegalDocument).
export default function LegalPage({ doc }) {
  const { title, html, loading } = useLegalDocument(doc);
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
          {loading ? <LegalLoading /> : <LegalDocument html={html} />}
        </div>
      </section>
    </div>
  );
}

// Grey lines while the page's text loads, so the previous version never
// flashes up before the current one.
export function LegalLoading() {
  return (
    <div className="flex flex-col gap-3 animate-pulse" aria-label="Loading">
      {[60, 100, 92, 96, 70, 100, 88].map((w, i) => (
        <div key={i} className="h-3.5 rounded bg-black/[0.07]" style={{ width: `${w}%`, marginTop: i === 4 ? 16 : 0 }} />
      ))}
    </div>
  );
}

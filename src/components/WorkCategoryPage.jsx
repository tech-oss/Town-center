import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { work } from "../Data/work";

// Lightweight placeholder for the seven Work marketplaces.
// The full listings/posting flows are built per-category in a later phase.
export default function WorkCategoryPage() {
  const { category } = useParams();
  const cat = work.categories.find((c) => c.id === category);
  useEffect(() => { window.scrollTo(0, 0); }, [category]);
  if (!cat) return <Navigate to="/work" replace />;

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      <section className="relative overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
        <img src={work.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(20,33,42,0.95), rgba(20,33,42,0.7))" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-14 md:py-20">
          <nav className="mb-4 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--sage)" }}>
            <Link to="/work" className="hover:text-white">Work</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">{cat.title}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{cat.title}</h1>
          <p className="text-base md:text-lg text-white/80 mt-3 max-w-xl">{cat.desc} in and around Maidenhead.</p>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center rounded-3xl p-10 md:p-14 bg-white" style={{ boxShadow: "0 12px 44px -24px rgba(28,46,56,0.3)" }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl" style={{ backgroundColor: "var(--mint)" }}>🌱</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "var(--forest)" }}>Coming soon</h2>
          <p className="text-base leading-relaxed mb-7" style={{ color: "var(--ink)", opacity: 0.78 }}>
            We're building Maidenhead's {cat.title.toLowerCase()} marketplace — a hyper-local, community-first place to connect.
            Want to be first to list or be notified when it goes live?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#newsletter" className="px-7 py-3.5 rounded-full font-semibold text-white transition-colors" style={{ backgroundColor: "var(--leaf)" }}>Register your interest</a>
            <Link to="/work" className="px-7 py-3.5 rounded-full font-semibold transition-colors" style={{ border: "1.5px solid var(--forest)", color: "var(--forest)" }}>Back to Work</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

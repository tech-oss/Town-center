import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { work, tagColors } from "../Data/work";

/* ── Icons (Lucide-style line icons) ── */
const ic = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
const CategoryIcon = ({ name }) => {
  switch (name) {
    case "briefcase": return (<svg {...ic}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>);
    case "tools": return (<svg {...ic}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>);
    case "building": return (<svg {...ic}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4M10 10h4M10 14h4M10 18h4" /></svg>);
    case "handshake": return (<svg {...ic}><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></svg>);
    case "services": return (<svg {...ic}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M9 7h6M9 11h6" /></svg>);
    case "cap": return (<svg {...ic}><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2.5 9 2.5 12 0v-5" /><path d="M22 10v6" /></svg>);
    case "people": return (<svg {...ic}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
    default: return null;
  }
};

const mic = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
const MetaIcon = ({ name }) => {
  switch (name) {
    case "badge": return (<svg {...mic}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>);
    case "pin": return (<svg {...mic}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>);
    case "pound": return (<svg {...mic}><path d="M18 7c0-2.2-1.8-4-4-4s-4 1.8-4 4v3" /><path d="M7 13h7" /><path d="M7 21h11a4 4 0 0 0-4-4H9a4 4 0 0 0 0-8" /></svg>);
    case "tag": return (<svg {...mic}><path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" /><circle cx="7.5" cy="7.5" r="1" /></svg>);
    case "clock": return (<svg {...mic}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
    case "award": return (<svg {...mic}><circle cx="12" cy="8" r="6" /><path d="m9 13.5-1 8 4-2 4 2-1-8" /></svg>);
    case "calendar": return (<svg {...mic}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>);
    default: return null;
  }
};

export default function WorkPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [query, setQuery] = useState("");

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
        <img src={work.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(20,33,42,0.95) 0%, rgba(20,33,42,0.78) 45%, rgba(20,33,42,0.55) 100%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-12 md:pt-16 pb-10 md:pb-14">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--sage)" }}>{work.hero.eyebrow}</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-[1.05] max-w-3xl">{work.hero.title}</h1>
          <p className="text-base md:text-lg text-white/80 mt-5 max-w-xl leading-relaxed">{work.hero.intro}</p>

          {/* Search bar */}
          <form onSubmit={(e) => e.preventDefault()} className="mt-8 flex flex-col md:flex-row gap-3 md:gap-2 md:bg-white md:rounded-2xl md:p-2 md:shadow-2xl max-w-4xl">
            <div className="flex items-center gap-2 flex-1 bg-white rounded-xl md:rounded-lg px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a8a90" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search jobs, projects, services..."
                className="flex-1 outline-none text-sm bg-transparent" style={{ color: "var(--ink)" }} />
            </div>
            <select className="bg-white rounded-xl md:rounded-lg px-4 py-3 text-sm outline-none md:w-44" style={{ color: "var(--ink)" }} defaultValue="">
              <option value="">All Categories</option>
              {work.categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <select className="bg-white rounded-xl md:rounded-lg px-4 py-3 text-sm outline-none md:w-44" style={{ color: "var(--ink)" }} defaultValue="Maidenhead">
              {work.locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button type="submit" className="rounded-xl md:rounded-lg px-7 py-3 font-semibold text-white transition-colors" style={{ backgroundColor: "var(--leaf)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Category tiles ── */}
      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-5">
            {work.categories.map((c) => (
              <Link key={c.id} to={`/work/${c.id}`}
                className="group bg-white rounded-2xl p-5 md:p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5"
                style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)", border: "1px solid rgba(28,46,56,0.06)" }}>
                <span className="mb-3 transition-transform duration-300 group-hover:scale-110" style={{ color: "var(--leaf)" }}>
                  <CategoryIcon name={c.icon} />
                </span>
                <span className="font-bold text-sm md:text-base leading-tight" style={{ color: "var(--forest)" }}>{c.title}</span>
                <span className="hidden md:block text-xs mt-1.5 leading-snug" style={{ color: "var(--ink)", opacity: 0.6 }}>{c.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Opportunities ── */}
      <section className="pb-14 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--forest)" }}>Featured Opportunities</h2>
            <Link to="/work/jobs" className="group inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--leaf)" }}>
              View All <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {work.featured.map((f, i) => {
              const c = tagColors[f.type] ?? { bg: "#E5E7EB", text: "#374151" };
              return (
                <Link key={i} to={f.to} className="group bg-white rounded-2xl p-5 flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)", border: "1px solid rgba(28,46,56,0.06)" }}>
                  <span className="self-start text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3" style={{ backgroundColor: c.bg, color: c.text }}>
                    {f.tag}
                  </span>
                  <h3 className="font-bold text-lg leading-snug mb-3" style={{ color: "var(--forest)" }}>{f.title}</h3>
                  <ul className="flex flex-col gap-2 mt-auto">
                    {f.meta.map((m, mi) => (
                      <li key={mi} className="flex items-center gap-2 text-xs" style={{ color: "var(--ink)", opacity: 0.7 }}>
                        <span style={{ color: "var(--leaf)" }}><MetaIcon name={m.icon} /></span> {m.label}
                      </li>
                    ))}
                  </ul>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="px-6 md:px-12 pb-16 md:pb-20">
        <div className="max-w-6xl mx-auto rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6" style={{ backgroundColor: "var(--forest)" }}>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1.5">Are you a business or freelancer?</h2>
            <p className="text-white/75 max-w-xl">Post a job, project or service and connect with local talent.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link to="/work/jobs" className="text-center px-7 py-3.5 rounded-full font-semibold text-white transition-transform hover:scale-105" style={{ backgroundColor: "var(--leaf)" }}>
              Post a Job
            </Link>
            <Link to="/work/freelance" className="text-center px-7 py-3.5 rounded-full font-semibold text-white transition-colors" style={{ border: "1.5px solid rgba(255,255,255,0.5)" }}>
              Post a Project
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

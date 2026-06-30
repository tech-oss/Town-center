import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { aboutPage, aboutStats } from "../data/mobileMock";

export default function AboutScreen() {
  return (
    <MobileShell noPadding>
      <div className="flex flex-col">
        <div className="relative">
          <img src={aboutPage.image} alt="" className="w-full h-52 object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0.35) 0%, rgba(12,20,24,0) 40%, var(--forest) 100%)" }} />
          <button onClick={() => window.history.back()} className="absolute top-3 left-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1 className="absolute bottom-4 left-5 text-2xl font-bold text-white">{aboutPage.title}</h1>
        </div>

        <div className="px-5 pt-5 flex flex-col gap-6 pb-6 mobile-stagger">
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>{aboutPage.body}</p>

          <div className="grid grid-cols-3 gap-3">
            {aboutStats.map((s) => (
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-xl font-bold" style={{ color: "var(--sage)" }}>{s.value}</p>
                <p className="text-[10px] mt-1 leading-tight" style={{ color: "rgba(255,255,255,0.6)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <Link to="/mobile/explore" className="w-full text-center py-3.5 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "var(--sage)", color: "var(--forest)" }}>
            Explore Maidenhead
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}

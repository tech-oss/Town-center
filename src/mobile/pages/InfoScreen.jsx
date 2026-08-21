import { useParams } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { infoPages } from "../data/mobileMock";

export default function InfoScreen() {
  const { topic } = useParams();
  const page = infoPages[topic];

  if (!page) {
    return (
      <MobileShell title="Information" onBack>
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>This page could not be found.</p>
      </MobileShell>
    );
  }

  return (
    <MobileShell noPadding>
      <div className="flex flex-col">
        <div className="relative">
          <img src={page.image} alt="" className="w-full h-48 object-cover" />
          <button onClick={() => window.history.back()} className="absolute top-3 left-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        </div>

        <div className="px-5 -mt-1 relative flex flex-col gap-4 pb-6 mobile-stagger">
          <h1 className="text-2xl font-bold" style={{ color: "#000000" }}>{page.title}</h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.65)" }}>{page.intro}</p>

          {page.blocks.map((b) => (
            <MobileCard key={b.heading} className="p-4">
              <p className="text-sm font-bold mb-1.5" style={{ color: "#000000" }}>{b.heading}</p>
              <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{b.body}</p>
            </MobileCard>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}

import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { planItems } from "../data/mobileMock";

function PlanIcon({ name }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "var(--leaf)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "train": return <svg {...p}><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M5 11h14M9 16l-2 4M15 16l2 4" /><circle cx="9" cy="13.5" r="0.5" fill="var(--leaf)" stroke="none" /><circle cx="15" cy="13.5" r="0.5" fill="var(--leaf)" stroke="none" /></svg>;
    case "bed": return <svg {...p}><path d="M3 18v-6h18v6M3 12V7M21 12v6M3 12h18M7 12V9h6v3" /></svg>;
    case "access": return <svg {...p}><circle cx="12" cy="5" r="1.5" /><path d="M12 7v5m0 0 4 1m-4-1-4 1m4 4 2 4m-2-4-2 4" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-5M12 8h.01" /></svg>;
  }
}

export default function PlanScreen() {
  return (
    <MobileShell title="Plan Your Visit" onBack>
      <div className="flex flex-col gap-4 mobile-stagger">
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>All the information you need for a great visit to Maidenhead.</p>

        {planItems.map((item) => (
          <Link key={item.id} to={item.to}>
            <MobileCard className="flex items-center gap-3.5 p-4 active:opacity-90">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(82,199,182,0.12)" }}>
                <PlanIcon name={item.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: "#000000" }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "#000000" }}>{item.blurb}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </MobileCard>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}

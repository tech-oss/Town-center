import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";

export default function WorkScreen() {
  return (
    <MobileShell title="Work" onBack backFallback="/mobile/explore">
      <div className="flex flex-col items-center text-center gap-5 pt-6 mobile-stagger">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{ backgroundColor: "rgba(28,46,56,0.045)", color: "var(--leaf)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--leaf)" }} />
          Coming Soon
        </span>

        <h1 className="text-2xl font-bold leading-tight" style={{ color: "#000000" }}>
          A New Home For Work In Maidenhead
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>
          We're building a home for local jobs, freelance projects and business
          opportunities. It isn't quite ready to launch — but it's on its way.
        </p>

        <Link
          to="/mobile/explore"
          className="w-full text-center py-3.5 rounded-2xl text-sm font-bold active:opacity-80 mt-2"
          style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
        >
          Explore Maidenhead Instead
        </Link>
      </div>
    </MobileShell>
  );
}

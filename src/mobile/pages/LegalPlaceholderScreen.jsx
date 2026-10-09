import MobileShell from "../components/MobileShell";
import LegalDocument from "../../components/LegalDocument";
import { LEGAL } from "../../Data/legal";

// The app's Privacy Policy and Terms of Use screens — the same documents the
// website shows at /privacy and /terms. `doc` is "privacy" or "terms".
export default function LegalPlaceholderScreen({ doc }) {
  const { title, html } = LEGAL[doc];
  return (
    <MobileShell title={title} onBack backFallback="/mobile/explore" noPadding>
      <div className="flex flex-col">
        <div className="relative px-6 py-12 text-center overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 90% 70% at 50% 120%, rgba(47,164,164,0.32) 0%, transparent 70%)" }}
          />
          <span className="relative section-eyebrow" style={{ color: "var(--sage)" }}>Legal</span>
          <h1 className="relative text-2xl font-bold leading-tight mt-3 text-white">{title}</h1>
          <p className="relative text-xs mt-2" style={{ color: "rgba(255,255,255,0.8)" }}>Maidenhead.com and The Maidenhead App</p>
        </div>
        <div className="px-5 pt-4 pb-10">
          <LegalDocument html={html} compact />
        </div>
      </div>
    </MobileShell>
  );
}

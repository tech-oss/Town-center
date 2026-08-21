import MobileShell from "../components/MobileShell";

// Neither Privacy Policy nor Terms & Conditions actually exist on the
// website yet (the footer links to /privacy and /terms, but both routes
// fall through with no real content) — this is a placeholder so the entry
// stays in the app rather than inventing legal copy, and can be swapped for
// the real page the moment the website has one.
export default function LegalPlaceholderScreen({ title }) {
  return (
    <MobileShell title={title} onBack backFallback="/mobile/explore" noPadding>
      <div className="flex flex-col">
        <div className="relative px-6 py-14 text-center overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 90% 70% at 50% 120%, rgba(47,164,164,0.32) 0%, transparent 70%)" }}
          />
          <span className="relative section-eyebrow" style={{ color: "var(--sage)" }}>Legal</span>
          <h1 className="relative text-2xl font-bold leading-tight mt-3 text-white">{title}</h1>
        </div>

        <div className="px-5 pt-10 pb-10 flex flex-col items-center text-center gap-3 mobile-stagger">
          <span className="w-14 h-14 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: "var(--mint)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          </span>
          <h2 className="text-lg font-bold" style={{ color: "#000000" }}>Coming Soon</h2>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#000000", opacity: 0.7 }}>
            This page hasn't been published yet. Check back soon, or get in touch if you have a question in the meantime.
          </p>
          <a
            href="mailto:hello@maidenhead.com"
            className="mt-3 px-5 py-3 rounded-full text-sm font-bold active:opacity-85"
            style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}
          >
            Contact Us
          </a>
        </div>
      </div>
    </MobileShell>
  );
}

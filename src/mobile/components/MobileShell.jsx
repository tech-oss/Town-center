import MobileTabBar from "./MobileTabBar";

// Phone-shaped frame on wide viewports (desktop demo); full-bleed on an actual
// phone / TWA, where the viewport itself is already phone-width.
export default function MobileShell({ children, noPadding }) {
  return (
    <div className="mobile-root min-h-screen flex items-center justify-center sm:py-8" style={{ backgroundColor: "#0c1418" }}>
      <div
        className="relative w-full sm:max-w-[430px] sm:rounded-[2.5rem] sm:border-8 overflow-hidden flex flex-col"
        style={{
          height: "100dvh",
          maxHeight: "100dvh",
          backgroundColor: "var(--forest)",
          borderColor: "#000",
        }}
      >
        {/* status bar spacer */}
        <div style={{ height: "env(safe-area-inset-top, 0px)", flexShrink: 0 }} />

        <div
          className={`flex-1 overflow-y-auto scrollbar-none ${noPadding ? "" : "px-5 pt-6"}`}
          style={{ paddingBottom: "88px" }}
        >
          {children}
        </div>

        <MobileTabBar />
      </div>
    </div>
  );
}

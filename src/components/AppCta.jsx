import AppBadges from "./AppBadges";

export default function AppCta() {
  return (
    <section className="px-6 md:px-12 py-16 md:py-20" style={{ backgroundColor: "var(--sand)" }}>
      <div
        className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative px-8 md:px-14 py-12 md:py-16"
        style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}
      >
        {/* subtle glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 80% at 90% 20%, rgba(82,199,182,0.28) 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center gap-8 md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--sage)" }}>
              Maidenhead in your pocket
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              Take the whole town with you
            </h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--mint)" }}>
              Discover what's on, find offers, navigate the town centre and keep your favourite places close
              — download the Maidenhead app and never miss a thing.
            </p>
          </div>
          <div className="shrink-0">
            <AppBadges />
          </div>
        </div>
      </div>
    </section>
  );
}

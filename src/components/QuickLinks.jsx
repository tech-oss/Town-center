import { quickLinks } from "../Data/content";

export default function QuickLinks() {
  return (
    <section
      className="py-20 px-6 md:px-12"
      // Subtle gradient from --mint to --sand so it doesn't sit as one heavy block
      style={{
        background:
          "linear-gradient(160deg, var(--mint) 0%, var(--sand) 60%)",
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--leaf)" }}
          >
            {quickLinks.eyebrow}
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ color: "var(--forest)" }}
          >
            {quickLinks.heading}
          </h2>
        </div>

        {/* ── Tile grid ──
            2 cols on mobile, 3 on sm/tablet, 6 on lg+ desktop */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
          {quickLinks.items.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="group flex flex-col items-center gap-3 focus:outline-none"
                // Accessible focus ring on the whole tile
                style={{ borderRadius: "9999px" }}
              >
                {/* ── Circle wrapper ──
                    overflow-hidden keeps the zoomed image clipped to the circle.
                    The sage ring fades in on hover via a box-shadow trick
                    (no extra DOM node needed). */}
                <div
                  className="
                    relative rounded-full overflow-hidden
                    w-32 h-32 sm:w-36 sm:h-36 lg:w-44 lg:h-44
                    transition-all duration-300 ease-out
                    group-hover:-translate-y-1
                    group-hover:shadow-[0_0_0_4px_var(--sage)]
                    group-focus-visible:shadow-[0_0_0_4px_var(--sage)]
                    shadow-md
                  "
                >
                  {/* Photo — zooms inside the circle on hover */}
                  <img
                    src={item.image}
                    alt={item.label}
                    loading="lazy"
                    className="
                      w-full h-full object-cover
                      transition-transform duration-300 ease-out
                      group-hover:scale-110
                    "
                  />

                  {/* Subtle dark scrim so label area has contrast headroom */}
                  <div
                    className="absolute inset-0 rounded-full transition-opacity duration-300 group-hover:opacity-20"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, transparent 40%, rgba(28,46,56,0.35) 100%)",
                    }}
                  />
                </div>

                {/* ── Label ── */}
                <span
                  className="
                    text-sm font-semibold text-center leading-tight
                    transition-colors duration-300
                    group-hover:text-[var(--leaf)]
                  "
                  style={{ color: "var(--forest)" }}
                >
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

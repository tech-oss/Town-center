import { quickLinks } from "../Data/content";
import SmartLink from "./SmartLink";

export default function QuickLinks() {
  return (
    <section
      className="py-16 md:py-24 px-6 md:px-12"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* ── Intro copy (editorial serif, right-aligned) ── */}
        <p
          className="text-right mb-12 md:mb-16 text-2xl md:text-[2.5rem]"
          style={{
            color: "#000000",
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 400,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {quickLinks.intro}
        </p>

        {/* ── Header (left-aligned) ── */}
        <div className="mb-8 md:mb-12">
          <p
            className="text-sm font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: "var(--leaf)" }}
          >
            {quickLinks.eyebrow}
          </p>
          <h2
            className="explore-heading text-4xl md:text-5xl"
            style={{ color: "#000000" }}
          >
            {quickLinks.heading}
          </h2>
        </div>

        {/* ── Card grid ──
            2 cols on mobile, 3 on tablet, 6 in a single row on desktop */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {quickLinks.items.map((item) => (
            <li key={item.label}>
              <SmartLink
                to={item.href}
                className="group relative block rounded-2xl overflow-hidden aspect-square lg:aspect-[3/4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
                style={{ boxShadow: "0 10px 30px -12px rgba(28,46,56,0.45)" }}
              >
                {/* Media — looping muted video when available, else photo.
                    object-cover + object-center fills the card at any aspect
                    ratio (portrait 9:16 clips cleanly into the square / 3:4 card). */}
                {item.video ? (
                  <video
                    src={item.video}
                    poster={item.image}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    aria-label={item.label}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={item.image}
                    alt={item.label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                )}

                {/* Dark gradient so the label reads clearly */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(12,20,24,0.78) 0%, rgba(12,20,24,0.15) 45%, rgba(12,20,24,0) 70%)",
                  }}
                />

                {/* ── Label (bottom-left, serif) ── */}
                <span
                  className="absolute bottom-0 left-0 p-4 text-lg md:text-xl font-bold leading-tight text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.label}
                </span>
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

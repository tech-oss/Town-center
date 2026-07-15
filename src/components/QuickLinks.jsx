import { quickLinks } from "../Data/content";
import SmartLink from "./SmartLink";

export default function QuickLinks() {
  return (
    <section
      className="py-16 md:py-24 px-6 md:px-12"
      style={{ backgroundColor: "#F4EFE3" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* ── Header (left-aligned) ── */}
        <div className="mb-8 md:mb-12">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: "rgba(28,46,56,0.5)" }}
          >
            {quickLinks.eyebrow}
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold"
            style={{ color: "var(--forest)" }}
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
                {/* Photo — gentle zoom on hover */}
                <img
                  src={item.image}
                  alt={item.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />

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

import { planVisit } from "../Data/content";
import WeatherWidget from "./WeatherWidget";
import SmartLink from "./SmartLink";

const { getAround } = planVisit;

// Clean line icons keyed by option id
function OptionIcon({ id }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  if (id === "parking") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M9.5 16.5V7.5h3.2a2.6 2.6 0 010 5.2H9.5" />
      </svg>
    );
  }
  if (id === "transport") {
    return (
      <svg {...common}>
        <rect x="5" y="3" width="14" height="13" rx="3" />
        <path d="M5 11h14" />
        <circle cx="8.5" cy="13.5" r="0.6" fill="currentColor" />
        <circle cx="15.5" cy="13.5" r="0.6" fill="currentColor" />
        <path d="M7.5 16l-1.5 3M16.5 16l1.5 3" />
      </svg>
    );
  }
  // maps
  return (
    <svg {...common}>
      <path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
      <path d="M9 4v13M15 6.5v13" />
    </svg>
  );
}

export default function PlanVisit() {
  return (
    <section
      id="plan-visit"
      className="py-24 px-6 md:px-12"
      style={{ background: "linear-gradient(160deg, var(--sand) 0%, var(--mint) 100%)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>
            {planVisit.eyebrow}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>
            {planVisit.heading}
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--ink)", opacity: 0.75 }}>
            {planVisit.intro}
          </p>
        </div>

        {/* 7-day Maidenhead weather — right below the heading */}
        <WeatherWidget />

        {/* Two-column: options list + image */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
          {/* Left — Parking / Transport / Maps */}
          <div className="flex flex-col">
            {getAround.options.map((opt, i) => (
              <SmartLink
                key={opt.id}
                to={opt.href}
                className="group flex items-center gap-5 py-6 transition-colors duration-200"
                style={{
                  borderTop: "1px solid rgba(28,46,56,0.14)",
                  borderBottom: i === getAround.options.length - 1 ? "1px solid rgba(28,46,56,0.14)" : "none",
                }}
              >
                <span
                  className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: "var(--forest)" }}
                >
                  <OptionIcon id={opt.id} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-lg leading-snug" style={{ color: "var(--forest)" }}>
                    {opt.title}
                  </span>
                  <span className="block text-sm mt-0.5" style={{ color: "var(--ink)", opacity: 0.6 }}>
                    {opt.subtitle}
                  </span>
                </span>
                <span
                  className="shrink-0 text-xl transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: "var(--forest)" }}
                  aria-hidden="true"
                >
                  →
                </span>
              </SmartLink>
            ))}
          </div>

          {/* Right — image */}
          <div className="rounded-3xl overflow-hidden aspect-[16/9] shadow-[0_24px_60px_-24px_rgba(28,46,56,0.45)]">
            <img
              src={getAround.image}
              alt={getAround.imageAlt}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

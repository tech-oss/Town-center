import { Link } from "react-router-dom";
import { features } from "../Data/features";

export default function FeatureBlocks() {
  return (
    <section className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>
            In Focus
          </p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "var(--forest)" }}>
            Featured Stories
          </h2>
        </div>

        <div className="flex flex-col gap-20 md:gap-28">
          {features.map((f, i) => (
            <div
              key={f.slug}
              className={`grid md:grid-cols-2 gap-8 md:gap-14 items-center ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              {/* Image */}
              <Link to={`/story/${f.slug}`} className="group block w-full overflow-hidden rounded-3xl shadow-[0_20px_50px_-20px_rgba(28,46,56,0.4)]">
                <img
                  src={f.cardImage}
                  alt={f.cardHeading}
                  className="w-full h-72 md:h-[26rem] object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </Link>

              {/* Copy */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--leaf)" }}>
                  {f.eyebrow}
                </p>
                <h3 className="text-3xl md:text-5xl font-bold leading-tight mb-5" style={{ color: "var(--forest)" }}>
                  {f.cardHeading}
                </h3>
                <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: "var(--ink)", opacity: 0.75 }}>
                  {f.cardBody}
                </p>
                <Link
                  to={`/story/${f.slug}`}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--sage)" }}
                >
                  Read more
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

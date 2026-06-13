import { featureBlocks } from "../Data/content";
import SmartLink from "./SmartLink";

export default function FeatureBlocks() {
  return (
    <section className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-20 md:gap-28">
        {featureBlocks.blocks.map((block) => (
          <div
            key={block.id}
            className={`flex flex-col gap-8 md:gap-14 items-center ${
              block.imageLeft ? "md:flex-row-reverse" : "md:flex-row"
            }`}
          >
            {/* Image — rounded, soft shadow, gentle zoom on hover */}
            <div className="md:w-1/2 w-full group overflow-hidden rounded-3xl shadow-[0_20px_50px_-20px_rgba(28,46,56,0.4)]">
              <img
                src={block.imageSrc}
                alt={block.imageAlt}
                className="w-full h-72 md:h-[26rem] object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>

            {/* Copy */}
            <div className="md:w-1/2 w-full">
              <p
                className="text-xs font-semibold tracking-widest uppercase mb-4"
                style={{ color: "var(--leaf)" }}
              >
                {block.eyebrow}
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold leading-tight mb-5"
                style={{ color: "var(--forest)" }}
              >
                {block.heading}
              </h2>
              <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: "var(--ink)", opacity: 0.75 }}>
                {block.body}
              </p>
              <SmartLink
                to={block.cta.href}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--sage)" }}
              >
                {block.cta.label}
                <span>→</span>
              </SmartLink>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

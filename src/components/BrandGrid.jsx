import { Link } from "react-router-dom";
import { brandGrid } from "../Data/content";
import SmartLink from "./SmartLink";
import { card } from "../utils/design";

export default function BrandGrid() {
  return (
    <section className="py-24 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>
          {brandGrid.eyebrow}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>
          {brandGrid.heading}
        </h2>
        <p className="text-base mb-14 max-w-xl mx-auto leading-relaxed" style={{ color: "var(--ink)", opacity: 0.72 }}>
          {brandGrid.subheading}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-14">
          {brandGrid.brands.map((brand) => {
            const Tile = brand.to ? Link : "div";
            const tileProps = brand.to ? { to: brand.to } : {};
            return (
              <Tile
                key={brand.id}
                {...tileProps}
                className="group bg-white p-5 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1"
                style={{ borderRadius: card.radius, boxShadow: card.shadow }}
              >
                {/* Logo tile — white background, logo contained & centered */}
                <div className="w-full h-24 flex items-center justify-center overflow-hidden bg-white" style={{ borderRadius: card.radius }}>
                  <img
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    loading="lazy"
                    className="max-h-20 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--forest)" }}>
                    {brand.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink)", opacity: 0.5 }}>
                    {brand.category}
                  </p>
                </div>
              </Tile>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {brandGrid.ctas.map((cta) => (
            <SmartLink
              key={cta.href}
              to={cta.href}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--sage)" }}
            >
              {cta.label}
              <span>→</span>
            </SmartLink>
          ))}
        </div>
      </div>
    </section>
  );
}

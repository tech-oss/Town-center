import { cropStyle } from "../../lib/focalPoint";

// The app's page header picture: full width, edge to edge under the top bar,
// with the page title over its bottom-left — the Hotels look, used on every
// listing screen so they all match. `flush` is for screens whose shell has
// no padding; otherwise the header pulls itself out to the screen edges.
export default function MobileHero({ src, title, flush = false }) {
  if (!src) return null;
  return (
    <div className={`relative h-40 shrink-0 ${flush ? "" : "-mx-5 -mt-5"}`}>
      <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" style={cropStyle(src, "hero")} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.05) 0%, rgba(20,33,42,0.55) 100%)" }} />
      {title && (
        <p className="absolute bottom-3 left-5 right-5 text-white text-lg font-bold" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
          {title}
        </p>
      )}
    </div>
  );
}

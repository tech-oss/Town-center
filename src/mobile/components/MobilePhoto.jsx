// The website frames article and guide pictures in a fixed aspect ratio with
// a blurred copy of the photo behind (see SpotlightImage in
// FeatureArticlePage.jsx). The app used short fixed heights instead — h-56 for
// a hero, h-48 for a section picture — which cropped the top and bottom off
// the same photo. This keeps the two consistent: the same ratios as the
// website, and the whole picture inside the frame.
export default function MobilePhoto({ src, alt = "", aspect = "aspect-[16/9]", rounded = "", className = "" }) {
  if (!src) return null;
  return (
    <div
      className={`relative w-full overflow-hidden ${aspect} ${rounded} ${className}`}
      style={{ backgroundColor: "#1a1a1a" }}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scale(1.25)", filter: "blur(2px) brightness(0.9) saturate(1.05)" }}
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-contain"
      />
    </div>
  );
}

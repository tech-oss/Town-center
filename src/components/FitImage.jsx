import { imageUrl, imageSrcSet } from "../lib/imageUrl";

// Shows an uploaded picture whole, whatever shape its box is.
//
// Businesses and admin upload pictures of every shape — mostly landscape
// headers — into cards and tiles that are square, 4:3 or 16:9. Filling the
// box ("cover") cut the sides off: a takeaway's sign lost its first letters.
// This shows the entire picture centred ("contain") over a blurred, enlarged
// copy of itself, so the box is filled without cropping anything and without
// plain bars.
//
// `className` sizes and positions the box (e.g. "w-full h-full" or
// "absolute inset-0"); `imgClassName` goes on the picture itself (hover
// zoom and the like).
export default function FitImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  size = "card",
  sizes,
  eager = false,
  style,
}) {
  if (!src) return null;
  const url = imageUrl(src, size);
  const srcSet = imageSrcSet(src);
  const positioned = /\babsolute\b/.test(className);
  return (
    <span className={`${positioned ? "" : "relative "}block overflow-hidden ${className}`} style={style}>
      <img
        src={url}
        alt=""
        aria-hidden="true"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl"
        style={{ opacity: 0.85 }}
      />
      <span className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} aria-hidden="true" />
      <img
        src={url}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        className={`absolute inset-0 w-full h-full object-contain ${imgClassName}`}
      />
    </span>
  );
}

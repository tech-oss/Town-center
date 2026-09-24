import { focalPosition } from "../lib/focalPoint";
import { imageUrl, imageSrcSet } from "../lib/imageUrl";

// One <img> for every picture that gets cropped to fit a box.
//
// Three things it does that a bare <img className="object-cover"> does not:
//
//   1. Crops around the subject. The focal point stored on the URL becomes
//      `object-position`, so the part that matters stays in frame whatever
//      shape the box is. See lib/focalPoint.js for why that is the fix and
//      not a fixed upload size.
//
//   2. Asks Storage for a sensible width, and offers a srcset, so a phone
//      does not download a 1600px hero.
//
//   3. Leaves a coloured box behind the picture while it loads, instead of
//      the white flash of an empty <img>.
//
// `size` is the largest the picture is shown at, matching IMAGE_SIZES.
// `sizes` is the CSS the browser needs to pick from the srcset; without it
// the browser assumes full viewport width and picks the biggest every time.

export default function SmartImage({
  src,
  alt = "",
  size = "card",
  sizes,
  className = "",
  // Heroes are the first thing on the page; everything else can wait.
  eager = false,
  style,
  ...rest
}) {
  if (!src) return null;

  return (
    <img
      src={imageUrl(src, size)}
      srcSet={imageSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      className={className}
      style={{
        // The whole point: crop around the subject, not the middle.
        objectPosition: focalPosition(src),
        ...style,
      }}
      {...rest}
    />
  );
}

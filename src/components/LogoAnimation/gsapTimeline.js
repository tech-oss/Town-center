import { gsap } from "gsap";

/**
 * Builds the cinematic intro timeline for the Maidenhead logo.
 *
 * The mark asset is a raster image wrapped in SVG (no vector paths), so the
 * "drawn by light" phase is achieved with a travelling gradient mask + a
 * synchronised glow edge rather than literal stroke drawing — visually
 * equivalent, and it uses the brand asset untouched.
 *
 * All motion is transforms / opacity / CSS-variable masks — no layout
 * properties are animated.
 *
 * @param {Object} els        Resolved DOM nodes (see LogoAnimation.jsx)
 * @param {Function} onSettle Called once the intro has fully settled
 * @returns {gsap.core.Timeline}
 */
export function buildLogoTimeline(els, onSettle) {
  const {
    root,
    ambient,
    markWrap,
    markGhost,
    markColor,
    glowEdge,
    sweep,
    letters,
    tagline,
  } = els;

  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    onComplete: onSettle,
  });

  /* ── Phase 1 · Ambient introduction (0 – 0.3s) ─────────────────────────── */
  tl.set(letters, { willChange: "transform, filter" }, 0)
    .to(root, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, 0)
    .to(ambient, { autoAlpha: 1, duration: 0.6, ease: "sine.out" }, 0);

  /* ── Phase 2 · Logo construction — light reveal (0.3 – 1.3s) ───────────────
     A diagonal gradient mask (driven by the --reveal CSS variable) uncovers
     the luminous ghost of the mark at constant speed while a soft teal glow
     travels along the reveal edge, then breathes out. */
  tl.set(markGhost, { autoAlpha: 1 }, 0.3)
    .to(markWrap, { "--reveal": 1, duration: 1.0, ease: "none" }, 0.3)
    .fromTo(
      glowEdge,
      { xPercent: -70, autoAlpha: 0 },
      { xPercent: 70, autoAlpha: 0.9, duration: 1.0, ease: "none" },
      0.3
    )
    .to(glowEdge, { autoAlpha: 0, duration: 0.35, ease: "sine.out" }, 1.3);

  /* ── Phase 3 · Colour reveal (1.3 – 1.7s) ──────────────────────────────────
     The original full-colour mark crossfades over the luminous ghost while
     the whole mark settles through a refined 96 → 101 → 100 % scale. */
  tl.to(markColor, { autoAlpha: 1, duration: 0.4, ease: "sine.inOut" }, 1.3)
    .to(markGhost, { autoAlpha: 0, duration: 0.4, ease: "sine.inOut" }, 1.3)
    .fromTo(
      markWrap,
      { scale: 0.96 },
      { scale: 1.01, duration: 0.3, ease: "power1.inOut" },
      1.3
    )
    .to(markWrap, { scale: 1, duration: 0.25, ease: "power1.out" }, 1.6);

  /* ── Phase 4 · Company name (1.6 – 2.2s) ─────────────────────────────── */
  tl.to(
    letters,
    {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.45,
      ease: "power2.out",
      stagger: 0.032,
    },
    1.6
  );

  /* ── Phase 5 · Tagline (2.1 – 2.5s) ──────────────────────────────────── */
  tl.to(tagline, { autoAlpha: 1, y: 0, duration: 0.4, ease: "sine.out" }, 2.1);

  /* ── Phase 6 · Premium light sweep (2.4 – 3.0s) ────────────────────────────
     One diagonal pass of soft glass-light, masked to the logo mark only. */
  tl.fromTo(
    sweep,
    { xPercent: -160, autoAlpha: 0 },
    { xPercent: 160, autoAlpha: 0.55, duration: 0.6, ease: "sine.inOut" },
    2.4
  ).to(sweep, { autoAlpha: 0, duration: 0.18, ease: "sine.out" }, 2.86);

  return tl;
}

/**
 * Reduced-motion variant: no construction, no sweep — the finished logo
 * simply fades in over 300ms.
 */
export function buildReducedTimeline(els, onSettle) {
  const { root, ambient, markColor, letters, tagline } = els;

  const tl = gsap.timeline({ onComplete: onSettle });
  tl.set([letters, tagline], { y: 0, filter: "blur(0px)" })
    .set(markColor, { autoAlpha: 1 })
    .set([letters, tagline], { autoAlpha: 1 })
    .set(ambient, { autoAlpha: 1 })
    .to(root, { autoAlpha: 1, duration: 0.3, ease: "power1.out" });

  return tl;
}

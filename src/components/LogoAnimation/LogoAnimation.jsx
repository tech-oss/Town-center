import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { buildLogoTimeline, buildReducedTimeline } from "./gsapTimeline";
import styles from "./LogoAnimation.module.css";

const MARK_SRC = "/logo-mark.svg";
const NAME = "Maidenhead";
const TAGLINE = "Riverside. Connected. Thriving.";

/**
 * Cinematic intro animation for the Maidenhead brand lockup.
 *
 * · ~3s GSAP timeline: ambient fade → light-reveal of the mark → colour
 *   settle (96 → 101 → 100 %) → staggered wordmark → tagline → one glass
 *   light-sweep across the mark only. Then everything is perfectly still.
 * · Honours prefers-reduced-motion (simple 300ms fade of the finished logo).
 * · Hover (enabled only after the intro settles): scale 1.015 + slight
 *   brightness/saturation lift, 280ms.
 *
 * @param {Function} [onComplete] Optional callback once the intro settles.
 */
export default function LogoAnimation({ onComplete }) {
  const rootRef = useRef(null);
  const [settled, setSettled] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = gsap.utils.selector(root);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // gsap.context scopes every tween/set to this component and lets a single
    // revert() restore all inline styles on unmount.
    const ctx = gsap.context(() => {
      const els = {
        root,
        ambient: q(`.${styles.ambient}`),
        markWrap: q(`.${styles.markWrap}`),
        markGhost: q(`.${styles.markGhost}`),
        markColor: q(`.${styles.markColor}`),
        glowEdge: q(`.${styles.glowEdge}`),
        sweep: q(`.${styles.sweep}`),
        letters: q(`.${styles.letter}`),
        tagline: q(`.${styles.tagline}`),
      };

      const settle = () => {
        // Drop will-change hints once the intro is done — the logo is
        // perfectly still from here on, so no compositor layers are needed.
        gsap.set(els.letters, { clearProps: "willChange" });
        setSettled(true);
        onComplete?.();
      };

      const tl = reduced
        ? buildReducedTimeline(els, settle)
        : buildLogoTimeline(els, settle);

      // Dev-only escape hatch so the timeline can be scrubbed from the
      // console / automated tests (backgrounded tabs suspend rAF).
      if (import.meta.env.DEV) window.__logoTl = tl;
    }, root);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-settled={settled || undefined}
      role="img"
      aria-label={`${NAME} — ${TAGLINE}`}
    >
      <div className={styles.ambient} aria-hidden="true" />

      <div className={styles.logoGroup}>
        <div className={styles.markWrap}>
          {/* Luminous ghost revealed first, then crossfaded to the original */}
          <img className={styles.markGhost} src={MARK_SRC} alt="" aria-hidden="true" draggable="false" />
          <img className={styles.markColor} src={MARK_SRC} alt="" aria-hidden="true" draggable="false" />
          <div className={styles.glowEdge} aria-hidden="true" />
          {/* Light sweep, masked to the mark's own pixels */}
          <div className={styles.sweepMask} aria-hidden="true">
            <div className={styles.sweep} />
          </div>
        </div>

        <p className={styles.name} aria-hidden="true">
          {NAME.split("").map((ch, i) => (
            <span key={i} className={styles.letter}>
              {ch}
            </span>
          ))}
        </p>

        <p className={styles.tagline} aria-hidden="true">
          {TAGLINE}
        </p>
      </div>
    </div>
  );
}

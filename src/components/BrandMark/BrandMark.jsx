import { header } from "../../Data/content";
import styles from "./BrandMark.module.css";

const MARK_SRC = header.markSrc;

/**
 * The animated "M" brand mark for the header & footer lockups.
 *
 * Renders the colour mark plus the layers the 6-phase reveal drives
 * (hooks/useLogoReveal): a luminous ghost for the stroke-draw, a travelling
 * edge glow, and a light sweep. All layers are tagged with data-attributes so
 * the hook can find them; when the reveal is skipped, only the colour mark
 * shows (see the CSS default --reveal:1).
 *
 * @param {string} imgClassName Height/utility classes for the mark (e.g. "h-14 md:h-16 w-auto").
 */
export default function BrandMark({ imgClassName = "" }) {
  return (
    <span data-logo-markwrap className={styles.wrap} aria-hidden="true">
      <img
        data-logo-mark
        src={MARK_SRC}
        alt=""
        aria-hidden="true"
        draggable="false"
        className={`${styles.color} ${imgClassName}`}
      />
      <img
        data-logo-ghost
        src={MARK_SRC}
        alt=""
        aria-hidden="true"
        draggable="false"
        className={styles.ghost}
      />
      <span data-logo-glow className={styles.glow} />
      <span data-logo-sweepmask className={styles.sweepMask}>
        <span data-logo-sweep className={styles.sweep} />
      </span>
    </span>
  );
}

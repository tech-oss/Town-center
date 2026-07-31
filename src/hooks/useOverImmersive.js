import { useEffect, useState } from "react";

/**
 * True while an element marked `data-immersive` sits under the fixed header.
 *
 * Full-bleed interactive regions — the traders map — run edge to edge, so the
 * overlay header floats on top of them and swallows clicks, drags and wheel
 * gestures meant for the map. While such a region is in the header's band the
 * header gets out of the way; it returns as soon as the region scrolls clear.
 *
 * Deliberately overrides the pointer-near-the-top reveal in useHeaderScroll:
 * moving the cursor toward the top of the map must not summon the nav back
 * over it.
 *
 * @param {number} [fallbackHeight]  Band height to assume before the header can
 *                                   be measured (it varies with breakpoint).
 */
export default function useOverImmersive(fallbackHeight = 96) {
  const [over, setOver] = useState(false);

  useEffect(() => {
    let raf = 0;

    const check = () => {
      raf = 0;
      // Measure the real header rather than assuming a height — the utility bar
      // makes it materially taller on desktop than on mobile.
      const header = document.querySelector("header");
      const band = header?.offsetHeight || fallbackHeight;
      let hit = false;
      for (const el of document.querySelectorAll("[data-immersive]")) {
        const r = el.getBoundingClientRect();
        // The region overlaps the header band when it starts above the band's
        // lower edge and hasn't yet scrolled past the top of the viewport.
        if (r.top < band && r.bottom > 0) { hit = true; break; }
      }
      setOver(hit);
    };

    // Scroll/resize are rAF-throttled, but the mount check runs synchronously so
    // a page restored mid-map starts in the right state.
    const queue = () => { if (!raf) raf = requestAnimationFrame(check); };

    check();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fallbackHeight]);

  return over;
}

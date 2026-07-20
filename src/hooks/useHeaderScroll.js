import { useEffect, useRef, useState } from "react";

/**
 * Drives the premium overlay-header behaviour (Battersea-style) with a single
 * rAF-throttled scroll listener and a rAF-throttled pointer listener.
 *
 * Returns two booleans, each only flipping (and thus only re-rendering) when the
 * value actually changes — never on every scroll frame:
 *
 *   hidden — header should slide out of view (scrolling down, away from the top).
 *   solid  — header should show the solid brand background (+ shadow) rather than
 *            being transparent over the hero video.
 *
 * Rules:
 *   • Home page, at the very top, pointer not near the header → transparent.
 *   • Any downward scroll past the header → hidden.
 *   • Upward scroll, or reaching the top, or pointer near the top → visible.
 *   • Scrolled away from the top (or any non-home page) → solid background.
 *   • Pointer near the top edge while over the hero → solid + revealed.
 *
 * @param {boolean} isHome  Whether the current route has the transparent hero.
 */
export default function useHeaderScroll(isHome) {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(!isHome);

  // Mutable scratch state kept in a ref so scroll/pointer handlers never go
  // stale and never trigger renders themselves.
  const s = useRef({ lastY: 0, hidden: false, solid: !isHome, nearTop: false });

  useEffect(() => {
    const REVEAL_ZONE = 90; // px from top that counts as "near the navigation"
    const HIDE_AFTER = 80;  // don't hide until scrolled past ~the header height

    // Reset for the (possibly new) route.
    s.current.lastY = window.scrollY;
    s.current.hidden = false;
    s.current.solid = !isHome ? true : window.scrollY > 4;
    s.current.nearTop = false;
    setHidden(s.current.hidden);
    setSolid(s.current.solid);

    let scrollQueued = false;
    let pointerQueued = false;

    const apply = () => {
      const st = s.current;
      const y = window.scrollY;
      const atTop = y <= 4;
      const dir = y > st.lastY ? "down" : "up";
      st.lastY = y <= 0 ? 0 : y;

      const nextHidden = dir === "down" && y > HIDE_AFTER && !st.nearTop;
      const nextSolid = !isHome ? true : !atTop || st.nearTop;

      if (nextHidden !== st.hidden) {
        st.hidden = nextHidden;
        setHidden(nextHidden);
      }
      if (nextSolid !== st.solid) {
        st.solid = nextSolid;
        setSolid(nextSolid);
      }
    };

    const onScroll = () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        apply();
      });
    };

    const onPointerMove = (e) => {
      if (pointerQueued) return;
      pointerQueued = true;
      const clientY = e.clientY;
      requestAnimationFrame(() => {
        pointerQueued = false;
        const near = clientY < REVEAL_ZONE;
        const st = s.current;
        if (near === st.nearTop) return;
        st.nearTop = near;

        // Pointer near the top reveals the header and (on the hero) makes it solid.
        const atTop = window.scrollY <= 4;
        const nextSolid = !isHome ? true : !atTop || near;
        if (nextSolid !== st.solid) {
          st.solid = nextSolid;
          setSolid(nextSolid);
        }
        if (near && st.hidden) {
          st.hidden = false;
          setHidden(false);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    apply();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [isHome]);

  return { hidden, solid };
}

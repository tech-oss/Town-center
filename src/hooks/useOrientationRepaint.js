import { useEffect } from "react";

// iOS/iPadOS Safari can fail to properly repaint composited content (CSS
// Grid children sized off an intrinsic image, aspect-ratio boxes, the fixed
// header) right after an orientation change — the previous orientation's
// painted pixels linger under the new layout until the next scroll or
// touch, showing as overlapping text/images or a stray blank gap at the top
// of the page. Forcing a synchronous reflow once the rotation animation has
// settled clears the stale paint; it's a no-op with no visible side effect
// on browsers that don't have the bug.
export default function useOrientationRepaint() {
  useEffect(() => {
    let timer;
    const forceReflow = () => {
      const el = document.documentElement;
      const prevTransform = el.style.transform;
      el.style.transform = "translateZ(0)";
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight; // read layout to force the reflow before undoing
      el.style.transform = prevTransform;
      // A same-position scroll nudge additionally forces Safari to
      // re-evaluate fixed/sticky positioned elements (e.g. the header).
      window.scrollTo(window.scrollX, window.scrollY);
    };
    const onOrientationChange = () => {
      clearTimeout(timer);
      // orientationchange fires before the viewport has actually settled
      // to its new size on iOS — wait for the rotation animation to finish.
      timer = setTimeout(forceReflow, 300);
    };
    window.addEventListener("orientationchange", onOrientationChange);
    return () => {
      window.removeEventListener("orientationchange", onOrientationChange);
      clearTimeout(timer);
    };
  }, []);
}

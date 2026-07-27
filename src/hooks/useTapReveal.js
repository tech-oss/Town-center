import { useCallback, useState } from "react";

// Spotlight-style cards wrap their image in a link so desktop hover +
// click both work as "go to the story". On touch devices there's no
// hover, so a tap on the image instead toggles the same reveal effect
// (via the .is-revealed class) rather than navigating — the dedicated
// "Read more" affordance is what actually takes mobile users through.
export default function useTapReveal() {
  const [revealed, setRevealed] = useState(false);

  const onImageClick = useCallback((e) => {
    if (typeof window !== "undefined" && window.matchMedia?.("(hover: none)").matches) {
      e.preventDefault();
      setRevealed((r) => !r);
    }
  }, []);

  return { revealed, onImageClick };
}

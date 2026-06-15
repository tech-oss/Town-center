import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Scrolls to the top whenever the pathname changes.
// Category switches within listing sections use ?category= search params,
// so the pathname stays the same and this never fires for those.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Scrolls to the top on every route change (e.g. clicking the logo to go Home
// from a scrolled page now lands at the top, not the previous scroll position).
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Listing sections whose category switches should preserve scroll position.
const LISTING_RE = /^\/(see-do|shop|eat-drink)(\/category\/[^/]+)?\/?$/;

// Scrolls to the top on route change — except when the user is just switching
// category within the same listing section (e.g. /see-do → /see-do/category/film),
// where the page should stay where it is.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const prev = useRef(pathname);

  useLayoutEffect(() => {
    const from = prev.current;
    const sameSectionFilter =
      LISTING_RE.test(pathname) &&
      LISTING_RE.test(from) &&
      pathname.split("/")[1] === from.split("/")[1];

    if (!sameSectionFilter) window.scrollTo(0, 0);
    prev.current = pathname;
  }, [pathname]);

  return null;
}

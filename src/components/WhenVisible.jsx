import { useEffect, useRef, useState } from "react";

// Shows `placeholder` until this spot is within `margin` of the screen, then
// `children`. For heavy things further down a page — the maps pull in about
// 900 KB of map engine, which every visitor used to download up front.
export default function WhenVisible({ children, placeholder, margin = "600px" }) {
  const ref = useRef(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (near || !ref.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setNear(true);
        io.disconnect();
      }
    }, { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near, margin]);

  return near ? children : <div ref={ref}>{placeholder}</div>;
}

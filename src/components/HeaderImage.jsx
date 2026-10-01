import { cropStyle } from "../lib/focalPoint";

// A website page's full-width header picture, framed as admin framed it in
// Site Content: the "wide" crop on a computer, the "tall" crop on a phone.
// `desktopSrc` is an optional separate picture for computers.
export default function HeaderImage({ src, desktopSrc, className = "", fit = "cover" }) {
  const mobile = src || desktopSrc;
  const desktop = desktopSrc || src;
  if (!mobile) return null;
  const base = `absolute inset-0 w-full h-full ${className}`;
  return (
    <>
      <img src={mobile} alt="" className={`${base} md:hidden`} style={{ objectFit: fit, ...cropStyle(mobile, "tall") }} />
      <img src={desktop} alt="" className={`${base} hidden md:block`} style={{ objectFit: fit, ...cropStyle(desktop, "wide") }} />
    </>
  );
}

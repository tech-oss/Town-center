import { useEffect, useRef, useState } from "react";

// Sitewide interception for clicks on external links: any <a href> pointing
// at a different hostname is caught in the capture phase (before the
// browser's default navigation and before target="_blank" opens a new tab),
// and held pending a "Leaving our website" confirmation. Catching this at
// the document level — rather than patching every business-page component —
// covers every external link (business websites, social icons, footer,
// article CTAs) in one place, present or future.
export default function useExternalLinkGuard() {
  const [pendingHref, setPendingHref] = useState(null);
  const pendingRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!anchor || anchor.dataset.skipExternalConfirm !== undefined) return;

      const rawHref = anchor.getAttribute("href") || "";
      if (!/^https?:\/\//i.test(rawHref)) return;

      let url;
      try {
        url = new URL(rawHref, window.location.href);
      } catch {
        return;
      }
      if (url.hostname === window.location.hostname) return;

      e.preventDefault();
      pendingRef.current = url.href;
      setPendingHref(url.href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const confirm = () => {
    if (pendingRef.current) {
      window.open(pendingRef.current, "_blank", "noopener,noreferrer");
    }
    pendingRef.current = null;
    setPendingHref(null);
  };

  const cancel = () => {
    pendingRef.current = null;
    setPendingHref(null);
  };

  return { pendingHref, confirm, cancel };
}

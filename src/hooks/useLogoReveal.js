import { useLayoutEffect } from "react";
import { gsap } from "gsap";

/**
 * Compact brand-lockup reveal for the site chrome (header / footer logos) —
 * the ~1s "light settle" edition of the full cinematic intro in
 * components/LogoAnimation: the mark condenses out of teal light, then the
 * wordmark blurs up and the tagline follows.
 *
 * Professional restraint rules:
 *  · Plays ONCE per browser session (sessionStorage) — SPA navigation and
 *    reloads within the session never replay it.
 *  · The footer variant waits until the lockup first scrolls into view.
 *  · prefers-reduced-motion skips the animation entirely (logo just shows).
 *  · Only transforms / opacity / filters are animated; layout never moves.
 *
 * Expected DOM inside rootRef: elements tagged with data-logo-mark,
 * data-logo-word, data-logo-tag (multiple lockups per root are fine — the
 * footer has desktop + mobile variants).
 */
const SESSION_PREFIX = "mh-logo-reveal:";

function hasPlayed(id) {
  try {
    return sessionStorage.getItem(SESSION_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

function markPlayed(id) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + id, "1");
  } catch {
    /* private mode — replaying next load is acceptable */
  }
}

export default function useLogoReveal(rootRef, { id, whenVisible = false } = {}) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const marks = root.querySelectorAll("[data-logo-mark]");
    if (!marks.length) return;
    const words = root.querySelectorAll("[data-logo-word]");
    const tags = root.querySelectorAll("[data-logo-tag]");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || hasPlayed(id)) return; // logo simply renders, fully static

    let io;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => markPlayed(id),
      });

      // Mark condenses out of teal light: bright, desaturated and haloed,
      // settling into its true colours. clearProps drops the filter (and its
      // compositing cost) the moment each tween finishes.
      tl.fromTo(
        marks,
        {
          autoAlpha: 0,
          scale: 0.92,
          filter:
            "brightness(2.3) saturate(0.35) drop-shadow(0 0 14px rgba(82,199,182,0.85))",
        },
        {
          autoAlpha: 1,
          scale: 1,
          filter:
            "brightness(1) saturate(1) drop-shadow(0 0 0px rgba(82,199,182,0))",
          duration: 0.75,
          ease: "power2.out",
          clearProps: "filter",
        },
        0
      )
        .fromTo(
          words,
          { autoAlpha: 0, y: 10, filter: "blur(6px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power2.out",
            clearProps: "filter",
          },
          0.28
        )
        .fromTo(
          tags,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "sine.out" },
          0.5
        );

      if (whenVisible) {
        // Hide immediately (a paused fromTo hasn't applied its start state
        // yet) so there's no flash before the observer fires.
        gsap.set([...marks, ...words, ...tags], { autoAlpha: 0 });
        io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              tl.play();
              io.disconnect();
            }
          },
          { threshold: 0.5 }
        );
        marks.forEach((m) => io.observe(m));
      } else {
        tl.play();
      }
    }, root);

    return () => {
      io?.disconnect();
      ctx.revert();
    };
  }, [rootRef, id, whenVisible]);
}

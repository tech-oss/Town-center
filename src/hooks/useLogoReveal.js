import { useLayoutEffect } from "react";
import { gsap } from "gsap";

/**
 * The cinematic brand reveal for the site chrome (header / footer logos).
 *
 * First load plays the full 6-phase sequence — the mark draws in, the wordmark
 * reveals, the tagline follows, and a light sweep passes. From then on ONLY the
 * "M" mark keeps looping (draw → settle → sweep, on a gentle repeat); the
 * wordmark and tagline stay put in their final positions. This keeps the rich
 * first impression while making the ongoing loop subtle and non-distracting.
 *
 * Implemented as two timelines so the text animates exactly once:
 *   · markTl  — mark draw / colour settle / light sweep, repeat: -1 (every loop)
 *   · textTl  — wordmark + tagline reveal, played once (first load only)
 * Both start together, so the first-load timing is identical to before.
 *
 * Guarantees:
 *  · prefers-reduced-motion skips all motion — the finished logo just shows.
 *  · Both timelines only run while the lockup is on screen (IntersectionObserver
 *    play/pause); a completed textTl never replays on scroll-back.
 *  · Every phase uses fromTo, so each mark repeat resets cleanly with no drift.
 *  · Only transforms / opacity / filters / the mask var are animated.
 *
 * Expected DOM inside rootRef (from BrandMark + the lockup markup); multiple
 * lockups per root are fine (the footer has desktop + mobile variants):
 *   [data-logo-markwrap] [data-logo-mark] [data-logo-ghost]
 *   [data-logo-glow] [data-logo-sweep] [data-logo-word] [data-logo-tag]
 */
export default function useLogoReveal(rootRef, { id } = {}) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const wrap = root.querySelectorAll("[data-logo-markwrap]");
    if (!wrap.length) return;
    const color = root.querySelectorAll("[data-logo-mark]");
    const ghost = root.querySelectorAll("[data-logo-ghost]");
    const glow = root.querySelectorAll("[data-logo-glow]");
    const sweep = root.querySelectorAll("[data-logo-sweep]");
    const words = root.querySelectorAll("[data-logo-word]");
    const tags = root.querySelectorAll("[data-logo-tag]");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // static logo (CSS defaults), no work

    let io;
    const ctx = gsap.context(() => {
      // Hide what the timelines bring in, synchronously and before paint, so
      // there's never a flash of the finished logo. --reveal:0 closes the mask;
      // the ghost shows THROUGH it as it opens, so ghost stays autoAlpha:1.
      gsap.set(wrap, { "--reveal": 0, willChange: "transform" });
      gsap.set(ghost, { autoAlpha: 1 });
      gsap.set(color, { autoAlpha: 0 });
      gsap.set([...glow, ...sweep], { autoAlpha: 0 });
      gsap.set(words, { autoAlpha: 0, y: 10, filter: "blur(6px)", willChange: "transform, filter" });
      gsap.set(tags, { autoAlpha: 0, y: 8 });

      // ── Mark loop — draws, settles and sweeps on every repeat ──────────────
      const markTl = gsap.timeline({
        paused: true,
        repeat: -1,
        repeatDelay: 2.8, // settled hold between draws
        defaults: { ease: "power2.out" },
      });

      // Stroke draw (0 → 0.75s)
      markTl
        .fromTo(wrap, { "--reveal": 0 }, { "--reveal": 1, duration: 0.75, ease: "none" }, 0)
        .fromTo(ghost, { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.75, ease: "none" }, 0)
        .fromTo(glow, { xPercent: -70, autoAlpha: 0 }, { xPercent: 70, autoAlpha: 0.9, duration: 0.75, ease: "none" }, 0)
        .to(glow, { autoAlpha: 0, duration: 0.3, ease: "sine.out" }, 0.6)
        // Form complete — colour crossfade + settle (0.6 → 1.0s)
        .fromTo(color, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "sine.inOut" }, 0.6)
        .to(ghost, { autoAlpha: 0, duration: 0.4, ease: "sine.inOut" }, 0.6)
        .fromTo(wrap, { scale: 0.96 }, { scale: 1.01, duration: 0.28, ease: "power1.inOut" }, 0.6)
        .to(wrap, { scale: 1, duration: 0.22, ease: "power1.out" }, 0.88)
        // Light sweep (1.6 → 2.2s)
        .fromTo(sweep, { xPercent: -160, autoAlpha: 0 }, { xPercent: 160, autoAlpha: 0.5, duration: 0.6, ease: "sine.inOut" }, 1.6)
        .to(sweep, { autoAlpha: 0, duration: 0.18, ease: "sine.out" }, 2.05);

      // ── Text reveal — plays ONCE on first load, then stays put ─────────────
      let textDone = false;
      const textTl = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.out" },
        onComplete: () => {
          textDone = true;
          gsap.set(words, { clearProps: "willChange" });
        },
      });
      textTl
        .fromTo(words, { autoAlpha: 0, y: 10, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 }, 0.95)
        .fromTo(tags, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "sine.out" }, 1.35);

      // Dev-only: expose timelines for console scrubbing / automated checks.
      if (import.meta.env.DEV) {
        window.__logoReveal = { ...(window.__logoReveal || {}), [id]: { markTl, textTl } };
      }

      // Run only while on screen. The text plays once — never replayed on
      // scroll-back (guarded by textDone; play() on a finished tl is a no-op
      // anyway, this just makes the intent explicit).
      io = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((e) => e.isIntersecting);
          if (visible) {
            markTl.play();
            if (!textDone) textTl.play();
          } else {
            markTl.pause();
            textTl.pause();
          }
        },
        { threshold: 0.4 }
      );
      wrap.forEach((m) => io.observe(m));
    }, root);

    return () => {
      io?.disconnect();
      ctx.revert();
    };
  }, [rootRef, id]);
}

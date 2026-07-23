import { useLayoutEffect } from "react";
import { gsap } from "gsap";

/**
 * The 6-phase cinematic brand reveal for the site chrome (header / footer
 * logos), played on a continuous gentle LOOP (à la bullring.co.uk): the mark
 * draws in, the lockup settles and holds, then the whole sequence redraws.
 *
 *   1. Fade in        — the mark begins hidden behind a closed reveal mask.
 *   2. Stroke draw     — a diagonal light mask uncovers the luminous ghost of
 *                        the mark while a soft teal glow rides the draw edge.
 *   3. Form complete   — the true-colour mark crossfades in and settles
 *                        (0.96 → 1.01 → 1).
 *   4. Text reveal     — the wordmark fades + slides up (blur → sharp).
 *   5. Tagline appear  — the tagline fades in just after.
 *   6. Light sweep     — one glass sweep crosses the mark; the lockup then
 *      & settle          holds fully settled for a beat before the loop repeats.
 *
 * One draw ≈ 2.2s + a ~2.8s settled hold ≈ a ~5s cycle.
 *
 * Professional guarantees:
 *  · prefers-reduced-motion skips all motion — the finished logo just shows.
 *  · The loop only runs while the lockup is on screen (IntersectionObserver
 *    play/pause), so an off-screen header/footer costs nothing.
 *  · Every phase uses fromTo, so each repeat resets cleanly with no drift.
 *  · Only transforms / opacity / filters / the mask var are animated; layout
 *    never moves. gsap.context reverts all inline styles on unmount.
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
      // will-change stays on for the whole loop — these layers are always
      // animating — and is reverted with every other inline style on unmount.
      gsap.set([...wrap, ...words], { willChange: "transform, filter" });

      const tl = gsap.timeline({
        paused: true,
        repeat: -1,
        repeatDelay: 2.8, // settled hold between draws
        defaults: { ease: "power2.out" },
      });

      // ── Phase 2 · Stroke draw (0 → 0.75s) ──
      tl.fromTo(
        wrap,
        { "--reveal": 0 },
        { "--reveal": 1, duration: 0.75, ease: "none" },
        0
      )
        .fromTo(
          ghost,
          { autoAlpha: 1 },
          { autoAlpha: 1, duration: 0.75, ease: "none" },
          0
        )
        .fromTo(
          glow,
          { xPercent: -70, autoAlpha: 0 },
          { xPercent: 70, autoAlpha: 0.9, duration: 0.75, ease: "none" },
          0
        )
        .to(glow, { autoAlpha: 0, duration: 0.3, ease: "sine.out" }, 0.6);

      // ── Phase 3 · Form complete — colour crossfade + settle (0.6 → 1.0s) ──
      tl.fromTo(color, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "sine.inOut" }, 0.6)
        .to(ghost, { autoAlpha: 0, duration: 0.4, ease: "sine.inOut" }, 0.6)
        .fromTo(
          wrap,
          { scale: 0.96 },
          { scale: 1.01, duration: 0.28, ease: "power1.inOut" },
          0.6
        )
        .to(wrap, { scale: 1, duration: 0.22, ease: "power1.out" }, 0.88);

      // ── Phase 4 · Text reveal (0.95 → 1.4s) ──
      tl.fromTo(
        words,
        { autoAlpha: 0, y: 10, filter: "blur(6px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45 },
        0.95
      );

      // ── Phase 5 · Tagline appear (1.35 → 1.7s) ──
      tl.fromTo(
        tags,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: "sine.out" },
        1.35
      );

      // ── Phase 6 · Light sweep & settle (1.6 → 2.2s) ──
      tl.fromTo(
        sweep,
        { xPercent: -160, autoAlpha: 0 },
        { xPercent: 160, autoAlpha: 0.5, duration: 0.6, ease: "sine.inOut" },
        1.6
      ).to(sweep, { autoAlpha: 0, duration: 0.18, ease: "sine.out" }, 2.05);

      // Dev-only: expose the timeline for console scrubbing / automated checks.
      if (import.meta.env.DEV) {
        window.__logoReveal = { ...(window.__logoReveal || {}), [id]: tl };
      }

      // Run the loop only while on screen — pause when scrolled away.
      io = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((e) => e.isIntersecting);
          if (visible) tl.play();
          else tl.pause();
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
